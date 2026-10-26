/* ===================== FROG FLING: the rules (no drawing here, so they can be tested) =====================
   s = metres forward from the launch trees, x = metres to the right, y = metres up. The frog is a ball of radius FF.R. */
const FF={g:7,drag:.0009,R:.5,vMin:13,vMax:40,elev:.45,yaw:.3,steer:11,steerA:5,lane:12.5,y0:3.7,chunk:40};
const FF_Z=[{k:"forest",n:"THE FOREST",s:0},{k:"road",n:"THE BUSY ROAD",s:172},{k:"village",n:"THE VILLAGE",s:214},{k:"town",n:"THE TOWN",s:440},{k:"city",n:"THE BIG CITY",s:700}];
const FF_MEDAL=[["bronze",250],["silver",600],["gold",1200]];
const ffZone=s=>{let i=0;for(let j=0;j<FF_Z.length;j++)if(s>=FF_Z[j].s)i=j;return i};
/* every kind of thing in the world: picture size (w,h), the solid parts (c: half-width r across, half-depth d along, from y0 to y1),
   k: obst (bump), bnc (bounce pad: always bounces), top (bounces if you land on top, bumps from the side), pick (collect), water/mud (on the ground) */
const FF_T={
  oak:{w:8,h:9.4,k:"obst",leaf:1,c:[{r:.7,d:.7,y1:4.2},{r:2.7,d:2.3,y0:3.9,y1:9}]},
  pine:{w:6,h:9.8,k:"obst",leaf:1,c:[{r:.6,d:.6,y1:2},{r:2.1,d:2,y0:1.8,y1:6},{r:1.1,d:1.1,y0:6,y1:9.6}]},
  bush:{w:3.4,h:3.2,k:"obst",soft:1,leaf:1,c:[{r:1.4,d:1.2,y1:2.8}]},
  berry:{w:3.4,h:3,k:"obst",soft:1,leaf:1,c:[{r:1.4,d:1.2,y1:2.7}]},
  mossrock:{w:3.8,h:2.6,k:"obst",c:[{r:1.6,d:1.3,y1:2.2}]},
  boulder:{w:4.4,h:4.6,k:"obst",c:[{r:1.9,d:1.8,y1:4.2}]},
  log:{w:4.8,h:3.6,k:"obst",c:[{r:2.1,d:.8,y1:1.7}]},
  shrooms:{w:5,h:4.6,k:"deco",flat:1},
  stream:{w:9,h:8,k:"water",flat:1,c:[{r:3.6,d:3,y1:0}]},
  hive:{w:2.4,h:2.9,k:"pick",fx:"bees",R:1.5,cy:1.1},
  mushroom:{w:4.2,h:4.8,k:"bnc",up:15.5,c:[{r:1.8,d:1.6,y1:4.3}]},
  car:{w:4.6,h:3.8,k:"top",up:11,c:[{r:2,d:1.1,y1:2.5}]},
  van:{w:5,h:4.6,k:"top",up:11,c:[{r:2.3,d:1.2,y1:3.4}]},
  lorry:{w:6.4,h:6,k:"top",up:12,c:[{r:3,d:1.3,y1:4.4}]},
  bus:{w:5.4,h:6.6,k:"top",up:13,c:[{r:2.5,d:1.3,y1:5.8}]},
  taxi:{w:4.8,h:4.1,k:"top",up:11,c:[{r:2.1,d:1.1,y1:2.6}]},
  taxi2:{w:4.8,h:3.9,k:"top",up:11,c:[{r:2.1,d:1.1,y1:2.6}]},
  cones:{w:2.6,h:2.5,k:"obst",soft:1,c:[{r:1,d:.8,y1:1.5}]},
  sign:{w:1.5,h:3.4,k:"obst",c:[{r:.5,d:.3,y1:3.2}]},
  lights:{w:1.5,h:4.4,k:"obst",c:[{r:.45,d:.3,y1:4.2}]},
  zebra:{w:8,h:3.6,k:"deco",flat:1},
  barrier:{w:4.2,h:3,k:"obst",c:[{r:1.9,d:.5,y1:1.8}]},
  cottage:{w:8.4,h:9.2,k:"obst",c:[{r:3.4,d:3,y1:7.6}]},
  well:{w:3.2,h:4.3,k:"obst",c:[{r:1.3,d:1.3,y1:3.9}]},
  fence:{w:4.6,h:3.3,k:"obst",c:[{r:2,d:.3,y1:2}]},
  hay:{w:4.2,h:3.4,k:"bnc",up:11,soft:1,c:[{r:1.8,d:1.4,y1:2.7}]},
  cow:{w:4,h:3.9,k:"obst",fx:"moo",c:[{r:1.6,d:1.2,y1:3.2}]},
  washing:{w:4.6,h:4.4,k:"obst",soft:1,c:[{r:2,d:.3,y0:1.8,y1:4}]},
  pond:{w:10,h:7,k:"water",flat:1,c:[{r:4,d:2.8,y1:0}]},
  phonebox:{w:1.8,h:3.6,k:"obst",c:[{r:.8,d:.8,y1:3.4}]},
  gate:{w:4.6,h:3.6,k:"obst",c:[{r:2,d:.4,y1:2.5}]},
  flowers:{w:3,h:3.1,k:"obst",soft:1,leaf:1,c:[{r:1.3,d:1.1,y1:1.8}]},
  tramp:{w:4.6,h:3.2,k:"bnc",up:17,c:[{r:2,d:1.7,y1:2}]},
  balloons:{w:2.8,h:3.4,k:"pick",fx:"float",R:1.8,cy:2.2},
  bakery:{w:8,h:10.6,k:"obst",c:[{r:3.5,d:3,y1:10}]},
  toyshop:{w:7.6,h:10.4,k:"obst",c:[{r:3.4,d:3,y1:10}]},
  cafe:{w:8.6,h:10,k:"obst",c:[{r:3.8,d:3,y1:9.4}]},
  stall:{w:4.8,h:4.7,k:"top",up:14,c:[{r:2.2,d:1.5,y1:4.3}]},
  bench:{w:3.4,h:2.8,k:"obst",c:[{r:1.5,d:.6,y1:1.4}]},
  fountain:{w:6.4,h:5,k:"obst",c:[{r:.8,d:.8,y1:4.4}],wet:[2.8,2.4]},
  lamp:{w:1.6,h:5.2,k:"obst",c:[{r:.35,d:.35,y1:5.1}]},
  busstop:{w:5.6,h:4.6,k:"top",up:12,c:[{r:2.6,d:.9,y1:3.8}]},
  church:{w:10,h:13.2,k:"obst",c:[{r:4.2,d:4,y1:12}]},
  postbox:{w:1.5,h:3.3,k:"obst",c:[{r:.6,d:.6,y1:3.1}]},
  awning:{w:4.6,h:4,k:"bnc",up:15,base:1.4,c:[{r:2,d:1.2,y0:1.4,y1:4.6}]},
  office:{w:14,h:24.7,k:"obst",c:[{r:6,d:5,y1:24}]},
  glass:{w:13,h:26.3,k:"obst",c:[{r:5.5,d:5,y1:26}]},
  crane:{w:16,h:19.6,k:"deco"},
  billboard:{w:8,h:9.9,k:"obst",c:[{r:3.6,d:.5,y0:4.3,y1:9.6},{r:.4,d:.4,y1:4.4}]},
  pigeons:{w:4,h:3.9,k:"obst",soft:1,fx:"coo",c:[{r:1.8,d:1,y0:.3,y1:3.6}]},
  tank:{w:4.8,h:5.6,k:"obst",c:[{r:2,d:2,y1:5.3}]},
  heli:{w:7.6,h:5.8,k:"obst",c:[{r:3.2,d:1.6,y0:.6,y1:4.6}]},
  tlight:{w:1.4,h:4.4,k:"obst",c:[{r:.4,d:.3,y1:4.3}]},
  foodtruck:{w:6.2,h:5.6,k:"top",up:12,c:[{r:2.7,d:1.3,y1:4.2}]},
  fly:{w:1.4,h:1.4,k:"pick",fx:"fly",R:1.4,cy:.7},
  gfly:{w:1.7,h:1.85,k:"pick",fx:"gfly",R:1.6,cy:.9},
  coin:{w:1.3,h:1.35,k:"pick",fx:"coin",R:1.3,cy:.7},
  hoop:{w:4,h:4.4,k:"pick",fx:"hoop",R:2,cy:2.2},
  wind:{w:3.2,h:3.7,k:"pick",fx:"wind",R:2.2,cy:1.8},
  mud:{w:6,h:4.8,k:"mud",flat:1,c:[{r:2.6,d:1.8,y1:0}]},
  rocket:{w:1.6,h:2,k:"pick",fx:"rocket",R:1.7,cy:1,model:1},bubble:{w:2.4,h:2.4,k:"pick",fx:"bubble",R:1.9,cy:1.2,model:1},bird:{w:3,h:2,k:"pick",fx:"bird",R:2,cy:1,model:1}};
