/* ---- Dragon Flight: flap through six worlds, first to the golden castle wins ----
   Six levels, each its own world with its own dangers. Both phones fly the same level (the race record says which: lv).
   The scenery is painted once per level into strips that scroll at different speeds (fast on phones);
   dangers that move (gates, stones, fireballs, lightning) follow the race clock, so they're the same on both phones. */
let DFW=360,DFT=0,DFB=0,DFSAFE=0;const DFH=480,DF_FIN=9600,DF_SP=175,DF_OW=66,DF_ORD=[0,1,4,2,6,7,5,3];
const DF_LV=[
  {k:"valley",nm:"GREEN VALLEY",ic:"🌳",say:"Rocky spires, golden rings and gem trails"},
  {k:"snow",nm:"SNOWY PEAKS",ic:"❄️",say:"Icicles drop as you pass. Gusts of wind!"},
  {k:"castle",nm:"CASTLE KINGDOM",ic:"🏰",say:"Sliding gates and catapult stones"},
  {k:"cave",nm:"CRYSTAL CAVES",ic:"💎",say:"A winding tunnel full of bats"},
  {k:"volcano",nm:"DRAGON VOLCANO",ic:"🌋",say:"Fireballs burst out of the lava"},
  {k:"storm",nm:"STORM SKY",ic:"⛈️",say:"Floating islands. Watch for the lightning flash!"}];
const DF_ZN=DF_LV.map(l=>l.nm);
const dfLvOf=r=>r&&r.lv!=null&&DF_LV[r.lv]?+r.lv:(r&&r.s?Math.floor(r.s/1000)%DF_LV.length:0);
const dfCol=r=>r==="child"?"red":"green",dfNm=r=>SOLO&&r===ot()?SOLO_NM:r==="child"?"Cass":"Dad";
const DFI={};
function dfImg(c){if(!DFI[c]){const i=new Image();i.src=c==="red"?DRG_RED:DRG_GREEN;DFI[c]=i}return DFI[c]}
function dfRand(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const dfH=(i,s)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)};
/* the course for one level. Fair rules: the first stretch is just gaps; after every gap there's about 1½ seconds of open sky
   before a danger, and the same again before the next gap; each stretch has one kind of danger; dangers always leave a clear way past */
function dfCourse(s,lv){lv=lv||0;const r=dfRand((s+lv*7919)%4294967296),ob=[],K=DF_LV[lv].k,SAFE=250,AFTER=230;let x=620,y=270;
  const gap=(x,y,o)=>ob.push({t:"gap",x,y,w:DF_OW,got:0,...(o||{})}),ring=(x,y)=>ob.push({t:"ring",x:x-18,y,w:36,got:0}),
    gems=(x0,y0,x1,y1,k,arc)=>{for(let i=0;i<k;i++){const t=k>1?i/(k-1):.5;ob.push({t:"gem",x:x0+(x1-x0)*t-8,y:y0+(y1-y0)*t-(arc||0)*4*t*(1-t),w:16,got:0})}},
    nextY=p=>Math.max(180,Math.min(380,y+(r()-.5)*(150+p*90))),
    plain=(n,p)=>{for(let i=0;i<n;i++){const ny=nextY(p);gap(x,ny);if(i<n-1){if(r()<.55)gems(x+DF_OW+20,ny,x+DF_OW+170,nextY(p),4,24);else ring(x+DF_OW+110,ny)}y=ny;x+=270+r()*50}};
  /* gentle start */
  plain(3,0);
  while(x<DF_FIN-900){const p=x/DF_FIN,roll=r();
    if(roll<.3){plain(2,p);continue}
    /* a danger stretch: gap, open sky, the danger, open sky */
    const ny=nextY(p);y=ny;
    if(K==="valley"){gap(x,ny,p>.5?{mv:{a:24,per:3.8,ph:r()*6}}:null);gems(x+DF_OW+30,ny,x+DF_OW+200,nextY(p),4,30);ring(x+DF_OW+300,ny);x+=DF_OW+420}
    else if(K==="snow"){gap(x,ny);const hx=x+DF_OW+SAFE;
      if(r()<.55){/* a row of icicles hanging from the top: fly underneath. They shake as you come, and drop behind you */const low=200+r()*40;for(let i=0;i<3;i++)ob.push({t:"ice",x:hx+i*70,y:0,w:22,tip:low-(i===1?30:0),got:0});gems(hx,low+70,hx+150,low+70,3);x=hx+140+AFTER}
      else{const up=r()<.6;ob.push({t:"wind",x:hx-60,y:0,w:300,f:up?-380:280,got:0});gems(hx-20,up?ny-50:ny+40,hx+200,up?ny-100:ny+80,4);x=hx+240+AFTER}}
    else if(K==="castle"){if(r()<.5){gap(x,ny,{sp:"gate",mv:{a:34+p*16,per:3.6+r()*.6,ph:r()*6}});ring(x+DF_OW+150,ny);x+=DF_OW+330}
      else{gap(x,ny);const hx=x+DF_OW+SAFE;ob.push({t:"arc",x:hx,y:0,w:30,kind:"stone",per:3.6+r()*.6,ph:r()*3,top:250+r()*60,got:0});gems(hx-10,160,hx+40,160,2);x=hx+30+AFTER}}
    else if(K==="cave"){if(r()<.55){const len=800+r()*500,ph=r()*6,amp=50+p*30,g0=215-p*35;for(let cx=x;cx<x+len;cx+=40){const u=(cx-x)/len,c=270+Math.sin(u*Math.PI*2*1.1+ph)*amp*Math.sin(Math.PI*u);ob.push({t:"cave",x:cx,y:c,w:40,g:g0+Math.sin(u*9+ph)*10,got:0})}
        for(let i=1;i<6;i++){const gx=x+len*i/6,o=ob.filter(o=>o.t==="cave"&&Math.abs(o.x-gx)<21)[0];if(o)ob.push({t:"gem",x:gx-8,y:o.y,w:16,got:0})}x+=len+AFTER}
      else{gap(x,ny,{sp:"crystal"});const hx=x+DF_OW+SAFE,by=200+r()*140;ob.push({t:"bats",x:hx,y:by,w:60,amp:45,per:2.8+r()*.6,ph:r()*6});gems(hx+10,by<270?by+110:by-110,hx+50,by<270?by+110:by-110,2);x=hx+60+AFTER}}
    else if(K==="volcano"){gap(x,ny);const hx=x+DF_OW+SAFE;ob.push({t:"arc",x:hx,y:0,w:30,kind:"fire",per:3.4+r()*.6,ph:r()*3,top:240+r()*70,got:0});gems(hx-10,150,hx+40,150,2);x=hx+30+AFTER}
    else if(K==="storm"){if(r()<.5){gap(x,ny,{mv:{a:22+p*14,per:4.2+r(),ph:r()*6}});ring(x+DF_OW+150,ny);x+=DF_OW+330}
      else{gap(x,ny);const hx=x+DF_OW+SAFE,fromTop=r()<.6;ob.push({t:"bolt",x:hx,y:0,w:24,top:fromTop,to:fromTop?190+r()*50:300+r()*50,per:3.6+r()*.6,ph:r()*3,got:0});gems(hx,fromTop?340:160,hx+40,fromTop?340:160,2);x=hx+24+AFTER}}}
  ob.sort((a,b)=>a.x-b.x);return ob}
const dfEase=()=>role==="child"?{gap:196,grav:930,flap:-430,ht:.75,inv:1.4,rng:200,cd:2.5,stun:.9,hz:.7}:{gap:150,grav:1120,flap:-450,ht:1,inv:1.1,rng:150,cd:3.5,stun:1.4,hz:1};
/* where a moving gap's middle is right now (race clock) */
const dfGy=(o,rt)=>o.mv?o.y+Math.sin(rt*2*Math.PI/o.mv.per+o.mv.ph)*o.mv.a:o.y;
const dfGap=(o,E)=>o.t==="cave"?o.g*(E.gap/150):E.gap;
/* a stone or fireball thrown up from below: its height now (or null while it's out of sight) */
const dfArcY=(o,rt)=>{const u=(((rt+o.ph)%o.per)+o.per)%o.per/o.per;if(u>.7)return null;const q=u/.7;return DFH+40-(DFH+40-o.top)*4*q*(1-q)};
/* lightning: 0 = quiet, 1 = warning flicker, 2 = striking */
const dfBoltSt=(o,rt)=>{const u=(((rt+o.ph)%o.per)+o.per)%o.per;return u<o.per-1.4?0:u<o.per-.45?1:2};
let DF=null,DFG={x:0,y:270,tx:0,ty:270,t:0,stun:0,fire:0,face:1},DFS=0;
function dfNew(s,lv){lv=lv||0;return{s,lv,x:0,y:270,vy:0,hit:0,inv:0,boost:0,fl:0,done:0,shake:0,ob:dfCourse(s,lv),fx:[],amb:[],zt:0,t:0,won:0,fcd:0,fire:0,face:1,stun:0,imm:0,msg:null,flash:0,gems:0}}
const dfRun=()=>{const r=RA;return!!(DF&&r&&r.s===DF.s&&Date.now()>=r.s&&!r.w&&!DF.done)};
const dfRt=()=>{const r=RA;return r&&r.s?(Date.now()-r.s)/1000:DF?DF.t:0};
function dfInRange(){if(!dfRun())return false;const E=dfEase(),dx=DFG.x-DF.x,dy=DFG.y-DF.y;return Math.abs(dx)<E.rng&&Math.abs(dy)<75&&DFG.stun<=0&&(DFG.immU||0)<Date.now()&&DFG.tx<DF_FIN}

function dfFire(){if(!dfRun()||DF.fcd>0||DF.stun>0)return;const E=dfEase(),hit=false,dx=DFG.x-DF.x,n=Date.now(),k=me()==="X"?"O":"X";
  DF.face=hit&&dx<0?-1:1;DF.fire=.65;DF.fcd=E.cd;sfx("b_throw");
  for(let i=0;i<26;i++){const sp=120+Math.random()*(hit?Math.abs(dx)*2.2:260);DF.fx.push({x:DF.x+DF.face*34,y:DF.y-4,vx:DF.face*sp,vy:(Math.random()-.5)*90,t:.45,c:Math.random()<.5?"#ffb020":"#ff5a1f",fl:1})}
  if(hit){DFG.stun=1.3;DFG.vy=0;DFG.immU=n+2600;sfx("b_boom",.55);DF.msg={t:1.4,txt:dfNm(ot()).toUpperCase()+" IS STUNNED!",c:"#ffd23f"}}
  GD("race").update({["f"+me()]:n,...(hit?{["z"+k]:n}:{})}).catch(er)}

function dfFlap(){if(!DF||DF.stun>0)return;const r=RA,n=Date.now();if(r&&r.s===DF.s&&n>=r.s&&!r.w&&!DF.done){DF.vy=dfEase().flap;DF.fl=.28;sfx("flap")}else if(!r||!r.s||r.w||DF.done){DF.fl=.28}}

function dfFit(){const c=$("#dfc"),w=$("#rc");if(!c||!w)return;const W=w.clientWidth||innerWidth,H=w.clientHeight||innerHeight,k=Math.min(W/360,H/480),dpr=Math.min(2,window.devicePixelRatio||1);
  DFW=W/k;const LH=H/k;DFT=(LH-DFH)/2;DFB=LH-DFH-DFT;c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);c._k=k*dpr;
  const p=document.createElement("div");p.style.cssText="position:fixed;top:0;height:env(safe-area-inset-top,0px)";document.body.appendChild(p);DFSAFE=p.offsetHeight/k;p.remove()}

