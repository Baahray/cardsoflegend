// Frog Fling rules tests: node ff_tests.js
const C=require("./ff_core.js");const {FF,FF_T}=C;let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log("FAIL",m)}};
// the same seed makes the same world
ok(JSON.stringify(C.ffGen(5,3,0))===JSON.stringify(C.ffGen(5,3,0)),"world is repeatable");
// nothing solid right in front of the launch trees
for(let s=1;s<50;s++){const o=C.ffGen(s,0,0);ok(o.filter(t=>!t.side&&t.s<14).length===0,"start clear seed "+s)}
// every thing has a picture size and known kind
for(const k in FF_T){const t=FF_T[k];ok(t.w>0&&t.h>0&&["obst","bnc","top","pick","water","mud","deco"].includes(t.k),"type "+k)}
// all zones make things
for(const z of C.FF_Z){const k=Math.floor((z.s+20)/FF.chunk);ok(C.ffGen(9,k,0).length>5,"zone has things "+z.k)}
// road has traffic going both ways
const road=[4,5].flatMap(k=>C.ffGen(3,k,0)).filter(o=>o.road);ok(road.some(o=>o.dir<0)&&road.some(o=>o.dir>0),"traffic both ways");
// moving things stay on the loop
for(const o of road)for(const t of [0,3.3,100,1e4]){const x=C.ffMx(o,t);ok(Math.abs(x)<=70,"traffic stays in loop")}
// a fling with no power goes a short way; full power goes further; it always ends
const fly=(p,seed,kid)=>{const F=C.ffNew(seed,kid);C.ffLaunch(F,p,0);let i=0;while(F.mode!=="done"&&i<60*400){C.ffStep(F,1/60,0);F.ev.length=0;i++}return F};
let lo=0,hi=0;for(let s=0;s<40;s++){const a=fly(.1,100+s),b=fly(1,100+s);ok(a.mode==="done"&&b.mode==="done","flings end");lo+=a.s;hi+=b.s}
ok(hi>lo*1.5,"more pull, further fling "+(lo/40).toFixed(0)+" vs "+(hi/40).toFixed(0));
// no NaN ever
for(let s=0;s<30;s++){const F=fly(.5+s/60,300+s);ok(isFinite(F.s)&&isFinite(F.x)&&isFinite(F.y),"finite")}
// a spring pad bounces you up
{const F=C.ffNew(1,0);F.mode="fly";F.chunks[1]=[{t:"mushroom",x:0,s:50,y:0,id:1}];F.s=49;F.x=0;F.y=5;F.vy=-6;F.vs=8;let up=0;for(let i=0;i<60;i++){C.ffStep(F,1/60,0);if(F.ev.some(e=>e.e==="boing"))up=1;F.ev.length=0}ok(up&&F.vy>5,"mushroom bounces")}
// hitting a rock slows you down
{const F=C.ffNew(1,0);F.mode="fly";F.chunks[1]=[{t:"boulder",x:0,s:50,y:0,id:1}];F.s=47;F.x=0;F.y=2;F.vy=0;F.vs=20;for(let i=0;i<30;i++){C.ffStep(F,1/60,0);F.ev.length=0}ok(F.vs<12&&F.bumps>=1,"rock bump "+F.vs.toFixed(1))}
// landing in a pond slowly = splash ending
{const F=C.ffNew(1,0);F.mode="fly";F.chunks[1]=[{t:"pond",x:0,s:50,y:0,id:1}];F.s=50;F.x=0;F.y=.6;F.vy=-3;F.vs=5;for(let i=0;i<10;i++){C.ffStep(F,1/60,0)}ok(F.mode==="done"&&F.end==="splash","slow splash ends")}
// fast over water skips like a stone
{const F=C.ffNew(1,0);F.mode="fly";F.chunks[1]=[{t:"pond",x:0,s:50,y:0,id:1}];F.s=50;F.x=0;F.y=.6;F.vy=-3;F.vs=20;for(let i=0;i<3;i++){C.ffStep(F,1/60,0)}ok(F.mode==="fly"&&F.vy>0,"fast skip")}
// flies and coins get collected
{const F=C.ffNew(1,0);F.mode="fly";F.chunks[1]=[{t:"coin",x:0,s:50,y:3,id:1},{t:"fly",x:1,s:55,y:3,id:2}];F.s=48;F.x=0;F.y=3.7;F.vy=0;F.vs=15;for(let i=0;i<40;i++){C.ffStep(F,1/60,0)}ok(F.coins===1&&F.flies===1,"collect")}
// medals
ok(C.ffMedal(10)===null&&C.ffMedal(250)==="bronze"&&C.ffMedal(700)==="silver"&&C.ffMedal(1300)==="gold","medals");
// tongue: grab a fly ahead, zip to it, get whipped forward; uses a shot
{const F=C.ffNew(1,0);F.mode="fly";const o={t:"fly",x:2,s:58,y:6,hov:1,ph:0,id:5};F.chunks[1]=[o];F.s=50;F.x=0;F.y=5;F.vy=-2;F.vs=10;const sh=F.shots;
  ok(C.ffCanTongue(F,o),"fly in reach");ok(C.ffTongue(F,o),"tongue fires");let wh=0;for(let i=0;i<60;i++){C.ffStep(F,1/60,0);if(F.ev.some(e=>e.e==="whip"))wh=1;F.ev.length=0}
  ok(wh&&F.whips===1&&F.shots===sh-1&&F.vs>15,"whip "+F.vs.toFixed(1))}