/* upgrades bought in the shop: 5 levels each */
const FF_UP=[{k:"pow",n:"STRETCH",i:"💪",d:"Stretchier legs: flings go further"},{k:"tng",n:"TONGUE",i:"👅",d:"Longer tongue, more tongue shots, bigger whips"},
  {k:"bnc",n:"BOUNCE",i:"🍄",d:"Bouncier belly: higher bounces, better skips"},{k:"gld",n:"GLIDE CAPE",i:"🦸",d:"A cape: falls slower"},{k:"mag",n:"MAGNET",i:"🧲",d:"Pulls coins in, more power-ups"}];
const FF_COST=[20,45,90,150,240];
const ffU=(F,k)=>(F.up&&F.up[k])||0;
/* tongue shots come back as you go: one for every FF_RECH metres flown, and each coin fills a fifth of one */
const FF_RECH=110,FF_COINCH=.07,ffRech=F=>FF_RECH+.22*F.s;
const ffTongueR=F=>12+2.5*ffU(F,"tng")+(F.kid?2:0),ffShots=F=>3+ffU(F,"tng");
/* flies (and power-ups) hover about in the air */
function ffPos(o,T){const x=o.mv?ffMx(o,T):o.x;if(!o.hov)return{x,y:o.y,s:o.s};const ph=o.ph||0;
  return{x:x+Math.sin(T*1.3+ph)*1.3,y:o.y+Math.sin(T*2.3+ph*1.7)*.7,s:o.s+Math.cos(T*1.1+ph)*.9}}