function dfClose(){cancelAnimationFrame(dfLoop.h);document.body.classList.remove("dfon");try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}g=null;view()}

function dfBoom(){const cs=["#ffd23f","#ff4fd8","#3aa8ff","#2ef2c5","#ff7a2f"],x=DFW*(.25+Math.random()*.6),y=60+Math.random()*150,c=cs[Math.floor(Math.random()*cs.length)];
  for(let i=0;i<22;i++){const a=i/22*6.283;DF.fx.push({x:DF.x-110+x,y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,t:.9,c})}}

function dfLoop(ts){
  const c=$("#dfc");if(!c||g!=="race"||tab!=="play"){dfLoop.h=0;document.body.classList.remove("dfon");return}
  const dt=Math.min(.05,dfLoop.l?(ts-dfLoop.l)/1000:0);dfLoop.l=ts;
  if(DF){dfStep(dt);dfDraw(c)}
  if(!dfLoop.k||ts-dfLoop.k>250){dfLoop.k=ts;raceUp()}
  const fb=$("#dff");if(fb&&DF){const E=dfEase(),cls="dffire"+(!dfRun()?" off":DF.fcd>0||DF.stun>0?" cool":dfInRange()?" ready":"");if(fb.className!==cls)fb.className=cls;fb.style.setProperty("--p",(DF.fcd>0?(1-DF.fcd/E.cd)*100:100).toFixed(0)+"%")}
  dfLoop.h=requestAnimationFrame(dfLoop);
}

function dfDragon(ctx,col,x,y,vy,t,fire,alpha,flap,face=1,stun=0){
  const im=dfImg(col);if(!im.complete||!im.naturalWidth)return;const CW=im.naturalWidth/9,CH=im.naturalHeight,sc=.62,BODY=141;
  const fi=fire?8:DF_ORD[Math.floor(t*(flap?22:12))%8];ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(stun>0)ctx.rotate(Math.sin(t*14)*.5+.6);else ctx.rotate(face*Math.max(-.35,Math.min(.45,vy/900)));ctx.scale(face,1);
  ctx.drawImage(im,fi*CW,0,CW,CH,-BODY/2*sc,-CH*.55*sc,CW*sc,CH*sc);ctx.restore();
  if(stun>0){ctx.globalAlpha=alpha;ctx.fillStyle="#ffe14d";ctx.font="bold 16px system-ui,sans-serif";ctx.textAlign="center";for(let i=0;i<3;i++){const a=t*7+i*2.09;ctx.fillText("★",x+Math.cos(a)*30,y-30+Math.sin(a)*8)}}ctx.globalAlpha=1}

/* full screen: the play area (480 high) is the same on every phone; taller screens just see more sky above and ground below */
function vRace(){const pick=(()=>{try{return localStorage.getItem("dfLv")||"r"}catch(e){return"r"}})();
  $("#v").innerHTML=`<div class="dfs" id="rc"><canvas id="dfc"></canvas>
  <button class="dfx" id="dfq" aria-label="Back">${IC("back",26)}</button><button class="dfx dfr" id="dfre" aria-label="Restart race">RESTART</button>
  <div class="dfgo" id="dgo"><div class="dflvs">${DF_LV.map((l,i)=>`<button class="dflv${pick==String(i)?" on":""}" data-lv="${i}"><i>${l.ic}</i><b>${l.nm}</b></button>`).join("")}<button class="dflv${pick==="r"?" on":""}" data-lv="r"><i>🎲</i><b>SURPRISE ME</b></button></div>
    <div class="dfsay" id="dfsay"></div><button class="b y" id="st">START RACE</button><div class="dfh">Tap to flap up · Hold to hover in place · Grab gems and rings to go faster</div></div>
  <button id="dff" class="dffire" aria-label="Fire breath"><b>FIRE!</b></button></div>`;
  document.body.classList.add("dfon");try{const d=document.documentElement;if(!document.fullscreenElement&&d.requestFullscreen)d.requestFullscreen({navigationUI:"hide"}).catch(()=>{})}catch(e){}
  dfFit();const c=$("#dfc");
  /* press = stop and hover right where you are; a quick tap (let go straight away) = flap up */
  c.onpointerdown=e=>{e.preventDefault();dfPress()};const rel=()=>dfRelease();c.onpointerup=rel;c.onpointercancel=rel;c.onpointerleave=rel;
  /* FIRE also flaps, so using it never makes you drop */
  const fb=$("#dff");fb.onpointerdown=e=>{e.preventDefault();e.stopPropagation();dfFlap();dfFire()};
  const say=()=>{const p=(()=>{try{return localStorage.getItem("dfLv")||"r"}catch(e){return"r"}})(),l=DF_LV[+p];const e=$("#dfsay");if(e)e.textContent=p==="r"?"A surprise world every race!":l?l.ic+" "+l.say:""};say();
  document.querySelectorAll("[data-lv]").forEach(b=>b.onclick=()=>{try{localStorage.setItem("dfLv",b.dataset.lv)}catch(e){}document.querySelectorAll("[data-lv]").forEach(x=>x.classList.toggle("on",x===b));sfx("tap");say();
    /* show the chosen world behind the menu */if(!(RA&&RA.s&&!RA.w&&Date.now()<RA.s+120000)){const v=b.dataset.lv;DF=dfNew(12345,v==="r"?Math.floor(Math.random()*DF_LV.length):+v);DF.pv=1}});
  const start=()=>{sfx("tap");let p="r";try{p=localStorage.getItem("dfLv")||"r"}catch(e){}const lv=p==="r"?Math.floor(Math.random()*DF_LV.length):+p;GD("race").set({s:Date.now()+3000,pX:0,pO:0,yX:270,yO:270,w:"",lv}).catch(er)};
  $("#st").onclick=start;$("#dfre").onclick=start;$("#dfq").onclick=dfClose;
  if(!DF||!RA||RA.s!==DF.s)DF=RA&&RA.s?dfNew(RA.s,dfLvOf(RA)):dfNew(12345,(()=>{const p=(()=>{try{return localStorage.getItem("dfLv")}catch(e){return null}})();return p&&p!=="r"?+p:0})());
  raceUp();cancelAnimationFrame(dfLoop.h);dfLoop.l=0;dfLoop.h=requestAnimationFrame(dfLoop);
}
window.addEventListener("resize",()=>{if(g==="race")dfFit()});
function raceUp(){
  const r=RA,e=$("#rs");if(!$("#dfc"))return;
  const fresh=r&&r.s&&!r.w&&Date.now()<r.s+120000;if(r&&r.s&&(!DF||DF.s!==r.s)&&(fresh||!DF||!DF.pv)){DF=dfNew(r.s,dfLvOf(r));DFG={x:0,y:270,tx:0,ty:270,t:Date.now(),stun:0,fire:0,face:1,vy:0}}
  if(r){const k=me()==="X"?"O":"X",tx=r["p"+k]||0,ty=r["y"+k]||270;if(tx!==DFG.tx||ty!==DFG.ty){DFG.tx=tx;DFG.ty=ty;DFG.t=Date.now()}
    const ft=r["f"+k];if(ft&&ft>=r.s&&ft!==DFG.fl){DFG.fl=ft;DFG.fire=.65;DFG.face=DF.x<DFG.x?-1:1}
  }
  const n=Date.now(),over=!r||!r.s||r.w||(DF&&DF.done)||n>r.s+120000,go=$("#dgo"),re=$("#dfre");
  if(go)go.style.display=over?"":"none";if(re)re.style.display=over?"none":"";
  const b=$("#st");if(b){const t=r&&r.w?"RACE AGAIN":"START RACE";if(b.textContent!==t)b.textContent=t}
}
function dfPress(){if(!DF)return;if(!dfRun()){dfFlap();return}DF.hold=1;DF.holdT=DF.t;if(DF.stun<=0)DF.vy=0}
function dfRelease(){if(!DF||!DF.hold)return;DF.hold=0;if(DF.t-(DF.holdT||0)<.22)dfFlap()}
/* bump: slow down, get knocked back a little, blink for a moment */
function dfBump(up,col){const E=dfEase();DF.hit=E.ht;DF.inv=E.inv;DF.x-=28;DF.vy=up?-220:120;DF.boost=0;sfx("hit");DF.shake=.25;
  for(let i=0;i<8;i++)DF.fx.push({x:DF.x+20,y:DF.y,vx:(Math.random()-.5)*200,vy:(Math.random()-.7)*200,t:.5,c:col||"#fff6c8"})}
