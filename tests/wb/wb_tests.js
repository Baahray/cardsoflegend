/* Boom Town rule & physics checks: node wb/wb_tests.js */
global.CANNON=require("cannon");Object.assign(global,require("./wb_town.js"));const C=CANNON;const Z=require("./wb_core.js");const {aimAt}=require("./smart.js");const {play}=require("./smart2.js");
let pass=0,fail=0;const T=(name,ok,info)=>{if(ok)pass++;else fail++;console.log((ok?"  ok  ":"  FAIL ")+name+(info!=null?"  ("+info+")":""))};
const run=(G,secs)=>{for(let i=0;i<secs*60;i++)Z.wbStep(G,Z.WB.step)};
const shot=(G,p,yaw,a)=>{Z.wbFire(G,p,yaw,a);let n=0;while(!Z.wbSettled(G)&&n<600){Z.wbStep(G,Z.WB.step);n++}};
const fresh=k=>{const L=Z.WB_LEVELS.find(l=>l.k===k);const G=Z.wbWorld(C,Z.wbHouse(k),{boss:L&&L.boss,easy:L&&L.easy});Z.wbSettle(G);return G};

/* every house stands up by itself */
for(const L of Z.WB_LEVELS.filter(L=>!L.town)){const G=fresh(L.k);run(G,4);T(L.name+" stands up on its own",G.down<.1,Math.round(G.down*100)+"% down")}
/* there are eight houses, the last is the boss */
const towns=Z.WB_LEVELS.filter(L=>L.town);T("Houses to smash, plus whole villages, towns and cities",Z.WB_LEVELS.length-towns.length>=14&&towns.length>=9&&["village","market","city","mega"].every(k=>towns.some(L=>L.k===k)));
for(const L of towns){const G=Z.wbWorld(C,Z.wbHouse(L.k));Z.wbSettle(G);Z.wbCount(G);const xs=G.blocks.map(b=>b.position.x),zs=G.blocks.map(b=>b.position.z);
  T(L.name+" has lots of buildings, spread out",G.bTot>=6&&Math.max(...xs)-Math.min(...xs)>14&&Math.max(...zs)-Math.min(...zs)>14,G.bTot+" buildings, "+G.blocks.length+" blocks");
  for(const b of G.blocks)b.wakeUp();run(G,4);Z.wbCount(G);T(L.name+" stands up on its own (even shaken awake)",G.bDown===0&&G.down<.05,G.bDown+" down")}
for(const k of ["farm","village"]){const r=play(k,"ball",40);T("A sensible player flattens "+k+" (every building)",r.flat,r.s+" shots")}
{const G=Z.wbWorld(C,Z.wbHouse("mega"));Z.wbSettle(G);let t=Date.now();for(let i=0;i<60;i++)Z.wbStep(G,Z.WB.step);const ms=(Date.now()-t)/60;T("Even Mega City is quick to run when nothing's moving",ms<8,ms.toFixed(1)+" ms a step")}
/* the straw house: one good shot and it's gone */
{let n=0;for(let p=.2;p<=.8;p+=.06){const G=fresh("straw");shot(G,p,0,"ball");if(Z.wbFlat(G))n++}T("Straw house goes in one shot at lots of powers",n>=3,n)}
/* a sensible player gets every house flat; the mansion takes many shots */
{const res={};for(const L of Z.WB_LEVELS)if(!L.town)res[L.k]=play(L.k,"ball",L.boss?30:20);
  T("A sensible player flattens every house and place",Object.values(res).every(r=>r.flat),Object.entries(res).map(([k,r])=>k+":"+r.s).join(" "));
  T("The mansion takes more shots than the straw house",res.boss.s>=2&&res.boss.s>res.straw.s,res.boss.s);
  T("The brick house is harder than the straw house",res.brick.s>=res.straw.s);
  T("Knocked-down blocks drop coins",Object.values(res).every(r=>r.coins>0))}
/* gingerbread crumbles into cookie bits */
{const G=fresh("ginger");let br=0;for(const p of [.45,.55,.5]){shot(G,p,0,"ball");br+=G.blocks.filter(b=>b.wb.crumb).length}T("Gingerbread crumbles into bits",br>0,br)}
/* ice breaks and is slippery */
{const G=fresh("igloo");for(const p of [.45,.5]){shot(G,p,0,"bowl")}T("Igloo shatters",G.blocks.some(b=>b.wb.crumb))}
/* the sandcastle collapses into a pile */
{const G=fresh("sand");for(const p of [.45,.5,.4])shot(G,p,0,"ball");T("Sandcastle crumbles",G.blocks.some(b=>b.wb.crumb)&&G.down>.15,Math.round(G.down*100))}
/* the jelly house bounces your ball back */
{const G=fresh("jelly");const b=Z.wbFire(G,.3,0,"ball");let back=0;for(let i=0;i<180;i++){Z.wbStep(G,Z.WB.step);if(b.velocity.z<-1)back=1}T("Jelly bounces a soft shot back",back)}
/* the watermelon splats */
{const G=fresh("brick");const b=Z.wbFire(G,.45,0,"melon");let sp=0;for(let i=0;i<200;i++){Z.wbStep(G,Z.WB.step);if(G.ev.some(e=>e.k==="splat"))sp=1}T("Watermelon splats",sp&&b.wbGone)}
/* the marshmallow sticks */
{const G=fresh("brick");const b=Z.wbFire(G,.45,0,"mallow");for(let i=0;i<200;i++)Z.wbStep(G,Z.WB.step);T("Marshmallow sticks to the wall",b.wbBall.stuck===1)}
/* the bouncy ball ricochets */
{const G=fresh("brick");const b=Z.wbFire(G,.45,0,"bouncy");let bounces=0,vz=1;for(let i=0;i<300;i++){Z.wbStep(G,Z.WB.step);if(Math.sign(b.velocity.z)!==vz&&Math.abs(b.velocity.z)>1){bounces++;vz=Math.sign(b.velocity.z)}}T("Bouncy ball ricochets",bounces>=1,bounces)}
/* the rubber chicken flops (it's two shapes and spins) */
{const G=fresh("straw");const b=Z.wbFire(G,.4,0,"chicken");T("Rubber chicken is a floppy two-part body",b.shapes.length===2&&b.angularVelocity.length()>1)}
/* the mega ball is huge, slow and unstoppable */
{const m=Z.WB_AMMO.find(a=>a.k==="mega"),c=Z.WB_AMMO[0];T("Mega ball: huge, heavy, slower",m.r>3*c.r&&m.mass>10*c.mass&&m.vk<c.vk&&m.cost>0);
  let best=0;for(const y of [1,1.6,2.2]){const G=fresh("brick");Z.wbFireAt(G,0,y,20,"mega");let n=0;while(!Z.wbSettled(G)&&n<600){Z.wbStep(G,Z.WB.step);n++}best=Math.max(best,G.down)}T("Mega ball smashes most of the brick house in one",best>.8,Math.round(best*100))}