function ffRng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* the road: 6 lanes of traffic crossing in front of the frog (3 going left, 3 going right) */
const FF_LANES=[[181.5,-1],[185.5,-1],[189.5,-1],[195,1],[199,1],[203,1]],FF_ROAD=[179,205.5];
/* city crossings every 170m: 2 lanes of taxis */
const ffCityCross=s=>{const k=Math.round((s-FF_Z[4].s-90)/170);return k>=0?FF_Z[4].s+90+k*170:-1e9};
/* make the things in one 40m stretch of the journey (k = which stretch). kid: Cass gets fewer things in the way and more springs */
function ffGen(seed,k,kid,mag){mag=mag||0;const R=ffRng(seed*7919+k*104729+13),o=[],s0=k*FF.chunk,s1=s0+FF.chunk,pick=a=>a[Math.floor(R()*a.length)];
  const add=(t,x,s,e)=>{o.push(Object.assign({t,x,s,y:FF_T[t].base||0},e||{}))};
  const busy=[];const free=(x,s,w)=>busy.every(b=>Math.abs(b[0]-x)>w+b[2]||Math.abs(b[1]-s)>4.5);
  const place=(t,n,yr)=>{for(let i=0;i<n;i++)for(let a=0;a<12;a++){const x=(R()*2-1)*(FF.lane-1.5),s=s0+R()*FF.chunk;if(s<14||s>=s1)continue;
    const z=FF_Z[ffZone(s)].k;if(z==="road"&&s>FF_ROAD[0]-3&&s<FF_ROAD[1]+3)continue;const w=(FF_T[t].c?FF_T[t].c[0].r:1)+1.2;
    if(free(x,s,w)){busy.push([x,s,w]);add(t,x,s,yr?{y:yr[0]+R()*(yr[1]-yr[0])}:null);break}}};
  const sides=(ts,n,x0,x1,gap)=>{for(const side of [-1,1]){let s=s0+R()*gap;for(let i=0;i<n&&s<s1;i++){if(s>=6)add(pick(ts),side*(x0+R()*(x1-x0)),s,{side:1});s+=gap*(.7+R()*.6)}}};
  const zi=ffZone(s0+20),z=FF_Z[zi].k,few=kid?.8:1;
  /* boosts everywhere: flies in little lines, coins in arcs, the odd golden fly / wind / leaf hoop */
  const lines=n=>{for(let i=0;i<n;i++){const s=s0+R()*(FF.chunk-8),x=(R()*2-1)*8,y=2+R()*7,m=5;
    for(let j=0;j<m;j++)if(s+j*2.4>=14)add("coin",x+(R()-.5)*.6,s+j*2.4,{y:Math.max(.6,y+Math.sin(j/(m-1)*Math.PI)*1.6)})}
    /* buzzing flies to tap: spread out ahead, low and high */
    const nf=(z==="forest"?4:3)+(R()<.5?1:0);for(let i=0;i<nf;i++){const s=s0+(i+R())*FF.chunk/nf;if(s<16)continue;add("fly",(R()*2-1)*10,s,{y:2.5+R()*10,hov:1,ph:R()*6.3})}
    {const gs=s0+R()*FF.chunk;if(R()<.22&&gs>=16)add("gfly",(R()*2-1)*9,gs,{y:5+R()*9,hov:1,ph:R()*6.3})}
    if(s0>=60&&R()<(.13+(kid?.04:0))*(1+.2*mag)){const pu=pick(["rocket","bubble","bird"]);add(pu,(R()*2-1)*8,s0+R()*FF.chunk,{y:3+R()*7,hov:1,ph:R()*6.3})}};
  if(z==="forest"){sides(["oak","pine","pine","oak","bush"],12,13,34,4.2);place("oak",Math.round(1.6*few));place("pine",Math.round(1.2*few));
    place(pick(["bush","berry","mossrock","boulder","log"]),Math.round(2*few));if(R()<.5)place("log",1);if(R()<.35)place("stream",1);if(R()<.35)place("shrooms",1);
    place("mushroom",1+(R()<(kid?.6:.4)?1:0));if(R()<.25)place("hive",1,[4.5,7]);lines(2)}
  else if(z==="road"){/* verges, then the road (traffic is made separately) */
    if(s0<FF_ROAD[0]){sides(["oak","pine","bush"],6,13,30,5);for(const x of [-9,-3.5,4,10])if(R()<.6)add(pick(["cones","sign","barrier","lights"]),x+(R()-.5)*2,FF_ROAD[0]-2.5);
      add("mushroom",(R()-.5)*14,FF_ROAD[0]-9);lines(1)}
    if(s1>FF_ROAD[1]){for(const x of [-8,-2,5,11])if(R()<.6)add(pick(["cones","sign","lights"]),x+(R()-.5)*2,FF_ROAD[1]+2.5);add("zebra",0,FF_ROAD[0]+13.2,{flat:1,big:1})}}
  else if(z==="village"){sides(["cottage","cottage","oak","hay","fence","cow"],4,14,28,9);
    place(pick(["fence","well","cow","gate","phonebox","flowers","washing"]),Math.round(2.2*few));place(pick(["cow","hay","flowers","fence"]),1);
    place("tramp",1+(R()<(kid?.7:.5)?1:0));if(R()<.4)place("hay",1);if(R()<.3)place("pond",1);if(R()<.4)place("balloons",1,[3,8]);if(R()<.15)place("mud",1);lines(2)}
  else if(z==="town"){sides(["bakery","toyshop","cafe"],6,15.5,17,8.5);if(k%3===0)add("church",(R()<.5?-1:1)*21,s0+20,{side:1});
    place(pick(["stall","bench","fountain","lamp","busstop","postbox","lamp"]),Math.round(2.4*few));place(pick(["bench","postbox","lamp"]),1);
    place("awning",1+(R()<(kid?.7:.5)?1:0));if(R()<.3)place("stall",1);if(R()<.4)place("balloons",1,[3,8]);lines(2)}
  else{sides(["office","glass"],4,19,22,13);if(R()<.4)add("crane",(R()<.5?-1:1)*34,s0+R()*40,{side:1});
    place(pick(["tank","billboard","tlight","tank","tlight"]),Math.round(2*few));place("foodtruck",1);place("awning",R()<.6?1:0);
    if(R()<.5)place("balloons",1,[4,10]);if(R()<.45)add("pigeons",(R()-.5)*30,s0+10+R()*20,{y:4+R()*5,mv:1,dir:R()<.5?-1:1,v:5+R()*3});
    if(R()<.3)add("heli",(R()-.5)*40,s0+10+R()*20,{y:11+R()*6,mv:1,dir:R()<.5?-1:1,v:3+R()*2});lines(2)}
  if(R()<.28)place("hoop",1,[2.5,7]);if(R()<.2)place("wind",1,[1.5,6]);
  /* traffic on the busy road, and on city crossings */
  const traffic=(sl,dir,types,n)=>{let x=R()*25;for(let i=0;i<n;i++){add(pick(types),0,sl,{mv:1,x0:x,dir,v:9+R()*5,road:1});x+=24+R()*14}};
  for(const [sl,dir] of FF_LANES)if(sl>=s0&&sl<s1)traffic(sl,dir,["car","van","lorry","bus","taxi","car","taxi"],4);
  if(z==="city"){const c=ffCityCross(s0+20);if(c>=s0&&c<s1-8)for(const [d,dir] of [[0,-1],[5,1]])traffic(c+d,dir,["taxi2","car","van","bus"],3)}
  /* moving things wrap round a 140m loop across the world */
  o.forEach((t,i)=>{t.id=k*1000+i;if(t.mv&&t.x0==null)t.x0=t.x});
  return o}