function dfStep(dt){
  const r=RA,n=Date.now(),E=dfEase(),run=r&&r.s===DF.s&&n>=r.s&&!r.w&&!DF.done,rt=dfRt();DF.t+=dt;
  DF.fl=Math.max(0,DF.fl-dt);DF.shake=Math.max(0,DF.shake-dt);DF.fcd=Math.max(0,DF.fcd-dt);DF.fire=Math.max(0,DF.fire-dt);DF.stun=Math.max(0,DF.stun-dt);DF.imm=Math.max(0,DF.imm-dt);DF.flash=Math.max(0,DF.flash-dt);
  DFG.stun=Math.max(0,DFG.stun-dt);DFG.fire=Math.max(0,DFG.fire-dt);if(DF.msg){DF.msg.t-=dt;if(DF.msg.t<=0)DF.msg=null}
  if(run){
    if(!DF.go){DF.go=1;DF.zt=2.6}
    DF.hit=Math.max(0,DF.hit-dt);DF.inv=Math.max(0,DF.inv-dt);DF.boost=Math.max(0,DF.boost-dt);
    const sp=DF_SP*(DF.boost>0?1.5:1)*(DF.hit>0?.3+.7*(1-DF.hit/E.ht):1);
    let wind=0;
    const hx=24,hy=12,hz=E.hz;
    for(const o of DF.ob){if(o.x>DF.x+hx+4)break;if(o.x+o.w<DF.x-hx)continue;
      /* things to collect */
      if(o.t==="gem"){if(!o.got&&Math.hypot(o.x+8-DF.x,o.y-DF.y)<(role==="child"?34:28)){o.got=1;DF.gems++;DF.boost=Math.min(1.8,DF.boost+.3);sfx("sp");for(let i=0;i<6;i++)DF.fx.push({x:o.x+8,y:o.y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,t:.4,c:"#7ef9ff"})}continue}
      if(o.t==="ring"){if(!o.got&&Math.abs(o.x+18-DF.x)<22&&Math.abs(o.y-DF.y)<(role==="child"?42:34)){o.got=1;DF.boost=Math.max(DF.boost,1.4);sfx("rev");DF.msg={t:.8,txt:"RING BOOST!",c:"#ffd23f"};for(let i=0;i<16;i++){const a=i/16*6.283;DF.fx.push({x:o.x+18,y:o.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,t:.5,c:"#ffd23f"})}}continue}
      if(o.t==="wind"){wind+=o.f;continue}
      if(DF.inv>0)continue;
      /* gaps and cave walls */
      if(o.t==="gap"||o.t==="cave"){const gy=dfGy(o,rt),G=dfGap(o,E),gt=gy-G/2,gb=gy+G/2;if(DF.y-hy<gt-6||DF.y+hy>gb+6){dfBump(DF.y-hy>=gt);break}continue}
      /* icicles drop when you get close */
      if(o.t==="ice"){if(o.fy!=null)continue;if(Math.abs(DF.x-(o.x+11))<(9+hx*.5)*hz&&DF.y-hy<o.tip-4){dfBump(false,"#dff4ff");break}continue}
      if(o.t==="arc"){const ay=dfArcY(o,rt);if(ay!=null&&Math.hypot(o.x+15-DF.x,ay-DF.y)<(14+10)*hz){dfBump(ay>DF.y,o.kind==="fire"?"#ff8a1f":"#bbb");if(o.kind==="fire")DF.msg={t:.9,txt:"TOASTY!",c:"#ff8a1f"};break}continue}
      if(o.t==="bats"){let hit=false;for(let b=0;b<3;b++){const by=o.y+Math.sin(rt*2*Math.PI/o.per+o.ph)*o.amp+(b===1?-14:0),bx=o.x+b*22;if(Math.hypot(bx-DF.x,by-DF.y)<(9+10)*hz){hit=true;break}}if(hit){dfBump(true,"#b48cff");DF.msg={t:.8,txt:"BATS!",c:"#c9a8ff"};break}continue}
      if(o.t==="bolt"){if(dfBoltSt(o,rt)===2&&Math.abs(o.x+12-DF.x)<18*hz+hx*.5&&(o.top?DF.y-hy<o.to:DF.y+hy>o.to)){dfBump(!o.top,"#fff59a");DF.msg={t:.9,txt:"ZAPPED!",c:"#fff59a"};break}continue}
    }
    /* icicles start falling when you come near */
    for(const o of DF.ob){if(o.x>DF.x+40)break;if(o.t==="ice"&&o.fy==null&&o.x+40<DF.x-30){o.fy=-DFT;o.fv=0;sfx("tap")}}
    const hov=DF.hold&&DF.stun<=0;
    if(hov){DF.vy=0;DF.fl=Math.max(DF.fl,.12)}
    else DF.vy=Math.min(DF.stun>0?520:430,DF.vy+(E.grav+wind*(role==="child"?.8:1))*(DF.stun>0?1.25:1)*dt);DF.y+=DF.vy*dt;DF.x+=sp*dt;
    if(DF.y<-40){DF.y=-40;DF.vy=Math.max(0,DF.vy)}
    if(DF.y>DFH-34){DF.y=DFH-34;DF.vy=-300;if(DF.inv<=0){DF.hit=E.ht*.5;DF.inv=.5;sfx("hit");DF.shake=.15;if(DF.lv===4)DF.msg={t:.8,txt:"HOT HOT HOT!",c:"#ff8a1f"}}}
    if(DF.x>=DF_FIN){DF.x=DF_FIN;DF.done=1;
      if(!r.w){DF.won=1;GD("race").update({["p"+me()]:DF_FIN,["y"+me()]:Math.round(DF.y),w:me()}).catch(er);if(lw!==r.s){lw=r.s;gamePts(2)}sfx("win")}}
    else if(n-DFS>200){DFS=n;GD("race").update({["p"+me()]:Math.round(DF.x),["y"+me()]:Math.round(DF.y)}).catch(er)}
  }else{
    // waiting, counting down or finished: hover gently
    const ty=DF.done||r&&r.w?DFH*.42:270+Math.sin(DF.t*2.2)*10;DF.vy=0;DF.y+=(ty-DF.y)*Math.min(1,dt*3);
    if(!r||!r.s||DF.pv)DF.x=(DF.x+60*dt)%(DF_FIN-900);
    if(DF.done||r&&r.w&&r.w===me()){if(Math.random()<dt*3)dfBoom()}
  }
  /* falling icicles */
  for(const o of DF.ob){if(o.t!=="ice"||o.fy==null||o.gone)continue;o.fv+=900*dt;o.fy+=o.fv*dt;if(o.fy>DFH+DFB+20)o.gone=1}
  for(const p of DF.fx){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt}DF.fx=DF.fx.filter(p=>p.t>0);
  // the other dragon glides smoothly towards where it was last seen
  const gr=r&&r.s===DF.s&&n>=r.s&&!r.w,ex=gr?Math.min(DF_FIN,DFG.tx+DF_SP*Math.min(.5,(n-DFG.t)/1000)):DFG.tx;
  DFG.x+=(ex-DFG.x)*Math.min(1,dt*6);if(DFG.stun>0){DFG.vy=(DFG.vy||0)+600*dt;DFG.y=Math.min(DFH-34,DFG.y+DFG.vy*dt)}else{DFG.vy=0;DFG.y+=(DFG.ty-DFG.y)*Math.min(1,dt*6)}
  DF.zt=Math.max(0,DF.zt-dt);
}

/* ---- drawing ---- */
/* Scenery: each world is a few strips (far mountains, middle hills, near ground, clouds) painted once into hidden canvases
   720 wide that repeat seamlessly, then slid across at different speeds. */
const DF_LW=720,DFC={};
const DF_PAL={
  valley:{st:"#2f97ec",sb:"#cfeeff",sun:"#fff6c2",glow:"255,240,170",gem:"#4fe3ff"},
  snow:{st:"#5f93dc",sb:"#f1f7ff",sun:"#ffffff",glow:"255,255,255",gem:"#9feaff"},
  castle:{st:"#ff7f4a",sb:"#ffe0a0",sun:"#fff1b8",glow:"255,215,140",gem:"#ffe14d"},
  cave:{st:"#0c0619",sb:"#2c1656",sun:null,glow:"170,120,255",gem:"#ff7ae6"},
  volcano:{st:"#1e0606",sb:"#ff6a2a",sun:"#ffcf6a",glow:"255,120,40",gem:"#ffd23f"},
  storm:{st:"#050824",sb:"#29306a",sun:"#f4f1dc",glow:"200,210,255",gem:"#b7f3ff"}};
const dfLK=()=>DF_LV[DF?DF.lv:0].k;
function dfCv(w,h,k){const c=document.createElement("canvas");c.width=Math.max(1,Math.ceil(w*k));c.height=Math.max(1,Math.ceil(h*k));const x=c.getContext("2d");x.scale(k,k);return[c,x]}
/* a smooth wavy line that repeats every 720 */
const dfWv=(x,s,p)=>{let v=0;for(let i=0;i<p.length;i++)v+=p[i][1]*Math.sin(2*Math.PI*p[i][0]*x/DF_LW+dfH(s,i)*6.283);return v};
const dfGrad=(x,y0,y1,stops)=>{const g=x.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g};
/* draw something at x, and again one strip-width either side, so the strip joins up seamlessly */
const dfWrap=(x,f)=>{f(x);if(x<120)f(x+DF_LW);if(x>DF_LW-120)f(x-DF_LW)};
function dfCloudShape(x,cx,cy,s,top,bot){x.fillStyle=dfGrad(x,cy-26*s,cy+16*s,[top,top,bot]);x.beginPath();for(const[dx,dy,r]of[[0,0,18],[20,-10,22],[44,-4,18],[62,4,13],[-16,6,12],[30,6,16]]){x.moveTo(cx+dx*s+r*s,cy+dy*s);x.arc(cx+dx*s,cy+dy*s,r*s,0,7)}x.fill()}
/* jagged mountains: peaks every `per`, repeating every 720 */
function dfPeaks(x,base,per,h0,h1,seed,fill,snow,shade){const N=Math.round(DF_LW/per),pts=[];for(let i=-1;i<=N+1;i++){const j=((i%N)+N)%N,px=i*per+(dfH(j,seed)-.5)*per*.5,h=h0+(h1-h0)*dfH(j,seed+3);pts.push([px,base-h,per*(.55+.3*dfH(j,seed+5))])}
  x.fillStyle=fill;x.beginPath();x.moveTo(-per,base+400);for(const[px,py,w]of pts){x.lineTo(px-w,base);x.lineTo(px-w*.35,py+(base-py)*.25);x.lineTo(px,py);x.lineTo(px+w*.3,py+(base-py)*.3);x.lineTo(px+w,base)}x.lineTo(DF_LW+per,base+400);x.fill();
  if(shade){x.fillStyle=shade;for(const[px,py,w]of pts){x.beginPath();x.moveTo(px,py);x.lineTo(px+w*.3,py+(base-py)*.3);x.lineTo(px+w,base);x.lineTo(px+w*.15,base);x.closePath();x.fill()}}
  if(snow){x.fillStyle=snow;for(const[px,py,w]of pts){const k=.32,by=py+(base-py)*k;x.beginPath();x.moveTo(px,py);x.lineTo(px+w*.3*k*3.1,by);x.lineTo(px+w*.12,by-8);x.lineTo(px-w*.02,by+4);x.lineTo(px-w*.16,by-6);x.lineTo(px-w*.35*k*3.1,by);x.closePath();x.fill()}}}
/* rolling hills that repeat every 720; returns the hill height function so trees can sit on it */
function dfHillsP(x,base,amp,seed,fill,edge){const f=q=>base-amp*(.5+.5*dfWv(q,seed,[[2,.55],[3,.3],[7,.15]]));x.fillStyle=fill;x.beginPath();x.moveTo(0,DFH+DFB+10);for(let q=0;q<=DF_LW;q+=6)x.lineTo(q,f(q));x.lineTo(DF_LW,DFH+DFB+10);x.closePath();x.fill();
  if(edge){x.strokeStyle=edge;x.lineWidth=2;x.beginPath();for(let q=0;q<=DF_LW;q+=6)q?x.lineTo(q,f(q)+1):x.moveTo(q,f(q)+1);x.stroke()}return f}
function dfTreeP(x,px,base,s,col,pine,snow){x.fillStyle="#5b3a22";x.fillRect(px-2*s,base-10*s,4*s,10*s);
  if(pine){for(let k=0;k<3;k++){x.fillStyle=col;x.beginPath();x.moveTo(px-(13-k*3)*s,base-(8+k*10)*s);x.lineTo(px,base-(27+k*10)*s);x.lineTo(px+(13-k*3)*s,base-(8+k*10)*s);x.fill();
      if(snow){x.fillStyle=snow;x.beginPath();x.moveTo(px-(7-k*2)*s,base-(17+k*10)*s);x.lineTo(px,base-(27+k*10)*s);x.lineTo(px+(7-k*2)*s,base-(17+k*10)*s);x.fill()}}}
  else{x.fillStyle=col;x.beginPath();x.arc(px,base-18*s,12*s,0,7);x.arc(px-8*s,base-12*s,9*s,0,7);x.arc(px+8*s,base-12*s,9*s,0,7);x.fill();x.fillStyle="rgba(255,255,255,.18)";x.beginPath();x.arc(px-4*s,base-22*s,5*s,0,7);x.fill()}}
function dfCastleP(x,cx,base,s,col,win,flag){const w=90*s,h=46*s;x.fillStyle=col;x.fillRect(cx-w/2,base-h,w,h);
  for(const[dx,tw,th]of[[-w/2,22*s,80*s],[w/2-22*s,22*s,80*s],[-11*s,22*s,104*s]]){x.fillStyle=col;x.fillRect(cx+dx,base-th,tw,th);x.beginPath();x.moveTo(cx+dx-4*s,base-th);x.lineTo(cx+dx+tw/2,base-th-26*s);x.lineTo(cx+dx+tw+4*s,base-th);x.fill();
    if(win){x.fillStyle=win;x.fillRect(cx+dx+tw/2-3*s,base-th+14*s,6*s,9*s)}if(flag){x.strokeStyle=col;x.lineWidth=1.5*s;x.beginPath();x.moveTo(cx+dx+tw/2,base-th-26*s);x.lineTo(cx+dx+tw/2,base-th-40*s);x.stroke();x.fillStyle=flag;x.fillRect(cx+dx+tw/2,base-th-40*s,10*s,6*s)}}
  x.fillStyle=col;for(let i=0;i<5;i++)x.fillRect(cx-w/2+i*w/4.5,base-h-7*s,9*s,7*s)}
