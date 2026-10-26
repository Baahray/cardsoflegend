// Frog Fling (side-on) rules tests: node ffs_tests.js
const C=require("./ffs_core.js");const {FSP,FS_T}=C;let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log("FAIL",m)}};
ok(JSON.stringify(C.fsGen(5,3,0))===JSON.stringify(C.fsGen(5,3,0)),"same seed, same world");
for(let s=1;s<60;s++)ok(C.fsGen(s,0,0).filter(o=>!o.hov&&o.t!=="coin"&&o.x<14).length===0,"start clear "+s);
for(const z of C.FS_Z)ok(C.fsGen(9,Math.floor((z.x+25)/FSP.chunk),0).length>2,"zone has things "+z.k);
// nothing solid on the busy road except traffic
for(let s=1;s<40;s++)for(let k=4;k<7;k++)for(const o of C.fsGen(s,k,0))if(FS_T[o.t]&&FS_T[o.t].k!=="pick"&&!o.ground)ok(!(o.x>C.FS_ROAD[0]+1&&o.x<C.FS_ROAD[1]-1),"road clear "+o.t+" "+o.x.toFixed(0));
// launching: further pull = faster; pulling down-back aims up
{const F=C.fsNew(1,0),a=C.fsLaunchVel(F,-1,-1),b=C.fsLaunchVel(F,-4,-3);ok(b.vx+b.vy>a.vx+a.vy&&b.vy>0&&b.vx>0,"pull power and direction")}
const fly=(seed,kid,ang)=>{const F=C.fsNew(seed,kid);C.fsLaunch(F,-Math.cos(ang)*5,-Math.sin(ang)*5);let i=0;while(F.mode!=="done"&&i<60*300){C.fsStep(F,1/60,0);F.ev.length=0;i++}return F};
for(let s=0;s<40;s++){const F=fly(100+s,0,.75);ok(F.mode==="done"&&isFinite(F.x)&&F.x>30,"fling ends "+F.x.toFixed(0))}
// tongue: grab a fly in reach, get whipped
{const F=C.fsNew(1,0);F.mode="fly";F.x=50;F.y=5;F.vx=12;F.vy=-2;const o={t:"fly",x:56,y:6,hov:1,ph:0,id:1};F.chunks[1]=[o];ok(C.fsCanGrab(F,o),"in reach");C.fsGrab(F,o);let w=0;for(let i=0;i<60;i++){C.fsStep(F,1/60,0);if(F.ev.some(e=>e.e==="whip"))w=1;F.ev.length=0}ok(w&&o.got&&F.whips===1,"whip")}
{const F=C.fsNew(1,0);F.mode="fly";F.x=50;F.y=5;const o={t:"fly",x:80,y:6,hov:1,id:2};F.chunks[1]=[o];ok(!C.fsCanGrab(F,o),"too far")}
// bounce pads and diving
{const run=dive=>{const F=C.fsNew(1,0);F.mode="fly";F.chunks[1]=[{t:"mushroom",x:60,y:0,id:1}];F.x=58;F.y=6;F.vx=6;F.vy=-4;let up=0;for(let i=0;i<90;i++){C.fsStep(F,1/60,dive);if(F.ev.some(e=>e.e==="boing"))up=F.vy;F.ev.length=0}return up};ok(run(0)>10&&run(1)>run(0),"mushroom, dive bounces higher")}
// bonk slows you
{const F=C.fsNew(1,0);F.mode="fly";F.chunks[1]=[{t:"boulder",x:60,y:0,id:1}];F.x=57;F.y=1.5;F.vx=20;F.vy=0;for(let i=0;i<20;i++){C.fsStep(F,1/60,0);F.ev.length=0}ok(F.vx<12&&F.bumps===1,"bonk")}
// water: fast skips, slow sinks
{const F=C.fsNew(1,0);F.mode="fly";F.chunks[1]=[{t:"water",x:55,x2:65,y:0,ground:1,id:1}];F.x=60;F.y=.75;F.vy=-3;F.vx=4;C.fsStep(F,1/60,0);ok(F.mode==="done"&&F.end==="splash","slow splash")}
{const F=C.fsNew(1,0);F.mode="fly";F.chunks[1]=[{t:"water",x:55,x2:65,y:0,ground:1,id:1}];F.x=60;F.y=.75;F.vy=-3;F.vx=20;C.fsStep(F,1/60,0);ok(F.mode==="fly"&&F.vy>0,"skip")}
// a tongue grab from the ground gets you flying again
{const F=C.fsNew(1,0);F.mode="slide";F.x=50;F.y=FSP.R;F.vx=3;const o={t:"fly",x:55,y:4,hov:1,ph:0,id:3};F.chunks[1]=[o];ok(C.fsGrab(F,o),"grab from ground");for(let i=0;i<40;i++)C.fsStep(F,1/60,0);ok(F.mode==="fly","flying again")}
// traffic drives and stays on the road
{const F=C.fsNew(3,0);F.mode="fly";F.x=200;F.y=10;F.vx=20;for(let i=0;i<600;i++){C.fsStep(F,1/60,0);F.ev.length=0;F.y=10;F.vy=0}ok(F.traffic&&F.traffic.slice(0,5).every(v=>{const x=C.fsVehX(F,v);return x>=C.FS_ROAD[0]&&x<=C.FS_ROAD[1]}),"traffic on the road")}
ok(C.fsMedal(10)===null&&C.fsMedal(200)==="bronze"&&C.fsMedal(600)==="silver"&&C.fsMedal(1200)==="gold","medals");
console.log(n-bad,"/",n,"passed");process.exit(bad?1:0);