const FF_LOOP=140;
const ffMx=(t,T)=>{let x=t.x0+t.dir*t.v*T;x=((x+FF_LOOP/2)%FF_LOOP+FF_LOOP)%FF_LOOP-FF_LOOP/2;return x};
/* a new fling */
function ffNew(seed,kid,up){return{seed,kid:!!kid,up:up||{},shots:3+((up&&up.tng)||0),charge:0,combo:0,bestCombo:0,grab:null,rocket:0,bubble:0,bird:0,path:[],pathT:0,whips:0,perfect:0,t:0,s:0,x:0,y:FF.y0,vs:0,vx:0,vy:0,mode:"hang",steer:0,float:0,wind:0,spin:0,coins:0,flies:0,bumps:0,boings:0,ev:[],chunks:{},hit:{},end:null,maxY:0,air:0}}
function ffObjs(F,s){const k=Math.floor(s/FF.chunk);if(k<0)return [];if(!F.chunks[k])F.chunks[k]=ffGen(F.seed,k,F.kid,ffU(F,"mag"));return F.chunks[k]}
function ffLaunch(F,p,aim,perfect){const v=(FF.vMin+(FF.vMax*(1+.07*ffU(F,"pow"))-FF.vMin)*p)*(F.kid?1.05:1)*(perfect?1.15:1),h=v*Math.cos(FF.elev),yw=aim*FF.yaw;
  F.vs=h*Math.cos(yw);F.vx=h*Math.sin(yw);F.vy=v*Math.sin(FF.elev);F.mode="fly";F.power=p;F.perfect=perfect?1:0;F.ev.push({e:"launch",p,perfect})}