function dfGlow(x,cx,cy,r,rgb,a){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2)}
function dfCrystal(x,cx,cy,s,col,rgb){dfGlow(x,cx,cy-10*s,34*s,rgb,.35);for(const[dx,h,a]of[[0,30,0],[-8,20,-.35],[8,22,.3]]){x.save();x.translate(cx+dx*s,cy);x.rotate(a);x.fillStyle=col;x.beginPath();x.moveTo(-4*s,0);x.lineTo(-4*s,-h*s*.75);x.lineTo(0,-h*s);x.lineTo(4*s,-h*s*.75);x.lineTo(4*s,0);x.fill();x.fillStyle="rgba(255,255,255,.45)";x.beginPath();x.moveTo(-4*s,-h*s*.75);x.lineTo(0,-h*s);x.lineTo(0,0);x.lineTo(-4*s,0);x.fill();x.restore()}}
/* the strips for each world: [how fast it slides, top of strip, bottom of strip, painter] */
function dfStrips(k){const B=DFH+DFB,T=-DFT,cl=(x,top,bot,n,y0,y1,s0)=>{for(let i=0;i<n;i++){const cx=i*DF_LW/n+dfH(i,41)*60,cy=y0+dfH(i,42)*(y1-y0),s=s0*(.75+dfH(i,43)*.6);dfWrap(cx,q=>dfCloudShape(x0(x),q,cy,s,top,bot))}},x0=x=>x;
  const L={
  valley:[[.05,T,240,x=>{for(let i=0;i<6;i++){const cx=i*120+dfH(i,41)*60,cy=30+dfH(i,42)*130,s=.8+dfH(i,43)*.6;dfWrap(cx,q=>dfCloudShape(x,q,cy,s,"#ffffff","#d5e8fb"))}}],
    [.12,DFH-320,B,x=>{dfPeaks(x,DFH-90,120,120,230,1,dfGrad(x,DFH-320,DFH-90,["#6f9bd0","#a9c7ea"]),"#f4f9ff","rgba(40,70,120,.18)");x.fillStyle=dfGrad(x,DFH-170,DFH-80,["rgba(207,238,255,0)","rgba(207,238,255,.75)"]);x.fillRect(0,DFH-170,DF_LW,90);x.fillStyle="#a9c7ea";x.fillRect(0,DFH-82,DF_LW,B)}],
    [.32,DFH-210,B,x=>{const f=dfHillsP(x,DFH-70,60,2,dfGrad(x,DFH-140,DFH,["#7ccf5e","#4b9e45"]),"rgba(255,255,255,.25)");
      for(let i=0;i<26;i++){const px=i*DF_LW/26+dfH(i,7)*20;if(dfH(i,8)<.35)continue;dfWrap(px,q=>dfTreeP(x,q,f(q)+6,.8+dfH(i,9)*.4,dfH(i,10)<.5?"#2f8a3b":"#3d9b40",0))}
      for(let i=0;i<4;i++){const px=60+i*180+dfH(i,11)*40;dfWrap(px,q=>{const b=f(q)+4;x.fillStyle="#fff8e8";x.fillRect(q-9,b-12,18,12);x.fillStyle="#d9534f";x.beginPath();x.moveTo(q-12,b-12);x.lineTo(q,b-22);x.lineTo(q+12,b-12);x.fill();x.fillStyle="#6b4a2b";x.fillRect(q-2,b-7,4,7)})}
      {const q0=300;dfWrap(q0,q=>{const b=f(q)+4;x.fillStyle="#efe6d2";x.fillRect(q-5,b-34,10,34);x.save();x.translate(q,b-34);x.strokeStyle="#8b5a2b";x.lineWidth=3;for(let a=0;a<4;a++){x.rotate(Math.PI/2);x.beginPath();x.moveTo(0,0);x.lineTo(0,-20);x.stroke()}x.restore()})}}],
    [.62,DFH-120,B,x=>{const f=dfHillsP(x,DFH-34,26,3,dfGrad(x,DFH-90,DFH,["#4aa947","#2d7f30"]),"rgba(255,255,255,.3)");
      for(let i=0;i<40;i++){const px=i*18+dfH(i,12)*12;dfWrap(px,q=>{const b=f(q)+8+dfH(i,13)*14;x.fillStyle=["#ffe14d","#ff7ab6","#ffffff","#b58cff"][i%4];x.beginPath();x.arc(q,b,2.2,0,7);x.fill()})}
      for(let i=0;i<9;i++){const px=i*80+dfH(i,14)*30;dfWrap(px,q=>{x.fillStyle="#2c7a2f";x.beginPath();x.arc(q,f(q)+4,11,Math.PI,0);x.arc(q+12,f(q)+6,8,Math.PI,0);x.fill()})}}]],
  snow:[[.05,T,230,x=>{for(let i=0;i<5;i++){const cx=i*144+dfH(i,41)*60,cy=40+dfH(i,42)*110,s=.8+dfH(i,43)*.5;dfWrap(cx,q=>dfCloudShape(x,q,cy,s,"#ffffff","#dbe6f5"))}}],
    [.12,DFH-340,B,x=>{dfPeaks(x,DFH-80,140,170,280,5,dfGrad(x,DFH-360,DFH-80,["#7b93bd","#b6c8e4"]),"#ffffff","rgba(50,70,120,.25)");x.fillStyle=dfGrad(x,DFH-160,DFH-70,["rgba(241,247,255,0)","rgba(241,247,255,.8)"]);x.fillRect(0,DFH-160,DF_LW,90);x.fillStyle="#d7e3f3";x.fillRect(0,DFH-72,DF_LW,B)}],
    [.32,DFH-220,B,x=>{const f=dfHillsP(x,DFH-66,50,6,dfGrad(x,DFH-130,DFH,["#f7fbff","#cfdcee"]),"rgba(120,150,200,.35)");for(let i=0;i<34;i++){const px=i*DF_LW/34+dfH(i,15)*14;if(dfH(i,16)<.3)continue;dfWrap(px,q=>dfTreeP(x,q,f(q)+6,.75+dfH(i,17)*.5,"#24584a",1,"#ffffff"))}}],
    [.62,DFH-120,B,x=>{const f=dfHillsP(x,DFH-30,24,7,dfGrad(x,DFH-80,DFH,["#ffffff","#c9daf0"]),"rgba(140,170,215,.5)");for(let i=0;i<7;i++){const px=i*103+dfH(i,18)*40;dfWrap(px,q=>dfTreeP(x,q,f(q)+8,1.25,"#1f4d40",1,"#ffffff"))}
      x.fillStyle="rgba(150,180,225,.35)";for(let i=0;i<12;i++){const px=i*60+dfH(i,19)*30;dfWrap(px,q=>{x.beginPath();x.ellipse(q,f(q)+16,26,5,0,0,7);x.fill()})}}]],
  castle:[[.05,T,240,x=>{for(let i=0;i<5;i++){const cx=i*144+dfH(i,41)*60,cy=40+dfH(i,42)*120,s=.8+dfH(i,43)*.5;dfWrap(cx,q=>dfCloudShape(x,q,cy,s,"#fff3df","#ffc69a"))}
      for(let i=0;i<3;i++){const cx=100+i*240+dfH(i,44)*60,cy=70+dfH(i,45)*80,c=[["#e74c3c","#ffd23f"],["#3aa8ff","#ffffff"],["#9b59b6","#ffd23f"]][i];dfWrap(cx,q=>{x.fillStyle=c[0];x.beginPath();x.arc(q,cy,15,0,7);x.fill();x.fillStyle=c[1];x.beginPath();x.ellipse(q,cy,5,15,0,0,7);x.fill();x.strokeStyle="#6b4a2b";x.lineWidth=1;x.beginPath();x.moveTo(q-8,cy+12);x.lineTo(q-4,cy+24);x.moveTo(q+8,cy+12);x.lineTo(q+4,cy+24);x.stroke();x.fillStyle="#8b5a2b";x.fillRect(q-5,cy+24,10,7)})}}],
    [.12,DFH-300,B,x=>{dfHillsP(x,DFH-100,70,8,dfGrad(x,DFH-200,DFH-60,["#b0738a","#d9a08e"]));for(let i=0;i<3;i++){const cx=110+i*240+dfH(i,20)*40;dfWrap(cx,q=>dfCastleP(x,q,DFH-120+dfH(i,21)*16,.7+dfH(i,22)*.3,"#94607a","#ffe08a","#ffd23f"))}
      x.fillStyle=dfGrad(x,DFH-150,DFH-70,["rgba(255,224,160,0)","rgba(255,224,160,.6)"]);x.fillRect(0,DFH-150,DF_LW,80);x.fillStyle="#d9a08e";x.fillRect(0,DFH-72,DF_LW,B)}],
    [.32,DFH-210,B,x=>{const f=dfHillsP(x,DFH-66,46,9,dfGrad(x,DFH-120,DFH,["#9ccf5c","#5f9b3a"]),"rgba(255,255,255,.25)");
      for(let i=0;i<14;i++){const px=i*DF_LW/14+dfH(i,23)*20,cols=["#f6e7c8","#f2d0a4","#e8e0ff","#ffd6d6"],roof=["#c0392b","#2e86c1","#8e44ad","#d35400"];dfWrap(px,q=>{const b=f(q)+6,w=14+dfH(i,24)*10,h=12+dfH(i,25)*12;x.fillStyle=cols[i%4];x.fillRect(q-w/2,b-h,w,h);x.fillStyle=roof[i%4];x.beginPath();x.moveTo(q-w/2-3,b-h);x.lineTo(q,b-h-10);x.lineTo(q+w/2+3,b-h);x.fill();x.fillStyle="#ffe08a";x.fillRect(q-2,b-h+4,4,4)})}}],
    [.62,DFH-120,B,x=>{const f=dfHillsP(x,DFH-32,22,10,dfGrad(x,DFH-80,DFH,["#78b843","#4f8a2c"]),"rgba(255,255,255,.3)");x.strokeStyle="#8b5a2b";x.lineWidth=2;
      for(let i=0;i<36;i++){const px=i*20;dfWrap(px,q=>{x.beginPath();x.moveTo(q,f(q)+10);x.lineTo(q,f(q)+24);x.stroke()})}x.beginPath();for(let q=0;q<=DF_LW;q+=6)q?x.lineTo(q,f(q)+14):x.moveTo(q,f(q)+14);x.stroke();
      for(let i=0;i<5;i++){const px=i*144+dfH(i,26)*60;dfWrap(px,q=>{x.fillStyle="#e7b84a";x.beginPath();x.arc(q,f(q)+6,12,Math.PI,0);x.fill();x.fillStyle="#c9952e";x.fillRect(q-12,f(q)+4,24,4)})}}]],
  cave:[[.08,T,DFH*.42,x=>{x.fillStyle=dfGrad(x,T,DFH*.42,["#0a0514","#1d0f3a"]);x.beginPath();x.moveTo(0,T);for(let q=0;q<=DF_LW;q+=8)x.lineTo(q,40+dfWv(q,30,[[4,22],[9,10],[17,6]]));x.lineTo(DF_LW,T);x.fill();
      for(let i=0;i<24;i++){const px=i*30+dfH(i,31)*16,h=30+dfH(i,32)*70,by=40+dfWv(px,30,[[4,22],[9,10],[17,6]]);dfWrap(px,q=>{x.fillStyle="#170b30";x.beginPath();x.moveTo(q-9,by-4);x.lineTo(q,by+h);x.lineTo(q+9,by-4);x.fill()})}
      for(let i=0;i<6;i++){const px=40+i*120+dfH(i,33)*40;dfWrap(px,q=>{x.save();x.translate(0,2*(30+dfH(i,34)*20));x.scale(1,-1);dfCrystal(x,q,30+dfH(i,34)*20,.7,i%2?"#7ef9ff":"#ff7ae6",i%2?"126,249,255":"255,122,230");x.restore()})}}],
    [.12,DFH-330,B,x=>{x.fillStyle=dfGrad(x,DFH-330,DFH,["#2a1652","#170b33"]);x.beginPath();x.moveTo(0,B);for(let q=0;q<=DF_LW;q+=8)x.lineTo(q,DFH-150+dfWv(q,35,[[3,60],[7,30],[13,12]]));x.lineTo(DF_LW,B);x.fill();
      for(let i=0;i<7;i++){const px=50+i*100+dfH(i,36)*40,by=DFH-150+dfWv(px,35,[[3,60],[7,30],[13,12]])+10;dfWrap(px,q=>dfCrystal(x,q,by,.9+dfH(i,37)*.5,["#7ef9ff","#ff7ae6","#b48cff"][i%3],["126,249,255","255,122,230","180,140,255"][i%3]))}}],
    [.32,DFH-230,B,x=>{for(let i=0;i<14;i++){const px=i*52+dfH(i,38)*20,h=60+dfH(i,39)*120,w=16+dfH(i,40)*14;dfWrap(px,q=>{x.fillStyle=dfGrad(x,DFH-h,DFH,["#2d1a55","#1a0e36"]);x.beginPath();x.moveTo(q-w,B);x.lineTo(q-w*.3,DFH-h*.5);x.lineTo(q,DFH-h);x.lineTo(q+w*.35,DFH-h*.45);x.lineTo(q+w,B);x.fill()})}}],
    [.62,DFH-110,B,x=>{x.fillStyle=dfGrad(x,DFH-60,DFH,["#24133f","#120a24"]);x.beginPath();x.moveTo(0,B);for(let q=0;q<=DF_LW;q+=6)x.lineTo(q,DFH-26+dfWv(q,44,[[5,10],[11,6],[23,3]]));x.lineTo(DF_LW,B);x.fill();
      for(let i=0;i<6;i++){const px=60+i*120+dfH(i,45)*50;dfWrap(px,q=>dfCrystal(x,q,DFH-20+dfWv(q,44,[[5,10],[11,6],[23,3]]),1.2,["#ff7ae6","#7ef9ff"][i%2],["255,122,230","126,249,255"][i%2]))}}]],
  volcano:[[.05,T,250,x=>{for(let i=0;i<6;i++){const cx=i*120+dfH(i,41)*60,cy=30+dfH(i,42)*140,s=.9+dfH(i,43)*.6;dfWrap(cx,q=>dfCloudShape(x,q,cy,s,"#3b2a2a","#a8452a"))}}],
    [.12,DFH-330,B,x=>{dfPeaks(x,DFH-90,90,60,140,12,dfGrad(x,DFH-250,DFH-90,["#3a1d1a","#6a2e22"]),null,"rgba(0,0,0,.25)");
      for(let i=0;i<2;i++){const cx=180+i*360;dfWrap(cx,q=>{x.fillStyle=dfGrad(x,DFH-300,DFH-80,["#2a1210","#5a2a1e"]);x.beginPath();x.moveTo(q-170,DFH-80);x.lineTo(q-30,DFH-280);x.lineTo(q+30,DFH-280);x.lineTo(q+170,DFH-80);x.fill();
        dfGlow(x,q,DFH-285,70,"255,120,40",.7);x.fillStyle="#ffb347";x.beginPath();x.ellipse(q,DFH-281,28,6,0,0,7);x.fill();x.strokeStyle="#ff7a1f";x.lineWidth=4;x.beginPath();x.moveTo(q-10,DFH-278);x.quadraticCurveTo(q-30,DFH-200,q-60,DFH-110);x.moveTo(q+12,DFH-278);x.quadraticCurveTo(q+40,DFH-190,q+50,DFH-100);x.stroke();
        x.fillStyle="rgba(60,40,40,.5)";for(let k=0;k<5;k++){x.beginPath();x.arc(q-20+k*14,DFH-310-k*24,16+k*5,0,7);x.fill()}})}
      x.fillStyle=dfGrad(x,DFH-160,DFH-70,["rgba(255,106,42,0)","rgba(255,106,42,.45)"]);x.fillRect(0,DFH-160,DF_LW,90);x.fillStyle="#6a2e22";x.fillRect(0,DFH-82,DF_LW,B)}],
    [.32,DFH-210,B,x=>{x.fillStyle="#1f0f0d";x.beginPath();x.moveTo(0,B);for(let q=0;q<=DF_LW;q+=10)x.lineTo(q,DFH-70-Math.abs(dfWv(q,50,[[6,40],[13,20],[27,8]])));x.lineTo(DF_LW,B);x.fill();
      x.strokeStyle="#ff6a1f";x.lineWidth=1.5;for(let i=0;i<18;i++){const px=i*40+dfH(i,51)*20;dfWrap(px,q=>{const b=DFH-50-Math.abs(dfWv(q,50,[[6,40],[13,20],[27,8]]))*.5;x.beginPath();x.moveTo(q,b);x.lineTo(q+5,b+10);x.lineTo(q-2,b+18);x.lineTo(q+4,b+30);x.stroke()})}}],
    [.62,DFH-90,B,x=>{x.fillStyle=dfGrad(x,DFH-40,B,["#ffd04a","#ff7a1f","#c2410c"]);x.fillRect(0,DFH-40,DF_LW,B);dfGlow(x,DF_LW/2,DFH-30,DF_LW,"255,140,40",.25);
      x.fillStyle="#3a1a12";for(let i=0;i<14;i++){const px=i*52+dfH(i,52)*20;dfWrap(px,q=>{x.beginPath();x.ellipse(q,DFH-20+dfH(i,53)*16,14+dfH(i,54)*16,4,0,0,7);x.fill()})}
      x.fillStyle="#2a120d";x.beginPath();x.moveTo(0,DFH-38);for(let q=0;q<=DF_LW;q+=8)x.lineTo(q,DFH-40+dfWv(q,55,[[9,3],[19,2]]));x.lineTo(DF_LW,DFH-34);x.lineTo(0,DFH-34);x.fill()}]],
  storm:[[.04,T,260,x=>{for(let i=0;i<6;i++){const cx=i*120+dfH(i,41)*60,cy=20+dfH(i,42)*160,s=1.1+dfH(i,43)*.7;dfWrap(cx,q=>{dfCloudShape(x,q,cy,s,"#3a4178","#151a3d");x.strokeStyle="rgba(210,220,255,.25)";x.lineWidth=2;x.beginPath();x.arc(q+20*s,cy-10*s,22*s,Math.PI*1.1,Math.PI*1.8);x.stroke()})}}],
    [.12,DFH-300,B,x=>{for(let i=0;i<4;i++){const cx=80+i*180+dfH(i,60)*40,cy=DFH-200+dfH(i,61)*80,s=.7+dfH(i,62)*.5;dfWrap(cx,q=>{x.fillStyle="#232a5a";x.beginPath();x.moveTo(q-40*s,cy);x.lineTo(q+40*s,cy);x.lineTo(q+12*s,cy+50*s);x.lineTo(q,cy+70*s);x.lineTo(q-14*s,cy+46*s);x.fill();x.fillStyle="#2f6a4a";x.fillRect(q-40*s,cy-5*s,80*s,6*s);x.fillStyle="rgba(150,200,255,.35)";x.fillRect(q+18*s,cy,3*s,60*s)})}
      x.fillStyle=dfGrad(x,DFH-120,DFH,["rgba(41,48,106,0)","#29306a"]);x.fillRect(0,DFH-120,DF_LW,B)}],
    [.32,DFH-170,B,x=>{x.fillStyle="#262d63";x.beginPath();x.moveTo(0,B);for(let q=0;q<=DF_LW;q+=6)x.lineTo(q,DFH-70+dfWv(q,63,[[5,14],[11,8],[21,5]])-Math.abs(dfWv(q,64,[[9,10]])));x.lineTo(DF_LW,B);x.fill()}],
    [.62,DFH-110,B,x=>{x.fillStyle=dfGrad(x,DFH-60,B,["#353d7a","#1b2050"]);x.beginPath();x.moveTo(0,B);for(let q=0;q<=DF_LW;q+=6)x.lineTo(q,DFH-34+dfWv(q,65,[[6,10],[13,6],[29,3]])-Math.abs(dfWv(q,66,[[11,8]])));x.lineTo(DF_LW,B);x.fill();
      x.strokeStyle="rgba(200,215,255,.22)";x.lineWidth=2;x.beginPath();for(let q=0;q<=DF_LW;q+=6){const y=DFH-34+dfWv(q,65,[[6,10],[13,6],[29,3]])-Math.abs(dfWv(q,66,[[11,8]]));q?x.lineTo(q,y+2):x.moveTo(q,y+2)}x.stroke()}]]};
  return L[k].map(([par,y0,y1,paint])=>{const[c,x]=dfCv(DF_LW,y1-y0,Math.min(1.6,DFC.k));x.translate(0,-y0);paint(x);return{par,y0,c}})}
