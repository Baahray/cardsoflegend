/* ===================== FROG FLING (side-on): the rules, no drawing, so they can be tested =====================
   x = metres forward, y = metres up, ground at y=0. The frog is a ball of radius FS.R. */
const FS={g:9.5,drag:.0006,R:.7,V:1.55,vMin:11,vMax:36,maxPull:5,chunk:50,reach:9.5,gripX:0,gripY:5.1,y0:3.9};
const FS_Z=[{k:"forest",n:"THE FOREST",x:0},{k:"road",n:"THE BUSY ROAD",x:230},{k:"village",n:"THE VILLAGE",x:340},{k:"town",n:"THE TOWN",x:700},{k:"city",n:"THE BIG CITY",x:1150}];
const FS_ROAD=[240,330];
const FS_MEDAL=[["bronze",200],["silver",500],["gold",1000]];
const fsZone=x=>{let i=0;for(let j=0;j<FS_Z.length;j++)if(x>=FS_Z[j].x)i=j;return i};
const fsMedal=d=>{let m=null;for(const [n,v] of FS_MEDAL)if(d>=v)m=n;return m};
/* things in the play layer. h: drawn height (m). c: solid boxes [half-width, from y, to y]. k: obst / soft / bnc (always bounces) / top (bounces if you land on it) / pick */
const FS_T={
  oak:{h:7,k:"obst",leaf:1,c:[[.5,0,3.3],[2.5,3.1,6.6]]},pine:{h:7.5,k:"obst",leaf:1,c:[[.45,0,1.6],[1.8,1.3,4.6],[1,4.5,7.1]]},
  bush:{h:2.2,k:"soft",leaf:1,c:[[1.1,0,1.9]]},berry:{h:2.2,k:"soft",leaf:1,c:[[1.1,0,1.9]]},mossrock:{h:1.8,k:"obst",c:[[1.2,0,1.5]]},
  boulder:{h:3,k:"obst",c:[[1.35,0,2.7]]},log:{h:1.6,k:"obst",c:[[1.6,0,1.1]]},mushroom:{h:3.2,k:"bnc",up:17,c:[[1.4,0,3]]},shrooms:{h:1.5,k:"deco"},
  car:{h:2.5,k:"top",up:13,honk:1,c:[[1.45,0,1.8]]},van:{h:3.1,k:"top",up:13,honk:1,c:[[1.7,0,2.5]]},lorry:{h:4.1,k:"top",up:14,honk:1,c:[[2.4,0,3.3]]},
  bus:{h:4.6,k:"top",up:15,honk:1,c:[[1.7,0,4.2]]},taxi:{h:2.7,k:"top",up:13,honk:1,c:[[1.5,0,1.9]]},taxi2:{h:2.7,k:"top",up:13,honk:1,c:[[1.5,0,1.9]]},
  cones:{h:1.4,k:"soft",c:[[.7,0,1.1]]},sign:{h:3,k:"obst",c:[[.28,0,2.8]]},lights:{h:3.6,k:"obst",c:[[.28,0,3.4]]},barrier:{h:1.8,k:"obst",c:[[1.4,0,1.2]]},
  cottage:{h:6.3,k:"top",up:11,c:[[2.6,0,5.4]]},well:{h:3,k:"obst",c:[[1.1,0,2.8]]},fence:{h:1.8,k:"obst",c:[[1.5,0,1.3]]},hay:{h:2.2,k:"bnc",up:14,c:[[1.3,0,1.9]]},
  cow:{h:2.6,k:"obst",moo:1,c:[[1.3,0,2.2]]},phonebox:{h:3,k:"obst",c:[[.6,0,2.9]]},gate:{h:2.2,k:"obst",c:[[1.5,0,1.6]]},flowers:{h:1.6,k:"soft",c:[[.9,0,1.1]]},
  tramp:{h:1.5,k:"bnc",up:20,c:[[1.4,0,1.2]]},washing:{h:3,k:"soft",c:[[1.4,1.3,2.8]]},
  stall:{h:3.3,k:"top",up:15,c:[[1.6,0,3]]},bench:{h:1.6,k:"obst",c:[[1.1,0,1]]},fountain:{h:3.4,k:"obst",c:[[1.9,0,1.1],[.45,0,3.1]]},lamp:{h:4,k:"obst",c:[[.22,0,3.9]]},
  busstop:{h:3.2,k:"top",up:14,c:[[1.9,0,2.7]]},postbox:{h:2.3,k:"obst",c:[[.42,0,2.2]]},awning:{h:2.6,k:"bnc",up:17,base:1.2,c:[[1.45,1.2,3.6]]},
  tlight:{h:3.6,k:"obst",c:[[.28,0,3.4]]},foodtruck:{h:3.6,k:"top",up:15,c:[[2.2,0,3]]},billboard:{h:7,k:"obst",c:[[2.9,3.6,7],[.3,0,3.6]]},
  pigeons:{h:2.2,k:"soft",coo:1,c:[[1,.2,2]]},
  fly:{h:1.1,k:"pick",R:.8,cy:.55},gfly:{h:1.4,k:"pick",R:.9,cy:.7},coin:{h:.95,k:"pick",R:.75,cy:.48},hoop:{h:3,k:"pick",R:1.5,cy:1.5},wind:{h:2.4,k:"pick",R:1.3,cy:1.2}};