/* combos: every bounce, catch or power-up before touching the ground adds one */
function ffCombo(F){F.combo++;F.bestCombo=Math.max(F.bestCombo,F.combo);if(F.combo>=2)F.vs+=.3*Math.min(F.combo,8);F.ev.push({e:"combo",n:F.combo})}
function ffComboEnd(F){if(F.combo>=2)F.ev.push({e:"comboEnd",n:F.combo});F.combo=0}
const ffCoinX=F=>Math.min(5,1+Math.floor(F.combo/3));
function ffCharge(F,a){if(F.shots>=ffShots(F)){F.charge=0;return}F.charge+=a;while(F.charge>=1&&F.shots<ffShots(F)){F.charge-=1;F.shots++;F.ev.push({e:"recharge"})}if(F.shots>=ffShots(F))F.charge=0}
/* tap a fly (or a power-up): the tongue grabs it and whips the frog towards it */
function ffCanTongue(F,o){if(!o||o.got||F.grab||F.bird>0||F.shots<=0||(F.mode!=="fly"&&F.mode!=="slide"))return false;const T=FF_T[o.t];if(T.k!=="pick")return false;
  const p=ffPos(o,F.t),d=Math.hypot(p.x-F.x,p.s-F.s,p.y+T.cy-F.y);return d<=ffTongueR(F)&&p.s>F.s-2}