/* obstacle pictures for each world (a top piece hanging down, a bottom piece standing up), painted once */
function dfPillar(k,sp){const key=k+"|"+(sp||"")+"|"+DFC.k;if(DFC.p&&DFC.p[key])return DFC.p[key];DFC.p=DFC.p||{};const W=DF_OW+30,H=700,m=15,ow=DF_OW,K=Math.min(2,DFC.k);
  const[bc,b]=dfCv(W,H,K),[tc,t]=dfCv(W,H,K);t.translate(0,H);t.scale(1,-1);/* the top piece is painted upside down, as if it were a bottom piece */
  const rock=(x,c0,c1,c2,seed)=>{x.fillStyle=(()=>{const g=x.createLinearGradient(m,0,m+ow,0);g.addColorStop(0,c0);g.addColorStop(.45,c1);g.addColorStop(1,c2);return g})();x.beginPath();x.moveTo(m+4,H);x.lineTo(m+1,40);x.lineTo(m+10,16);x.lineTo(m+22,24);x.lineTo(m+34,6);x.lineTo(m+48,18);x.lineTo(m+ow-2,30);x.lineTo(m+ow-4,H);x.fill();
    x.strokeStyle="rgba(0,0,0,.15)";x.lineWidth=2;for(let y=70;y<H;y+=44+dfH(y,seed)*20){x.beginPath();x.moveTo(m+4,y);x.lineTo(m+ow-6,y+8*(dfH(y,seed+1)-.5));x.stroke()}
    x.fillStyle="rgba(255,255,255,.12)";x.fillRect(m+8,50,6,H)};
  const paint=(x,top)=>{
    if(k==="valley"){rock(x,"#c3a888","#9a7f63","#6b5644",top?3:1);x.fillStyle=top?"#4a7f3a":"#58b94a";x.beginPath();x.moveTo(m-2,42);x.lineTo(m+10,12);x.lineTo(m+22,20);x.lineTo(m+34,2);x.lineTo(m+48,14);x.lineTo(m+ow+2,28);x.lineTo(m+ow,44);x.lineTo(m+48,32);x.lineTo(m+34,26);x.lineTo(m+22,36);x.lineTo(m+10,30);x.closePath();x.fill();
      if(!top){x.fillStyle="#3d8f3a";for(const vx of[8,28,50])x.fillRect(m+vx,30,4,30+dfH(vx,6)*40)}if(!top){x.fillStyle="#ff7ab6";x.beginPath();x.arc(m+20,16,3,0,7);x.arc(m+46,12,3,0,7);x.fill()}}
    else if(k==="snow"){rock(x,"#c9d8ea","#8fa3c0","#5f7493",top?7:8);x.fillStyle=top?"#e6f3ff":"#ffffff";x.beginPath();x.moveTo(m-3,46);x.lineTo(m+10,10);x.lineTo(m+22,18);x.lineTo(m+34,0);x.lineTo(m+48,12);x.lineTo(m+ow+3,26);x.lineTo(m+ow,52);x.quadraticCurveTo(m+40,40,m+30,58);x.quadraticCurveTo(m+18,44,m-3,56);x.fill();x.fillStyle="rgba(140,175,220,.45)";x.fillRect(m+ow-14,30,10,24);
      if(top){x.fillStyle="#dff4ff";for(const vx of[6,20,36,52]){x.beginPath();x.moveTo(m+vx-5,30);x.lineTo(m+vx,4+dfH(vx,9)*8);x.lineTo(m+vx+5,30);x.fill()}}}
    else if(k==="castle"&&sp==="gate"){x.fillStyle="#4a3424";x.fillRect(m+2,14,ow-4,H);x.strokeStyle="#2a1d14";x.lineWidth=4;for(let vx=8;vx<ow;vx+=13){x.beginPath();x.moveTo(m+vx,0);x.lineTo(m+vx,H);x.stroke()}for(let y=30;y<H;y+=26){x.beginPath();x.moveTo(m,y);x.lineTo(m+ow,y);x.stroke()}
      x.fillStyle="#9aa3ad";for(let vx=8;vx<ow;vx+=13){x.beginPath();x.moveTo(m+vx-5,16);x.lineTo(m+vx,0);x.lineTo(m+vx+5,16);x.fill()}x.fillStyle="#ffd23f";x.fillRect(m+2,40,ow-4,6)}
    else if(k==="castle"){x.fillStyle=(()=>{const g=x.createLinearGradient(m,0,m+ow,0);g.addColorStop(0,"#ddd6cb");g.addColorStop(.5,"#b9b0a4");g.addColorStop(1,"#8c847a");return g})();x.fillRect(m+4,24,ow-8,H);
      x.fillStyle="rgba(80,70,60,.28)";for(let y=40;y<H;y+=14)for(let q=((y/14|0)%2)*11;q<ow-8;q+=22)x.fillRect(m+4+q,y,11,2);for(let i=0;i<4;i++)x.fillRect(m+4+i*(ow-8)/3.5,10,10,14);x.fillStyle="#d3ccc2";x.fillRect(m,20,ow,8);
      if(top){x.fillStyle="#c0392b";x.beginPath();x.moveTo(m+18,30);x.lineTo(m+18,120);x.lineTo(m+33,106);x.lineTo(m+48,120);x.lineTo(m+48,30);x.fill();x.fillStyle="#ffd23f";x.beginPath();x.arc(m+33,62,8,0,7);x.fill()}
      else{x.fillStyle="#2b2018";x.beginPath();x.arc(m+ow/2,70,7,Math.PI,0);x.rect(m+ow/2-7,70,14,12);x.fill();x.fillStyle="#ffd98a";x.fillRect(m+ow/2-4,66,8,10)}}
    else if(k==="cave"){x.fillStyle=(()=>{const g=x.createLinearGradient(m,0,m+ow,0);g.addColorStop(0,"#a58ae0");g.addColorStop(.5,"#7357b8");g.addColorStop(1,"#4a3388");return g})();x.beginPath();x.moveTo(m-4,H);x.lineTo(m+12,60);x.lineTo(m+ow/2,0);x.lineTo(m+ow-12,60);x.lineTo(m+ow+4,H);x.fill();x.strokeStyle="#e2d2ff";x.lineWidth=2.5;x.beginPath();x.moveTo(m-4,H);x.lineTo(m+12,60);x.lineTo(m+ow/2,0);x.lineTo(m+ow-12,60);x.lineTo(m+ow+4,H);x.stroke();
      dfCrystal(x,m+ow/2-6,110,.8,top?"#7ef9ff":"#ff7ae6",top?"126,249,255":"255,122,230");dfCrystal(x,m+ow/2+10,220,.6,"#b48cff","180,140,255")}
    else if(k==="volcano"){x.fillStyle=(()=>{const g=x.createLinearGradient(m,0,m+ow,0);g.addColorStop(0,"#4a2a24");g.addColorStop(.5,"#2c1714");g.addColorStop(1,"#170b09");return g})();x.beginPath();x.moveTo(m+2,H);x.lineTo(m+2,20);x.lineTo(m+ow/3,6);x.lineTo(m+ow*2/3,6);x.lineTo(m+ow-2,20);x.lineTo(m+ow-2,H);x.fill();
      x.strokeStyle="#ff6a1f";x.lineWidth=2;x.shadowColor="#ff8a1f";x.shadowBlur=6;for(let i=0;i<5;i++){const y0=40+i*90;x.beginPath();x.moveTo(m+10+dfH(i,70)*30,y0);x.lineTo(m+20+dfH(i,71)*30,y0+20);x.lineTo(m+12+dfH(i,72)*30,y0+44);x.stroke()}x.shadowBlur=0;
      x.fillStyle="#ff8a1f";x.fillRect(m+4,14,ow-8,4);x.fillStyle="rgba(0,0,0,.25)";x.fillRect(m+ow/3,14,2,H);x.fillRect(m+ow*2/3,14,2,H)}
    else{/* storm: floating islands */x.fillStyle=(()=>{const g=x.createLinearGradient(m,0,m+ow,0);g.addColorStop(0,"#6b6f8f");g.addColorStop(.5,"#4a4e70");g.addColorStop(1,"#2e3150");return g})();x.beginPath();x.moveTo(m-6,22);x.lineTo(m+ow+6,22);x.lineTo(m+ow-4,H);x.lineTo(m+4,H);x.fill();
      x.fillStyle=top?"#4a4e70":"#3f8f5a";x.beginPath();x.moveTo(m-8,24);x.quadraticCurveTo(m+ow/2,0,m+ow+8,24);x.lineTo(m+ow+6,30);x.lineTo(m-6,30);x.fill();x.fillStyle="#7ef9ff";x.globalAlpha=.6;for(let i=0;i<3;i++){x.fillRect(m+14+i*16,80+i*60,6,6)}x.globalAlpha=1;
      if(!top){x.strokeStyle="#6b4a2b";x.lineWidth=2;for(const vx of[10,30,50]){x.beginPath();x.moveTo(m+vx,30);x.quadraticCurveTo(m+vx+6,60,m+vx-2,90);x.stroke()}}}};
  paint(b,0);paint(t,1);return DFC.p[key]={b:bc,t:tc,W,H,m}}