function fsRng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* make one 50m stretch of the journey */
function fsGen(seed,k,kid){const R=fsRng(seed*7919+k*104729+7),o=[],x0=k*FS.chunk,x1=x0+FS.chunk,pick=a=>a[Math.floor(R()*a.length)];
  const add=(t,x,e)=>{const T=FS_T[t];o.push(Object.assign({t,x,y:(T&&T.base)||0},e||{}))};
  const busy=[];const free=(x,w)=>busy.every(b=>Math.abs(b[0]-x)>w+b[1]+3);
  const place=(t,n)=>{for(let i=0;i<n;i++)for(let a=0;a<14;a++){const x=x0+R()*FS.chunk;if(x<14||x>=x1)continue;if(x>FS_ROAD[0]-3&&x<FS_ROAD[1]+3)continue;
    const w=FS_T[t].c?Math.max(...FS_T[t].c.map(c=>c[0])):1;if(free(x,w)){busy.push([x,w]);add(t,x);break}}};
  const z=FS_Z[fsZone(x0+25)].k,few=kid?.8:1,far=Math.max(0,x0-150);
  /* water and mud on the ground */
  if(x0>=60&&z!=="road"&&z!=="city"&&R()<.28){const wx=x0+5+R()*30,ww=4+R()*5;if(wx+ww<x1&&free(wx+ww/2,ww/2)){busy.push([wx+ww/2,ww/2]);o.push({t:R()<.75?"water":"mud",x:wx,x2:wx+ww,y:0,ground:1})}}
  if(z==="forest"){place(pick(["oak","pine","oak"]),Math.round(1.2*few));place(pick(["bush","berry","mossrock","boulder","log"]),Math.round(1.5*few));place("mushroom",1+(R()<(kid?.45:.3)?1:0));if(R()<.4)place("shrooms",1)}
  else if(z==="road"){if(x0<FS_ROAD[0])for(const t of ["sign","lights"])add(t,FS_ROAD[0]-3-R()*4);if(x1>FS_ROAD[1])add(pick(["sign","barrier"]),FS_ROAD[1]+3+R()*3);
    if(x0<FS_ROAD[0]&&x0>=FS_ROAD[0]-FS.chunk)add("mushroom",FS_ROAD[0]-12)}
  else if(z==="village"){place(pick(["fence","cow","gate","flowers","washing","well","phonebox","fence"]),Math.round(1.5*few));if(R()<.5)place("cottage",1);
    place(pick(["tramp","hay","tramp"]),1+(R()<(kid?.45:.3)?1:0))}
  else if(z==="town"){place(pick(["bench","fountain","lamp","postbox","busstop","stall","lamp"]),Math.round(1.6*few));place(pick(["awning","stall","awning"]),1+(R()<(kid?.45:.3)?1:0))}
  else{place(pick(["tlight","lamp","billboard","busstop","tlight","postbox"]),Math.round(1.4*few));place(pick(["foodtruck","awning"]),1);
    if(R()<.4)add("pigeons",x0+R()*FS.chunk,{y:4+R()*5,mv:1,v:(R()<.5?-1:1)*(3+R()*2)})}
  /* flies to grab: little trails across the sky, fewer as the journey goes on */
  const pf=Math.max(.3,1-far/1800);
  if(x0>=10&&R()<pf){const n=2+Math.floor(R()*3),y=3+R()*9;let x=x0+5+R()*15;for(let i=0;i<n&&x<x1+10;i++){add(i===n-1&&R()<.18?"gfly":"fly",x,{y:Math.max(2,y+(R()-.5)*4),hov:1,ph:R()*6.3});x+=9+R()*7}}
  if(x0>=10&&R()<.6){const n=5,y=1.5+R()*6,x=x0+R()*35;for(let i=0;i<n;i++)add("coin",x+i*1.8,{y:y+Math.sin(i/(n-1)*Math.PI)*1.6})}
  if(x0>=80&&R()<.13)add(pick(["hoop","wind"]),x0+R()*FS.chunk,{y:3+R()*6});
  o.forEach((t,i)=>{t.id=k*1000+i});return o}