function ffTongue(F,o){if(!ffCanTongue(F,o))return false;F.shots--;F.grab={o,t:0};F.ev.push({e:"tongue",o});return true}
function ffGet(F,o,via){const T=FF_T[o.t],f=T.fx,p=ffPos(o,F.t);o.got=1;const kid=F.kid;
  if(f==="fly"||f==="gfly"){F.flies++;if(via==="tongue"){const g=f==="gfly";F.vs=Math.max(F.vs,16)+(g?10:3.5)+.6*ffU(F,"tng");F.vy=Math.max(F.vy,0)*.2+(g?11:7);F.whips++}
    else{F.vs+=f==="gfly"?11:4;F.vy=Math.max(F.vy,f==="gfly"?8:F.vy+1.5)}if(f==="gfly")F.shots=Math.min(ffShots(F),F.shots+1)}
  else if(f==="coin"){F.coins+=ffCoinX(F);ffCharge(F,FF_COINCH)}
  else if(f==="hoop"){F.vs+=7;F.vy=Math.max(F.vy,6);F.coins+=3*ffCoinX(F)}else if(f==="wind")F.wind=1.8;else if(f==="float"){F.float=2.4;F.vy=Math.max(F.vy,7)}
  else if(f==="bees"){F.vs+=9;F.vy=Math.max(F.vy,4)}
  else if(f==="rocket"){F.rocket=2.6;F.bubble=0}else if(f==="bubble"){F.bubble=4.5;F.vy=Math.max(F.vy,4)}else if(f==="bird"){F.bird=3.2;F.rocket=0}
  if(F.mode==="slide"&&f!=="coin"){F.mode="fly";F.inMud=0;F.vy=Math.max(F.vy,6)}
  if(f!=="coin")ffCombo(F);
  F.ev.push({e:"pick",fx:f,o,x:p.x,s:p.s,y:p.y+T.cy,via})}
/* where the ground is wet or muddy */
function ffGround(F,x,s){for(const k of [Math.floor(s/FF.chunk)-1,Math.floor(s/FF.chunk)])for(const o of ffObjs(F,k*FF.chunk)){const T=FF_T[o.t];
  if((T.k==="water"||T.k==="mud")&&Math.abs(x-o.x)<T.c[0].r&&Math.abs(s-o.s)<T.c[0].d)return T.k;
  if(T.wet&&Math.abs(x-o.x)<T.wet[0]&&Math.abs(s-o.s)<T.wet[1])return "water"}
  if(s>FF_ROAD[0]&&s<FF_ROAD[1])return "road";return "ground"}