function dfCache(){const c=$("#dfc"),k=c&&c._k||2,key=[DF.lv,k,DFT.toFixed(1),DFB.toFixed(1)].join("|");if(DFC.key!==key){DFC.k=k;DFC.key=key;DFC.strips=dfStrips(dfLK());DFC.p={}}return DFC}
function dfBlit(ctx,s,cam){const off=((cam*s.par)%DF_LW+DF_LW)%DF_LW,h=s.c.height/(s.c.width/DF_LW);for(let x=-off;x<DFW;x+=DF_LW)ctx.drawImage(s.c,x,s.y0,DF_LW,h)}
/* the sky, sun or moon, and the far strips */
function dfSky(ctx,cam){const k=dfLK(),P=DF_PAL[k],t=DF.t;ctx.fillStyle=dfGrad(ctx,-DFT,DFH,[P.st,P.sb]);ctx.fillRect(0,-DFT,DFW,DFH+DFT+DFB);
  if(k==="storm"||k==="cave"){ctx.fillStyle="#fff";for(let i=0;i<50;i++){const x=((dfH(i,3)*DFW*1.5-cam*.02)%DFW+DFW)%DFW,y=-DFT+dfH(i,4)*(DFT+240);ctx.globalAlpha=k==="cave"?.25:.5+.5*Math.sin(t*2+i);ctx.fillRect(x,y,1.6,1.6)}ctx.globalAlpha=1}
  if(P.sun){const sx=DFW-80,sy=k==="volcano"?150:k==="storm"?70:k==="castle"?120:60,sr=k==="storm"?22:k==="volcano"?34:28;ctx.save();dfGlow(ctx,sx,sy,sr*4,P.glow,.45);ctx.restore();ctx.fillStyle=P.sun;ctx.beginPath();ctx.arc(sx,sy,sr,0,7);ctx.fill();
    if(k==="storm"){ctx.fillStyle="rgba(0,0,0,.12)";ctx.beginPath();ctx.arc(sx-6,sy-4,5,0,7);ctx.arc(sx+7,sy+6,4,0,7);ctx.fill()}
    if(k==="valley"||k==="castle"){ctx.save();ctx.globalAlpha=.08;ctx.fillStyle="#fff";ctx.translate(sx,sy);ctx.rotate(t*.05);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-30,-DFH);ctx.lineTo(30,-DFH);ctx.fill()}ctx.restore()}}
  if(k==="cave"){ctx.save();ctx.globalAlpha=.07;ctx.fillStyle="#d9c2ff";for(let i=0;i<4;i++){const x=((i*260+80-cam*.1)%(DFW+300)+DFW+300)%(DFW+300)-150;ctx.beginPath();ctx.moveTo(x,-DFT);ctx.lineTo(x+60,-DFT);ctx.lineTo(x+180,DFH);ctx.lineTo(x+90,DFH);ctx.fill()}ctx.restore()}}
/* gentle weather that drifts in front of everything */
function dfAmbient(ctx,dt){const k=dfLK(),A=DF.amb,n={valley:14,snow:60,castle:12,cave:26,volcano:40,storm:80}[k];
  while(A.length<n)A.push({x:Math.random()*DFW,y:-DFT+Math.random()*(DFH+DFT+DFB),r:Math.random(),p:Math.random()*6});
  for(const a of A){if(k==="snow"){a.x-=(30+a.r*40)*dt;a.y+=(30+a.r*50)*dt;a.x+=Math.sin(DF.t*2+a.p)*.3}
    else if(k==="storm"){a.x-=(160+a.r*80)*dt;a.y+=(520+a.r*200)*dt}
    else if(k==="volcano"){a.x-=(40+a.r*60)*dt;a.y-=(30+a.r*60)*dt;a.x+=Math.sin(DF.t*3+a.p)*.5}
    else if(k==="cave"){a.x-=(20+a.r*20)*dt;a.y+=Math.sin(DF.t+a.p)*.3}
    else{a.x-=(40+a.r*40)*dt;a.y+=Math.sin(DF.t*1.5+a.p)*.4}
    if(a.x<-10)a.x+=DFW+20;if(a.y>DFH+DFB+10)a.y=-DFT-10;if(a.y<-DFT-10)a.y=DFH+DFB}
  if(k==="storm"){ctx.strokeStyle="rgba(180,200,255,.35)";ctx.lineWidth=1.2;ctx.beginPath();for(const a of A){ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-5,a.y+14)}ctx.stroke();return}
  for(const a of A){if(k==="snow"){ctx.fillStyle="rgba(255,255,255,.9)";ctx.beginPath();ctx.arc(a.x,a.y,1.2+a.r*2.2,0,7);ctx.fill()}
    else if(k==="volcano"){ctx.fillStyle=a.r<.5?"#ffb347":"#ff6a1f";ctx.globalAlpha=.5+.5*Math.sin(DF.t*5+a.p);ctx.fillRect(a.x,a.y,2+a.r*2,2+a.r*2)}
    else if(k==="cave"){ctx.fillStyle=a.r<.5?"#7ef9ff":"#ff7ae6";ctx.globalAlpha=.3+.6*Math.abs(Math.sin(DF.t*2+a.p));ctx.fillRect(a.x,a.y,2,2)}
    else if(k==="castle"){ctx.fillStyle="#ffb3c7";ctx.globalAlpha=.8;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(DF.t*2+a.p);ctx.fillRect(-3,-1.5,6,3);ctx.restore()}
    else{ctx.fillStyle=a.r<.5?"#ffe14d":"#ffffff";ctx.globalAlpha=.7;const w=Math.abs(Math.sin(DF.t*8+a.p))*4;ctx.beginPath();ctx.ellipse(a.x-2,a.y,w,3,0,0,7);ctx.ellipse(a.x+2,a.y,w,3,0,0,7);ctx.fill()}}
  ctx.globalAlpha=1}