/* traffic: drives along the busy road and the city streets; starts when the frog gets near */
function fsTraffic(F){const R=fsRng(F.seed+99),list=[];const mk=(x,v,t)=>list.push({t,x0:x,v,id:900000+list.length,veh:1});
  for(let i=0;i<5;i++)mk(FS_ROAD[0]+8+i*17+R()*6,(R()<.5?-1:1)*(4+R()*5),["car","van","lorry","bus","taxi","car"][Math.floor(R()*6)]);
  for(let i=0;i<60;i++)mk(FS_Z[4].x+30+i*45+R()*20,(R()<.5?-1:1)*(4+R()*6),["taxi2","car","van","bus","taxi2"][Math.floor(R()*5)]);
  return list}
function fsVehX(F,o){if(F.trafT==null)return o.x0;let x=o.x0+o.v*(F.t-F.trafT);if(o.x0<FS_Z[4].x)x=Math.max(FS_ROAD[0]+3,Math.min(FS_ROAD[1]-3,x));return x}
/* where a hovering fly is right now */
function fsPos(o,T){if(o.veh)return{x:0,y:0};let x=o.x;if(o.mv)x+=o.v*T;if(!o.hov)return{x,y:o.y};const ph=o.ph||0;return{x:x+Math.sin(T*1.2+ph)*.8,y:o.y+Math.sin(T*2.1+ph*1.7)*.6}}
function fsNew(seed,kid){return{seed,kid:!!kid,t:0,x:FS.gripX,y:FS.y0,vx:0,vy:0,mode:"hang",dive:0,grab:null,combo:0,bestCombo:0,coins:0,flies:0,bumps:0,boings:0,whips:0,ev:[],chunks:{},hit:{},end:null,trafT:null,traffic:null,spin:0,maxY:0,d:0}}
function fsObjs(F,x){const k=Math.floor(x/FS.chunk);if(k<0)return[];if(!F.chunks[k])F.chunks[k]=fsGen(F.seed,k,F.kid);return F.chunks[k]}
/* launch from the pull: P = pull vector (metres, back and down from the frog), power 0..1 */
function fsLaunchVel(F,px,py){const L=Math.min(FS.maxPull,Math.hypot(px,py));const p=L/FS.maxPull;let a=Math.atan2(-py,-px);a=Math.max(-.15,Math.min(1.35,a));
  const v=(FS.vMin+(FS.vMax-FS.vMin)*p)*(F.kid?1.06:1);return{vx:v*Math.cos(a),vy:v*Math.sin(a),p,a}}