// out of reach / out of shots
{const F=C.ffNew(1,0);F.mode="fly";const o={t:"fly",x:0,s:90,y:5,hov:1,id:6};F.chunks[2]=[o];F.s=50;F.y=5;ok(!C.ffCanTongue(F,o),"too far");F.s=82;F.shots=0;ok(!C.ffCanTongue(F,o),"no shots left")}
// a better tongue reaches further
{const a=C.ffNew(1,0),b=C.ffNew(1,0,{tng:3});ok(C.ffTongueR(b)>C.ffTongueR(a)&&b.shots===6,"tongue upgrade")}
// stretch upgrade flings further
{const a=C.ffNew(1,0),b=C.ffNew(1,0,{pow:5});C.ffLaunch(a,1,0);C.ffLaunch(b,1,0);ok(b.vs>a.vs*1.3,"stretch upgrade")}
// perfect release is stronger
{const a=C.ffNew(1,0),b=C.ffNew(1,0);C.ffLaunch(a,.85,0);C.ffLaunch(b,.85,0,true);ok(b.vs>a.vs*1.1&&b.perfect,"perfect")}
// combo builds with bounces and ends on the ground
{const F=C.ffNew(1,0);F.mode="fly";F.chunks[1]=[{t:"mushroom",x:0,s:50,y:0,id:1},{t:"mushroom",x:0,s:75,y:0,id:2}];F.s=49;F.y=5;F.vy=-6;F.vs=8;let mx=0;
  for(let i=0;i<60*12&&F.mode!=="done";i++){C.ffStep(F,1/60,0);mx=Math.max(mx,F.combo);F.ev.length=0}ok(mx>=1&&F.combo===0&&F.bestCombo>=1,"combo "+F.bestCombo)}
// bubble: bumping a rock doesn't slow you much
{const F=C.ffNew(1,0);F.mode="fly";F.bubble=4;F.chunks[1]=[{t:"boulder",x:0,s:50,y:0,id:1}];F.s=47;F.y=2;F.vy=0;F.vs=20;for(let i=0;i<20;i++){C.ffStep(F,1/60,0);F.ev.length=0}ok(F.vs>17&&F.bumps===0,"bubble protects")}
// rocket speeds you up, bird carries you high
{const F=C.ffNew(1,0);F.mode="fly";F.s=50;F.y=5;F.vs=20;F.rocket=2.6;for(let i=0;i<60;i++){C.ffStep(F,1/60,0)}ok(F.vs>30,"rocket "+F.vs.toFixed(1))}
{const F=C.ffNew(1,0);F.mode="fly";F.s=50;F.y=3;F.vs=15;F.bird=3;for(let i=0;i<120;i++){C.ffStep(F,1/60,0)}ok(F.y>8&&F.vs>20,"bird")}
// grabbing a fly from the ground gets you flying again
{const F=C.ffNew(1,0);F.mode="slide";F.s=50;F.y=FF.R;F.vs=3;const o={t:"fly",x:0,s:57,y:4,hov:1,ph:0,id:7};F.chunks[1]=[o];ok(C.ffTongue(F,o),"tongue from the ground");for(let i=0;i<40;i++){C.ffStep(F,1/60,0)}ok(F.mode==="fly"&&F.whips===1,"back in the air")}
// the path is recorded for the ghost
{const F=C.ffNew(2,0);C.ffLaunch(F,.8,0);for(let i=0;i<120;i++)C.ffStep(F,1/60,0);ok(F.path.length>=57&&F.path.length%3===0&&F.path.every(Number.isInteger),"ghost path")}
// tongue shots come back as you fly, faster with coins, never above the maximum
{const F=C.ffNew(1,0);F.mode="fly";F.shots=0;F.s=50;F.y=30;F.vy=0;F.vs=40;let got=0;for(let i=0;i<60*6;i++){C.ffStep(F,1/60,0);if(F.ev.some(e=>e.e==="recharge"))got++;F.ev.length=0;F.y=30;F.vy=0}
  ok(got>=1&&F.shots>=1&&F.shots<=C.ffShots(F),"recharge by distance "+F.shots)}
{const F=C.ffNew(1,0);F.shots=0;for(let i=0;i<20;i++)C.ffGet(F,{t:"coin",x:0,s:0,y:0},"touch");ok(F.shots===1,"coins recharge "+F.shots)}
{const F=C.ffNew(1,0);C.ffCharge(F,50);ok(F.shots===C.ffShots(F)&&F.charge===0,"never over the max")}
// later in the journey recharging takes longer, so flings still end
{let tot=0;for(let s=0;s<20;s++){const F=C.ffNew(500+s,0);C.ffLaunch(F,1,0);let i=0;while(F.mode!=="done"&&i<60*400){if(F.vy<0&&!F.grab)for(let k=-1;k<2;k++)for(const o of C.ffObjs(F,F.s+k*40))if(o.hov&&C.ffCanTongue(F,o)){C.ffTongue(F,o);break}C.ffStep(F,1/60,0);F.ev.length=0;i++}ok(F.mode==="done","tongue flings still end");tot+=F.s}}
console.log(n-bad,"/",n,"passed");process.exit(bad?1:0);