/* the things on the course */
function dfDrawOb(ctx,o,sx,E,rt){const k=dfLK(),P=DF_PAL[k];
  if(o.t==="gap"){const gy=dfGy(o,rt),G=dfGap(o,E),gt=gy-G/2,gb=gy+G/2,S=dfPillar(k,o.sp);ctx.drawImage(S.b,sx-S.m,gb-6,S.W,S.H);ctx.drawImage(S.t,sx-S.m,gt+6-S.H,S.W,S.H);return}
  if(o.t==="gem"){if(o.got)return;const x=o.x+8-(DF.x-90)+0,y=o.y+Math.sin(DF.t*4+o.x)*3,s=7;ctx.save();ctx.translate(sx+8,y);dfGlow(ctx,0,0,16,"255,255,255",.35);ctx.fillStyle=P.gem;ctx.beginPath();ctx.moveTo(0,-s*1.3);ctx.lineTo(s,0);ctx.lineTo(0,s*1.3);ctx.lineTo(-s,0);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.7)";ctx.beginPath();ctx.moveTo(0,-s*1.3);ctx.lineTo(s*.4,-s*.2);ctx.lineTo(-s*.5,0);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=1;ctx.stroke();
    const tw=Math.max(0,Math.sin(DF.t*5+o.x*.1));if(tw>.8){ctx.fillStyle="#fff";ctx.fillRect(-1,-s*2.2,2,s*1.4*tw);ctx.fillRect(-s*.7*tw,-s*1.5,s*1.4*tw,2)}ctx.restore();return}
  if(o.t==="ring"){if(o.got)return;const cx=sx+18,cy=o.y;dfGlow(ctx,cx,cy,44,"255,215,80",.3);ctx.lineWidth=7;ctx.strokeStyle="#c98a0c";ctx.beginPath();ctx.ellipse(cx,cy,13,36,0,0,7);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle="#ffd23f";ctx.beginPath();ctx.ellipse(cx,cy,13,36,0,0,7);ctx.stroke();
    ctx.lineWidth=1.5;ctx.strokeStyle="#fff8c8";ctx.beginPath();ctx.ellipse(cx-2,cy,11,33,0,Math.PI*.6,Math.PI*1.4);ctx.stroke();const a=DF.t*3;ctx.fillStyle="#fff";ctx.fillRect(cx+Math.cos(a)*13-1.5,cy+Math.sin(a)*36-1.5,3,3);return}
  if(o.t==="wind"){ctx.save();ctx.fillStyle=o.f<0?"rgba(90,170,255,.13)":"rgba(120,110,255,.13)";ctx.fillRect(sx,-DFT,o.w,DFH+DFT+DFB);ctx.globalAlpha=.75;ctx.strokeStyle="#4f86d6";ctx.lineWidth=2.5;const up=o.f<0;for(let i=0;i<9;i++){const lx=sx+15+i*30,ph=((DF.t*(up?-1:1)*1.6+dfH(i,o.x))%1+1)%1,ly=-DFT+ph*(DFH+DFT+DFB);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+4,ly+(up?-26:26));ctx.stroke()}
    ctx.globalAlpha=1;ctx.font="900 30px system-ui,sans-serif";ctx.textAlign="center";ctx.lineWidth=5;ctx.strokeStyle="#1f3f7a";const ay=90+Math.sin(DF.t*4)*6;ctx.strokeText(up?"⬆":"⬇",sx+o.w/2,ay);ctx.fillStyle="#fff";ctx.fillText(up?"⬆":"⬇",sx+o.w/2,ay);ctx.font="900 11px system-ui,sans-serif";ctx.lineWidth=3;ctx.strokeText("WIND",sx+o.w/2,ay+18);ctx.fillText("WIND",sx+o.w/2,ay+18);ctx.restore();return}
  if(o.t==="ice"){if(o.gone)return;const cx=sx+11,near=o.fy==null&&o.x-DF.x<300&&o.x-DF.x>-60,sh=near?Math.sin(DF.t*45+o.x)*1.6:0,y0=o.fy==null?-DFT:o.fy,tip=o.fy==null?o.tip:o.fy+(o.tip+DFT);
    ctx.fillStyle=dfGrad(ctx,y0,tip,["#ffffff","#cdeaff","#8fd0ff"]);ctx.beginPath();ctx.moveTo(cx-11+sh,y0);ctx.lineTo(cx+11+sh,y0);ctx.lineTo(cx+sh,tip);ctx.fill();ctx.fillStyle="rgba(255,255,255,.8)";ctx.beginPath();ctx.moveTo(cx-6+sh,y0);ctx.lineTo(cx-1+sh,y0);ctx.lineTo(cx-1+sh,tip-(tip-y0)*.25);ctx.fill();
    if(o.fy==null){ctx.fillStyle="#eef7ff";ctx.fillRect(cx-18,-DFT,36,10);ctx.strokeStyle="rgba(120,170,220,.6)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+sh,tip);ctx.lineTo(cx+sh,tip+6);ctx.stroke()}return}
  if(o.t==="arc"){const ay=dfArcY(o,rt),cx=sx+15,fire=o.kind==="fire";
    /* warning: the ground glows and a "!" shows where it's about to come up */
    if(ay==null)return;
    /* how high it will go */ctx.save();ctx.setLineDash([4,6]);ctx.strokeStyle=fire?"rgba(255,180,80,.45)":"rgba(255,255,255,.4)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-16,o.top-18);ctx.lineTo(cx+16,o.top-18);ctx.stroke();ctx.restore();
    if(fire){for(let i=1;i<6;i++){ctx.globalAlpha=.5-i*.08;ctx.fillStyle=i<3?"#ffd04a":"#ff6a1f";ctx.beginPath();ctx.arc(cx+(Math.random()-.5)*4,ay+i*9,15-i*2,0,7);ctx.fill()}ctx.globalAlpha=1;dfGlow(ctx,cx,ay,40,"255,140,40",.5);const g=ctx.createRadialGradient(cx-4,ay-4,2,cx,ay,17);g.addColorStop(0,"#fff6c0");g.addColorStop(.5,"#ffb020");g.addColorStop(1,"#e8401f");ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,ay,17,0,7);ctx.fill()}
    else{ctx.fillStyle="rgba(0,0,0,.15)";ctx.beginPath();ctx.ellipse(cx,ay+20,12,4,0,0,7);ctx.fill();const g=ctx.createRadialGradient(cx-5,ay-6,2,cx,ay,17);g.addColorStop(0,"#d9d4cc");g.addColorStop(1,"#6f6a63");ctx.fillStyle=g;ctx.beginPath();for(let i=0;i<9;i++){const a=i/9*6.283+rt*3,r=15+dfH(i,o.x)*4;i?ctx.lineTo(cx+Math.cos(a)*r,ay+Math.sin(a)*r):ctx.moveTo(cx+Math.cos(a)*r,ay+Math.sin(a)*r)}ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.4)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,ay+20);ctx.lineTo(cx,ay+50);ctx.stroke()}return}
  if(o.t==="bats"){for(let b=0;b<3;b++){const by=o.y+Math.sin(rt*2*Math.PI/o.per+o.ph)*o.amp+(b===1?-14:0),bx=sx+b*22,w=Math.sin(DF.t*18+b)*.8;ctx.save();ctx.translate(bx,by);ctx.scale(1.3,1.3);dfGlow(ctx,0,0,18,"255,120,230",.25);ctx.fillStyle="#7a56c8";ctx.beginPath();ctx.ellipse(0,0,6,5,0,0,7);ctx.fill();
      for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*16,-6*w-2);ctx.lineTo(s*12,2);ctx.lineTo(s*7,-1);ctx.closePath();ctx.fill()}ctx.fillStyle="#fff04f";ctx.fillRect(-3,-2,2,2);ctx.fillRect(1,-2,2,2);ctx.restore()}return}
  if(o.t==="bolt"){const st=dfBoltSt(o,rt),cx=sx+12,y0=o.top?-DFT:DFH+DFB,y1=o.to;
    ctx.fillStyle="#2b315f";ctx.beginPath();if(o.top){for(const[dx,r]of[[-22,18],[0,24],[22,18]]){ctx.moveTo(cx+dx+r,-DFT+10);ctx.arc(cx+dx,-DFT+10,r,0,7)}}ctx.fill();
    if(st===1){ctx.save();ctx.setLineDash([6,6]);ctx.lineDashOffset=-DF.t*40;ctx.strokeStyle=Math.floor(DF.t*10)%2?"rgba(255,245,150,.9)":"rgba(255,255,255,.4)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,y0);ctx.lineTo(cx,y1);ctx.stroke();ctx.restore();dfGlow(ctx,cx,y1,24,"255,245,150",.4)}
    if(st===2){DF.flash=Math.max(DF.flash,.12);ctx.save();ctx.shadowColor="#fff59a";ctx.shadowBlur=14;ctx.strokeStyle="#fffbe0";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx,y0);const n=8;for(let i=1;i<=n;i++){const yy=y0+(y1-y0)*i/n;ctx.lineTo(cx+(i<n?(Math.random()-.5)*26:0),yy)}ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle="#ffe14d";ctx.stroke();ctx.restore();dfGlow(ctx,cx,y1,40,"255,245,150",.7)}return}}
/* warnings drawn in front of everything: a "!" where a stone or fireball is about to come up */
function dfWarn(ctx,cam,rt){for(const o of DF.ob){const sx=o.x-cam;if(sx>DFW+40)break;if(o.t!=="arc"||sx<-60)continue;if(dfArcY(o,rt)!=null)continue;const u=(((rt+o.ph)%o.per)+o.per)%o.per,left=o.per-u;if(left>1.1)continue;
  const w=Math.min(1,1.1-left),cx=sx+15,fire=o.kind==="fire";dfGlow(ctx,cx,DFH-34,26+w*34,fire?"255,170,60":"255,250,220",.4+w*.45);const yy=DFH-84-Math.abs(Math.sin(DF.t*10))*6;
  ctx.fillStyle=fire?"#ff6a1f":"#ffd23f";ctx.beginPath();ctx.arc(cx,yy,15,0,7);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="#fff";ctx.stroke();ctx.font="900 20px system-ui,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";ctx.fillText("!",cx,yy+1);ctx.textBaseline="alphabetic"}}