function fsLaunch(F,px,py){const L=fsLaunchVel(F,px,py);F.vx=L.vx;F.vy=L.vy;F.x=FS.gripX+.3;F.y=FS.y0;F.mode="fly";F.power=L.p;F.ev.push({e:"launch",p:L.p})}
function fsCombo(F){F.combo++;F.bestCombo=Math.max(F.bestCombo,F.combo);if(F.combo>=2)F.vx+=.25*Math.min(F.combo,8);F.ev.push({e:"combo",n:F.combo})}
function fsComboEnd(F){if(F.combo>=2)F.ev.push({e:"comboEnd",n:F.combo});F.combo=0}
const fsReach=F=>FS.reach+(F.kid?2:0);
function fsCanGrab(F,o){if(!o||o.got||!o.hov||F.grab||(F.mode!=="fly"&&F.mode!=="slide"))return false;const p=fsPos(o,F.t),T=FS_T[o.t];return Math.hypot(p.x-F.x,p.y+T.cy-F.y)<=fsReach(F)&&p.x>F.x-1}
function fsGrab(F,o){if(!fsCanGrab(F,o))return false;F.grab={o,t:0};F.dive=0;F.ev.push({e:"tongue",o});return true}
/* everything near the frog (including traffic) */
function fsNear(F){const k=Math.floor(F.x/FS.chunk),a=[];for(let i=k-1;i<=k+1;i++)a.push(...fsObjs(F,i*FS.chunk));if(F.traffic)for(const v of F.traffic){const x=fsVehX(F,v);if(Math.abs(x-F.x)<25)a.push(Object.assign(v,{x}))}return a}
function fsGet(F,o,via){const T=FS_T[o.t],p=fsPos(o,F.t);o.got=1;
  if(o.t==="fly"||o.t==="gfly"){F.flies++;const g=o.t==="gfly";if(via==="tongue"){F.whips++;const sp=Math.max(Math.hypot(F.vx,F.vy)*.97,14)+(g?8:1.8),a=g?.75:.6;F.vx=sp*Math.cos(a);F.vy=sp*Math.sin(a)}else{F.vx+=g?6:2.5;F.vy=Math.max(F.vy,g?8:F.vy+2)}}
  else if(o.t==="coin")F.coins+=Math.min(5,1+Math.floor(F.combo/3));
  else if(o.t==="hoop"){F.vx+=6;F.vy=Math.max(F.vy,7);F.coins+=3}else if(o.t==="wind"){F.wind=1.6}
  if(o.t!=="coin")fsCombo(F);if(F.mode==="slide"&&o.t!=="coin"){F.mode="fly";F.vy=Math.max(F.vy,6)}
  F.ev.push({e:"pick",t:o.t,o,x:p.x,y:p.y+T.cy,via})}
function fsGroundAt(F,x){for(const k of [Math.floor(x/FS.chunk)-1,Math.floor(x/FS.chunk)])for(const o of fsObjs(F,k*FS.chunk))if(o.ground&&x>=o.x&&x<=o.x2)return o.t;
  if(x>FS_ROAD[0]&&x<FS_ROAD[1])return "road";return "ground"}