/* the treehouse: the tree has to come down */
{const G=fresh("tree");const trunk=G.blocks.filter(b=>b.wb.mat==="trunk");T("Treehouse sits on a tree trunk",trunk.length>=4&&G.blocks.some(b=>b.wb.mat==="wood"&&b.position.y>5))}
/* stars */
T("3 stars at par, 2 a bit over, 1 after that",Z.wbStars(1,2)===3&&Z.wbStars(1,4)===2&&Z.wbStars(1,5)===1&&Z.wbStars(0,1)===3);
/* build mode */
T("Blocks go on the ground, on top, or against the side of a block",Z.wbCanPlace([],3,0,3)&&!Z.wbCanPlace([],3,1,3)&&Z.wbCanPlace([["brick",3,0,3]],3,1,3)&&!Z.wbCanPlace([["brick",3,0,3]],3,0,3)&&!Z.wbCanPlace([],13,0,0)&&Z.wbCanPlace([["brick",3,2,3]],4,2,3)&&!Z.wbCanPlace([["brick",3,2,3]],5,2,3));
T("Lots of kinds of block, and as many as you like",Object.keys(Z.WB_BUILD.price).length>=15&&Z.WB_BUILD.max>=1000&&Z.WB_BUILD.size>=13);
{const c=[];for(let y=0;y<5;y++)c.push(["brick",4,y,4]);for(let x=1;x<=7;x++)if(x!==4)c.push(["brick",x,4,4]);const G=Z.wbWorld(C,Z.wbFromBuild(c));Z.wbSettle(G);run(G,4);T("Blocks sticking out sideways stay up",G.down<.05&&G.mortar.length>0);
  const r=play("x","ball",10,Z.wbFromBuild(c),{});T("...until you knock them down",r.flat,r.s+" shots")}
{const G=fresh("brick");Z.wbFireAt(G,0,1,Z.WB.dist-2.4,"ball");let hit=null;for(let i=0;i<120&&!hit;i++){Z.wbStep(G,Z.WB.step);if(G.ball.wbBall.hit)hit=G.ball.position.clone()}T("The cannon hits where you aim",hit&&Math.abs(hit.x)<.6&&Math.abs(hit.y-1)<.8,hit&&hit.toString())}
{const s=Z.wbShotAt(0,1,22,"ball");T("Shots are fast and fairly flat",Math.hypot(s.vx,s.vy,s.vz)>=28&&s.pitch<.35,s.pitch.toFixed(2))}
{const A=fresh("brick"),B=fresh("brick");Z.wbFireAt(A,0,1,20,"ball");for(let i=0;i<200;i++)Z.wbStep(A,Z.WB.step);const sn=Z.wbSnap(A);Z.wbApplySnap(B,sn);T("A house can be copied to the other phone",Math.abs(A.down-B.down)<.02&&sn.length<20000,Math.round(A.down*100)+"% vs "+Math.round(B.down*100)+"%, "+sn.length+" chars")}
T("Build cost adds up the prices",Z.wbBuildCost([["straw",0,0,0],["gold",1,0,0],["brick",2,0,0]])===14);
{const cells=[];for(let x=2;x<5;x++)for(let y=0;y<3;y++)cells.push(["brick",x,y,3]);const G=Z.wbWorld(C,Z.wbFromBuild(cells));Z.wbSettle(G);run(G,3);T("A house you built stands up",G.down<.1);
  let n=0;while(!Z.wbFlat(G)&&n<10){const st=G.blocks.filter(b=>b.wb.orig&&b.wb.down!==2&&!b.wb.gone).sort((a,b)=>b.position.y-a.position.y)[0];if(!st)break;const [p,y]=aimAt(st.position.x,Math.max(.5,st.position.y-.5),st.position.z-.5,"ball");shot(G,p,y,"ball");n++}T("...and can be knocked down",Z.wbFlat(G),n+" shots")}
/* build for each other: who wins */
T("Build-off: the house that took more shots wins",Z.wbDuelWinner({shots:5,flat:1},{shots:3,flat:1})==="a"&&Z.wbDuelWinner({shots:2,flat:1},{shots:9,flat:0})==="b"&&Z.wbDuelWinner({shots:4,flat:1},{shots:4,flat:1})===null);
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