/* tunnel walls in the Crystal Caves: one smooth ceiling and floor through all the tunnel pieces on screen */
function dfDrawCave(ctx,cam,E,rt){const cs=DF.ob.filter(o=>o.t==="cave"&&o.x-cam>-80&&o.x-cam<DFW+80);if(!cs.length)return;
  const runs=[];let cur=[];for(const o of cs){if(cur.length&&o.x-cur[cur.length-1].x>41){runs.push(cur);cur=[]}cur.push(o)}runs.push(cur);
  for(const R of runs){const pts=R.map(o=>{const G=dfGap(o,E);return[o.x-cam+20,o.y-G/2,o.y+G/2]}),x0=pts[0][0]-20,x1=pts[pts.length-1][0]+20;
    const wall=(top)=>{ctx.beginPath();ctx.moveTo(x0,top?-DFT-5:DFH+DFB+5);ctx.lineTo(x0,top?pts[0][1]:pts[0][2]);for(const p of pts)ctx.lineTo(p[0],top?p[1]:p[2]);ctx.lineTo(x1,top?pts[pts.length-1][1]:pts[pts.length-1][2]);ctx.lineTo(x1,top?-DFT-5:DFH+DFB+5);ctx.closePath()};
    ctx.fillStyle=dfGrad(ctx,-DFT,DFH*.6,["#3b2a63","#6a4fa8","#8d6fd0"]);wall(1);ctx.fill();ctx.fillStyle=dfGrad(ctx,DFH*.4,DFH+DFB,["#8d6fd0","#6a4fa8","#3b2a63"]);wall(0);ctx.fill();
    ctx.save();ctx.shadowColor="#d9c2ff";ctx.shadowBlur=10;ctx.strokeStyle="#e2d2ff";ctx.lineWidth=3;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[2]):ctx.moveTo(p[0],p[2]));ctx.stroke();ctx.restore();
    for(const[i,p]of pts.entries()){const o=R[i];if(dfH(o.x,80)<.3){ctx.fillStyle="#7a5cc0";ctx.beginPath();ctx.moveTo(p[0]-8,p[1]-2);ctx.lineTo(p[0],p[1]+14+dfH(o.x,81)*12);ctx.lineTo(p[0]+8,p[1]-2);ctx.fill()}
      if(dfH(o.x,82)<.18)dfCrystal(ctx,p[0],p[2]+4,.55,dfH(o.x,83)<.5?"#7ef9ff":"#ff7ae6",dfH(o.x,83)<.5?"126,249,255":"255,122,230");if(dfH(o.x,84)<.12){ctx.save();ctx.translate(0,2*(p[1]-4));ctx.scale(1,-1);dfCrystal(ctx,p[0],p[1]-4,.5,"#b48cff","180,140,255");ctx.restore()}}}}
function dfGoal(ctx,sx){ // the golden castle at the finish
  const b=DFH-40;dfGlow(ctx,sx+110,b-130,230,"255,215,80",.45);ctx.fillStyle=dfGrad(ctx,b-140,b+20,["#ffe26a","#f2b81c"]);ctx.fillRect(sx+20,b-120,180,140);ctx.fillStyle="#e6a817";for(let i=0;i<7;i++)ctx.fillRect(sx+20+i*28,b-134,16,14);
  for(const[x,h]of[[sx,200],[sx+180,200],[sx+86,250]]){ctx.fillStyle=dfGrad(ctx,b-h,b+20,["#ffe580","#f5bf2a"]);ctx.fillRect(x,b-h,40,h+20);ctx.fillStyle="#3aa8ff";ctx.beginPath();ctx.moveTo(x-8,b-h);ctx.lineTo(x+20,b-h-50);ctx.lineTo(x+48,b-h);ctx.fill();ctx.fillStyle="rgba(255,255,255,.3)";ctx.beginPath();ctx.moveTo(x-8,b-h);ctx.lineTo(x+20,b-h-50);ctx.lineTo(x+20,b-h);ctx.fill();
    ctx.strokeStyle="#5b3a22";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+20,b-h-50);ctx.lineTo(x+20,b-h-74);ctx.stroke();ctx.fillStyle="#ff3d77";ctx.fillRect(x+20,b-h-74+Math.sin(DF.t*6)*1.5,18,11);ctx.fillStyle="#7a4a1e";ctx.fillRect(x+14,b-h+30,12,18)}
  ctx.fillStyle="#7a4a1e";ctx.beginPath();ctx.arc(sx+106,b-30,26,Math.PI,0);ctx.rect(sx+80,b-30,52,50);ctx.fill();
  for(let i=0;i<6;i++){const a=DF.t*2+i;ctx.fillStyle="#fff8c8";ctx.globalAlpha=.6+.4*Math.sin(a*3);ctx.fillRect(sx+110+Math.cos(a)*120,b-130+Math.sin(a*1.3)*90,3,3)}ctx.globalAlpha=1;
  // chequered finish line
  for(let y=-DFT-(DFT%16);y<DFH+DFB;y+=16)for(let k=0;k<2;k++){ctx.fillStyle=(y/16+k)%2?"#fff":"#14151a";ctx.globalAlpha=.75;ctx.fillRect(sx-60+k*8,y,8,16)}ctx.globalAlpha=1;
}
function dfDraw(c){
  const ctx=c.getContext("2d"),K=c._k||c.width/DFW,r=RA,n=Date.now(),E=dfEase(),X=90;ctx.setTransform(K,0,0,K,0,DFT*K);
  let cam=DF.x-X;if(DF.shake>0)ctx.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
  const C=dfCache(),cm=Math.max(0,cam),rt=dfRt(),S=C.strips;dfSky(ctx,cm);for(let i=0;i<S.length-1;i++)dfBlit(ctx,S[i],cm);
  if(DF_FIN-cam<DFW+260)dfGoal(ctx,DF_FIN-cam+60);
  if(DF.lv===3)dfDrawCave(ctx,cam,E,rt);
  for(const o of DF.ob){const sx=o.x-cam;if(sx>DFW+40)break;if(sx<-(o.w||DF_OW)-60||o.t==="cave")continue;dfDrawOb(ctx,o,sx,E,rt)}
  dfBlit(ctx,S[S.length-1],cm);dfWarn(ctx,cam,rt);
  // the other player's dragon (see-through)
  const live=r&&r.s===DF.s,oc=dfCol(ot()),gx=DFG.x-cam;
  if(live){if(gx>-60&&gx<DFW+60)dfDragon(ctx,oc,gx,DFG.y,0,DF.t+.3,(r.w&&r.w!==me())||DFG.fire>0,.6,0,DFG.fire>0?DFG.face:1,DFG.stun);
    else{ctx.fillStyle=oc==="red"?"#e8302b":"#1f8a4c";ctx.globalAlpha=.85;const ax=gx<0?14:DFW-14,ay=Math.max(60,Math.min(DFH-30,DFG.y));ctx.beginPath();if(gx<0){ctx.moveTo(ax-8,ay);ctx.lineTo(ax+6,ay-9);ctx.lineTo(ax+6,ay+9)}else{ctx.moveTo(ax+8,ay);ctx.lineTo(ax-6,ay-9);ctx.lineTo(ax-6,ay+9)}ctx.fill();
      ctx.font="bold 11px system-ui,sans-serif";ctx.textAlign=gx<0?"left":"right";ctx.fillText(dfNm(ot()),gx<0?ax+10:ax-10,ay+4);ctx.globalAlpha=1}}
  // me
  const blink=DF.inv>0&&Math.floor(DF.t*12)%2;dfDragon(ctx,dfCol(role),X,DF.y,DF.vy,DF.t,DF.boost>0||DF.won||DF.fire>0,blink&&DF.stun<=0?.35:1,DF.fl>0,DF.fire>0?DF.face:1,DF.stun);
  if(DF.boost>0&&Math.random()<.6)DF.fx.push({x:DF.x-50,y:DF.y+4,vx:-120-Math.random()*80,vy:(Math.random()-.5)*60,t:.35,c:Math.random()<.5?"#ffb020":"#ff5a1f"});
  for(const p of DF.fx){ctx.globalAlpha=Math.min(1,p.t*2);ctx.fillStyle=p.c;const z=p.fl?9:5;ctx.fillRect(p.x-cam-z/2,p.y-z/2,z,z)}ctx.globalAlpha=1;
  dfAmbient(ctx,Math.min(.05,DF.t-(DF.at||DF.t)));DF.at=DF.t;
  if(DF.flash>0){ctx.fillStyle=`rgba(230,235,255,${Math.min(.16,DF.flash*1.4)})`;ctx.fillRect(0,-DFT,DFW,DFH+DFT+DFB)}
  // progress bar: both dragons and the castle
  ctx.save();ctx.setTransform(K,0,0,K,0,0);const HY=DFSAFE+14,L0=60,L1=DFW-118;
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();if(ctx.roundRect)ctx.roundRect(L0-8,HY,L1-L0+40,26,13);else ctx.rect(L0-8,HY,L1-L0+40,26);ctx.fill();ctx.fillStyle="rgba(255,255,255,.5)";ctx.fillRect(L0+6,HY+12,L1-L0-12,3);
  ctx.fillStyle="#ffd23f";ctx.fillRect(L1+6,HY+6,16,12);ctx.fillRect(L1+3,HY+2,5,16);ctx.fillRect(L1+20,HY+2,5,16);
  const px=f=>L0+6+(L1-L0-12)*Math.max(0,Math.min(1,f));
  const dot=(f,col,lbl)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(px(f),HY+13,8,0,7);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 9px system-ui,sans-serif";ctx.textAlign="center";ctx.fillText(lbl,px(f),HY+16.5)};
  if(live)dot(DFG.x/DF_FIN,oc==="red"?"#e8302b":"#1f8a4c",dfNm(ot())[0]);dot(DF.x/DF_FIN,dfCol(role)==="red"?"#e8302b":"#1f8a4c",dfNm(role)[0]);ctx.restore();
  // messages
  ctx.textAlign="center";const big=(t,y,s,col)=>{ctx.font=`900 ${s}px system-ui,sans-serif`;ctx.lineWidth=6;ctx.strokeStyle="rgba(20,10,40,.75)";ctx.strokeText(t,DFW/2,y);ctx.fillStyle=col||"#fff";ctx.fillText(t,DFW/2,y)};
  if(DF.msg&&live&&!r.w){ctx.globalAlpha=Math.min(1,DF.msg.t*2);big(DF.msg.txt,170,24,DF.msg.c);ctx.globalAlpha=1}
  else if(DF.zt>0&&live&&!r.w){ctx.globalAlpha=Math.min(1,DF.zt);big(DF_LV[DF.lv].ic+" "+DF_LV[DF.lv].nm,120,26,"#ffd23f");ctx.globalAlpha=1}
  if(live&&r.s&&n<r.s){big(DF_LV[DF.lv].ic+" "+DF_LV[DF.lv].nm,110,24,"#fff")}
  if(live&&!r.w&&DF.gems){ctx.textAlign="left";ctx.font="900 15px system-ui,sans-serif";ctx.lineWidth=4;ctx.strokeStyle="rgba(20,10,40,.6)";const gt="💎 "+DF.gems;ctx.strokeText(gt,12,DFSAFE+60-DFT);ctx.fillStyle="#fff";ctx.fillText(gt,12,DFSAFE+60-DFT);ctx.textAlign="center"}
  if(live&&r.s&&n<r.s){const k=Math.ceil((r.s-n)/1000);big(String(k),DFH/2-40,90,"#ffd23f")}
  else if(live&&r.s&&n<r.s+700&&!r.w)big("GO!",DFH/2-40,80,"#2ef2c5");
  if(live&&r.w){ctx.fillStyle="rgba(20,10,40,.45)";ctx.fillRect(0,DFH/2-150,DFW,110);big(r.w===me()?"YOU WIN!":dfNm(ot()).toUpperCase()+" WINS!",DFH/2-96,40,r.w===me()?"#ffd23f":"#fff");big(r.w===me()?(gameOK()?"+2 coins":"Share 2 things today for coins"):"Better luck next time!",DFH/2-62,16,"#fff")}
}

window.addEventListener("keyup",e=>{if([" ","ArrowUp","w","W"].includes(e.key))dfRelease()});
window.addEventListener("keydown",e=>{if(g!=="race"||tab!=="play")return;if([" ","ArrowUp","w","W"].includes(e.key)){e.preventDefault();if(e.repeat)return;dfPress()}else if(["f","F","Enter"].includes(e.key)){e.preventDefault();dfFire()}});