/* one step of the flight. steer: -1..1 from the finger */
function ffStep(F,dt,steer){if(F.mode==="hang"||F.mode==="done")return;F.t+=dt;const R=FF.R*(F.kid?1:1),kid=F.kid;
  F.vx+=((steer||0)*FF.steer-F.vx)*Math.min(1,dt*FF.steerA);
  const sp=Math.hypot(F.vs,F.vy);F.vs-=FF.drag*F.vs*sp*dt;if(F.wind>0){F.wind-=dt;F.vs+=10*dt}
  let py=F.y;
  if(F.grab){/* zip along the tongue */const G=F.grab,o=G.o,T=FF_T[o.t],p=ffPos(o,F.t),tx=p.x,ty=p.y+T.cy,ts=p.s;G.t+=dt;
    const dx=tx-F.x,dy=ty-F.y,ds=ts-F.s,d=Math.hypot(dx,dy,ds),z=Math.max(30,sp*1.15);
    if(o.got||G.t>.7){F.grab=null}
    else if(d<=z*dt+1){F.x=tx;F.y=Math.max(FF.R,ty);F.s=ts;F.grab=null;F.mode="fly";F.inMud=0;F.vx=0;ffGet(F,o,"tongue");F.ev.push({e:"whip",o,gold:o.t==="gfly"})}
    else{F.vs=Math.max(F.vs,z*ds/d);F.x+=dx/d*z*dt;F.y+=dy/d*z*dt;F.s+=Math.max(0,ds/d*z*dt);F.mode="fly";F.inMud=0;F.vy=dy/d*z*.3}
    if(F.grab||F.mode==="fly"){F.spin=0}
    }
  if(!F.grab){
  if(F.bird>0){F.bird-=dt;F.vs+=(Math.max(F.vs,28)-F.vs)*Math.min(1,dt*2);F.vy=(11-F.y)*1.5;if(F.bird<=0){F.vy=4;F.ev.push({e:"birdDrop"})}F.mode="fly"}
  else if(F.rocket>0){F.rocket-=dt;F.vs+=16*dt;F.vy+=(4-F.vy)*Math.min(1,dt*3);F.mode="fly"}
  else if(F.mode==="fly"){const gl=F.vy<0?1-.08*ffU(F,"gld"):1;F.vy-=FF.g*(F.float>0?.3:F.bubble>0?.15:gl)*dt;if(F.float>0)F.float-=dt}
  if(F.bubble>0){F.bubble-=dt;if(F.bubble<=0)F.ev.push({e:"pop"})}
  py=F.y;F.s+=F.vs*dt;F.x+=F.vx*dt;F.y+=F.vy*dt}
  F.spin=Math.max(0,F.spin-dt);if(F.mode==="fly"||F.mode==="slide")ffCharge(F,Math.max(0,F.vs)*dt/ffRech(F));
  F.pathT+=dt;if(F.pathT>=.1){F.pathT-=.1;if(F.path.length<3600)F.path.push(Math.round(F.s*10),Math.round(F.x*10),Math.round(F.y*10))}
  if(Math.abs(F.x)>FF.lane){F.x=Math.sign(F.x)*FF.lane;F.vx=0}
  F.maxY=Math.max(F.maxY,F.y);
  /* bump into, bounce off and collect things */
  for(const k of [Math.floor(F.s/FF.chunk)-1,Math.floor(F.s/FF.chunk),Math.floor(F.s/FF.chunk)+1])for(const o of ffObjs(F,k*FF.chunk)){
    if(Math.abs(o.s-F.s)>11||o.got||o.side)continue;const T=FF_T[o.t],P=ffPos(o,F.t),ox=P.x;if(Math.abs(ox-F.x)>11)continue;
    if(T.k==="pick"){if(F.grab&&F.grab.o===o)continue;const dx=ox-F.x,ds=P.s-F.s,dy=(P.y+T.cy)-F.y,rr=(T.R+R)*(kid?1.25:1)+(T.fx==="coin"?.4*ffU(F,"mag"):0);
      if(dx*dx+ds*ds+dy*dy<rr*rr)ffGet(F,o,"touch");continue}
    if(F.bird>0)continue;
    if(!T.c||T.k==="water"||T.k==="mud"||T.k==="deco")continue;
    if(F.hit[o.id]>F.t-.35)continue;
    for(const c of T.c){const y0=o.y+(c.y0||0),y1=o.y+c.y1;
      if(Math.abs(F.x-ox)<c.r+R&&Math.abs(F.s-o.s)<c.d+R&&F.y>y0-R&&F.y<y1+R){F.hit[o.id]=F.t;
        const fromTop=py-R>=y1-.6&&F.vy<=1;
        if(T.k==="bnc"||(T.k==="top"&&fromTop)){F.vy=T.up*(kid?1.04:1)*(1+.05*ffU(F,"bnc"));F.vs=Math.max(F.vs*1.02+1.5,10);F.y=y1+R+.05;F.mode="fly";F.boings++;F.ev.push({e:"boing",o,x:ox,s:o.s,y:y1,t:o.t});ffCombo(F)}
        else if(F.bubble>0){F.vs*=.95;F.vx=(F.x>=ox?1:-1)*6;F.vy=Math.max(F.vy,5);if(F.s<o.s)F.s=Math.min(F.s,o.s-c.d-R-.05);F.ev.push({e:"bbump",o,x:ox,s:o.s,y:F.y,t:o.t})}
        else{if(!T.soft)ffComboEnd(F);F.rocket=0;const keep=T.soft?(kid?.8:.75):(kid?.52:.46);F.vs*=keep;F.vx=(F.x>=ox?1:-1)*7.5;F.vy=Math.max(F.vy*.3,F.mode==="slide"?3:4.5);if(F.mode==="slide")F.mode="fly";
          if(F.s<o.s)F.s=Math.min(F.s,o.s-c.d-R-.05);F.spin=T.soft?.4:.9;F.bumps++;if(F.mode==="slide"&&F.vs<2)F.vs=0;
          F.ev.push({e:"bump",o,x:ox,s:o.s,y:F.y,t:o.t,soft:!!T.soft})}
        break}}}
  /* the ground: skip like a stone, splash, stick in mud, or slide to a stop */
  if(F.y<=R){const g=ffGround(F,F.x,F.s);F.y=R;
    if(F.mode==="fly"&&F.bubble>0){F.vy=Math.max(-F.vy*.8,7);F.ev.push({e:"bbump"})}
    else if(F.mode==="fly"){F.air=0;ffComboEnd(F);
      if(g==="water"){if(F.vs>9){F.vy=Math.max(-F.vy*.6,5.5);F.vs*=.88;F.ev.push({e:"splash"})}else{F.vy=0;F.vs=0;F.mode="done";F.end="splash";F.ev.push({e:"splash",end:1})}}
      else if(g==="mud"){F.vs*=.25;F.vy=0;F.mode="slide";F.inMud=1;F.ev.push({e:"mud"})}
      else if(-F.vy>4.2){F.vy=-F.vy*(.42+.03*ffU(F,"bnc"));F.vs*=.8+.025*ffU(F,"bnc");F.ev.push({e:"skip",g})}
      else{F.vy=0;F.mode="slide";F.ev.push({e:"land",g})}}
    else if(F.mode==="slide"){F.vy=0;if(g==="water"&&F.vs<9){F.vs=0;F.mode="done";F.end="splash";F.ev.push({e:"splash",end:1})}
      if(g==="mud")F.inMud=1}}
  if(F.mode==="slide"){F.vs-=(F.inMud?30:13)*dt;F.vx*=Math.max(0,1-dt*3);if(F.vs<=.3){F.vs=0;F.mode="done";F.end=F.end||(F.inMud?"mud":"stop");F.ev.push({e:"stop"})}}
  if(F.mode==="fly"&&F.y>R+.01)F.air+=dt;
  F.d=Math.max(0,Math.round(F.s))}
const ffMedal=d=>{let m=null;for(const [n,v] of FF_MEDAL)if(d>=v)m=n;return m};
if(typeof module!=="undefined")module.exports={FF_RECH,ffCharge,FF_UP,FF_COST,ffU,ffTongueR,ffShots,ffPos,ffCombo,ffCanTongue,ffTongue,ffGet,FF,FF_Z,FF_T,FF_MEDAL,FF_LANES,FF_ROAD,ffZone,ffRng,ffGen,ffMx,ffNew,ffObjs,ffLaunch,ffGround,ffStep,ffMedal,ffCityCross};