/* one step. dive: finger held down (falls faster, bigger bounces) */
function fsStep(F,dt,dive){if(F.mode==="hang"||F.mode==="done")return;F.t+=dt;const R=FS.R,kid=F.kid;F.dive=dive&&!F.grab?1:0;
  if(F.trafT==null&&F.x>FS_ROAD[0]-90){F.trafT=F.t;F.traffic=fsTraffic(F)}
  const sp=Math.hypot(F.vx,F.vy);F.spin=Math.max(0,F.spin-dt);
  if(F.grab){const G=F.grab,o=G.o,T=FS_T[o.t],p=fsPos(o,F.t),tx=p.x,ty=p.y+T.cy,dx=tx-F.x,dy=ty-F.y,d=Math.hypot(dx,dy),z=Math.max(26,sp*1.15);G.t+=dt;
    if(o.got||G.t>.6)F.grab=null;
    else if(d<=z*dt+.6){F.x=tx;F.y=Math.max(R,ty);F.grab=null;F.mode="fly";fsGet(F,o,"tongue");F.ev.push({e:"whip",gold:o.t==="gfly"})}
    else{F.x+=dx/d*z*dt;F.y+=dy/d*z*dt;F.vx=dx/d*z;F.vy=dy/d*z*.5;F.mode="fly"}}
  if(!F.grab){
    if(F.mode==="fly"){F.vy-=FS.g*(F.dive?2.6:1)*dt;if(F.dive&&F.vy>-30)F.vx+=1.2*dt}
    F.vx-=FS.drag*F.vx*sp*dt;if(F.wind>0){F.wind-=dt;F.vx+=9*dt}
    var py=F.y;F.x+=F.vx*dt;F.y+=F.vy*dt}else var py=F.y;
  F.maxY=Math.max(F.maxY,F.y);
  for(const o of fsNear(F)){if(o.got||o.ground)continue;const T=FS_T[o.t];if(!T)continue;
    if(T.k==="pick"){if(F.grab&&F.grab.o===o)continue;const p=fsPos(o,F.t),r=T.R+R*(kid?1.3:1);if(Math.hypot(p.x-F.x,p.y+T.cy-F.y)<r)fsGet(F,o,"touch");continue}
    if(T.k==="deco"||F.hit[o.id]>F.t-.3)continue;const ox=o.veh?o.x:fsPos(o,F.t).x,oy=o.mv&&!o.veh?o.y:o.y||0;
    for(const c of T.c){const x0=ox-c[0],x1=ox+c[0],y0=oy+c[1],y1=oy+c[2];
      if(F.x>x0-R&&F.x<x1+R&&F.y>y0-R&&F.y<y1+R){F.hit[o.id]=F.t;const top=py-R>=y1-.5&&F.vy<=.5;
        if(T.k==="bnc"||(T.k==="top"&&top)){const up=(T.up||12)+(F.dive?Math.min(9,-F.vy*.3):0);F.vy=up*(kid?1.05:1);F.vx=Math.max(F.vx,9)*1.03+(o.veh?o.v*.3:0);F.y=y1+R+.05;F.mode="fly";F.boings++;fsCombo(F);F.ev.push({e:"boing",o,t:o.t,x:F.x,y:y1,dive:F.dive})}
        else if(T.k==="soft"){F.vx*=kid?.85:.8;F.vy=Math.max(F.vy*.5,2);F.ev.push({e:"soft",o,t:o.t,x:F.x,y:F.y})}
        else if(top){/* landed on a solid top: hop along it */F.y=y1+R+.02;F.vy=Math.max(-F.vy*.38,3);F.vx*=.88;F.ev.push({e:"thud",t:o.t,x:F.x,y:y1})}
        else{/* bonk! */const keep=kid?.55:.45;F.vx=Math.max(1.5,Math.abs(F.vx)*keep);F.vy=Math.max(F.vy*.2,4);if(F.x<ox)F.x=Math.min(F.x,x0-R-.05);F.spin=.8;F.bumps++;if(F.mode==="slide")F.mode="fly";fsComboEnd(F);
          F.ev.push({e:"bump",o,t:o.t,x:F.x,y:F.y})}
        break}}}
  if(F.y<=R){const g=fsGroundAt(F,F.x);F.y=R;
    if(F.mode==="fly"){fsComboEnd(F);
      if(g==="water"){if(F.vx>8){F.vy=Math.max(-F.vy*.55,5);F.vx*=.86;F.ev.push({e:"splash"})}else{F.vy=0;F.vx=0;F.mode="done";F.end="splash";F.ev.push({e:"splash",end:1})}}
      else if(g==="mud"){F.vx*=.2;F.vy=0;F.mode="slide";F.mud=1;F.ev.push({e:"mud"})}
      else if(-F.vy>4){F.vy=-F.vy*(F.dive?.5:.42);F.vx*=.82;F.ev.push({e:"skip",g})}
      else{F.vy=0;F.mode="slide";F.ev.push({e:"land",g})}}
    else if(F.mode==="slide"){F.vy=0;if(g==="water"&&F.vx<8){F.vx=0;F.mode="done";F.end="splash";F.ev.push({e:"splash",end:1})}if(g==="mud")F.mud=1}}
  if(F.mode==="slide"){F.vx-=(F.mud?28:11)*dt;if(F.vx<=.25){F.vx=0;F.mode="done";F.end=F.end||(F.mud?"mud":"stop");F.ev.push({e:"stop"})}}
  F.d=Math.max(0,Math.round(F.x))}
if(typeof module!=="undefined")module.exports={FS,FS_Z,FS_T,FS_ROAD,FS_MEDAL,fsZone,fsMedal,fsRng,fsGen,fsTraffic,fsVehX,fsPos,fsNew,fsObjs,fsLaunchVel,fsLaunch,fsCanGrab,fsGrab,fsNear,fsGet,fsGroundAt,fsStep,fsReach};
