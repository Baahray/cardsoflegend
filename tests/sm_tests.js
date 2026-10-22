/* Smackerball physics and rules tests. Run:  node sm_tests.js   (needs sm_phys.js next to it or in ../) */
let R;try{R=require("./sm_phys.js")}catch(e){R=require("../sm_phys.js")}
const {SR}=R,BX=(SR.bx0+SR.bx1)/2;let pass=0,fail=0;const t=(name,cond,info)=>{if(cond){pass++;console.log("  ok   "+name)}else{fail++;console.log("  FAIL "+name+(info?"  ->  "+info:""))}};
const run=(p,v,secs=4,hands=[],seed=1)=>{const S={p,v};const ev=R.srRun(S,secs,hands,R.srRng(seed));return{S,ev,k:ev.filter(e=>e.k!=="floor").map(e=>e.k+(e.by?":"+e.by:"")+(e.where?":"+e.where:"")+(e.high?":high":"")).join(" ")}};
const hand=(who,p,v=[0,0,0],kid=false)=>{const K=kid?R.SR_HAND.kid:R.SR_HAND.adult;return{who,p,v,r:K.r,ex:K.ex,max:K.max,reach:K.reach}};
console.log("The room");
let r=run([0,.1,1],[0,1,-7]);t("1  A hard smack along the floor hits their back wall under head height: GOAL",r.ev.some(e=>e.k==="goal"&&e.by==="X"),r.k);
r=run([0,.1,1],[0,5.6,-6]);t("2  Over head height it bounces off the wall: no goal from that hit",r.ev.find(e=>e.k!=="floor"&&e.k!=="cross").k==="wall",r.k);
r=run([0,.1,1],[4,0,-2]);t("3  Off the side wall and back into play",r.ev.some(e=>e.k==="wall"||e.k==="box")&&!r.ev.some(e=>e.k==="goal"),r.k);
{const mk=used=>({ball:{p:[BX,.1,2],v:[0,4.2,-2.9]},hands:{X:hand("X",[0,SR.hy,2.6]),O:hand("O",[-1,SR.hy,-2.6])},touch:{X:0,O:used}}),
   a=mk(0),ea=[],b=mk(0),eb=[];for(let i=0;i<180;i++){if(i===90)b.touch[R.srOwner(b.ball.p)]=2;/* it landed in Cass's half; say he has used both touches */ea.push(...R.srTick(a,1/60,null));eb.push(...R.srTick(b,1/60,null))}
 t("4a Lands on top of a red box with a touch left: it sits there, still in play",a.ball.top&&!a.ball.dead&&!ea.some(e=>e.k==="stuck"),JSON.stringify(a.ball.p.map(v=>+v.toFixed(2))));
 t("4b Lands on top with both touches used: dead ball",eb.some(e=>e.k==="stuck"&&e.where==="top"));
 /* now the Shadow Knight's hand slides over the box and hits it off */
 const H=a.hands.O;H.p=[BX,R.srHandY([BX,0,-.75],H.r),-.75];H.pp=H.p.slice();a.hands.O.p=[BX,0,.2];const e2=R.srTick(a,1/30,null);
 t("4c A hand that goes over the box climbs onto it and can smack the ball off the top",e2.some(e=>e.k==="touch"&&e.who==="O"),e2.map(e=>e.k).join(" "))}
r=run([BX,.1,2.5],[0,0,-2.6]);t("5  The red boxes are flat against the wall: a ball rolling down the side can't get behind, it hits the box",r.ev.some(e=>e.k==="box")&&!r.ev.some(e=>e.where==="behind")&&SR.bx1===SR.W,r.k);
r=run([BX,.1,2],[0,0,-3]);t("6  Hits the side of a box: soft, it doesn't bounce far",r.ev.some(e=>e.k==="box")&&Math.abs(r.S.p[2])<2.6,r.k);
{const S={p:[0,.1,1],v:[0,3,-1.2]},ev=R.srRun(S,6,[],null),f=ev.filter(e=>e.k==="floor").map(e=>e.sp);t("7  Bounces lower and lower, then rolls to a stop",f.length>=2&&f.every((v,i)=>!i||v<f[i-1])&&Math.hypot(S.v[0],S.v[2])<.05,f.join(" "))}
console.log("\nHands");
{const blk=x=>{const S={p:[x,.12,.5],v:[0,0,-6]};R.srRun(S,.4,[hand("O",[0,SR.hy,-1.5])],null);return S.v},a=blk(0),l=blk(-.25),r=blk(.25);
 t("8  TABLE TENNIS: a still glove blocks the ball straight back to the other end",a[2]>3&&Math.abs(a[0])<.5,a.map(v=>v.toFixed(1)).join(","));
 t("9  ...catching it on the edge of the glove angles it off that way",Math.sign(l[0])!==Math.sign(r[0])&&Math.abs(l[0])>.5,l[0].toFixed(1)+" / "+r[0].toFixed(1))}
{const hit=v=>{const S={p:[0,.12,1.3],v:[0,0,4]};R.srRun(S,.12,[hand("X",[0,SR.hy,1.75],v)],null);return S.v},still=hit([0,0,0]),swing=hit([0,0,-6]),across=hit([3,0,-4]);
 t("10 ...swinging into it hits it harder, and it always goes forward (never back at you)",Math.hypot(swing[0],swing[2])>Math.hypot(still[0],still[2])+2&&still[2]<0&&swing[2]<0,Math.hypot(still[0],still[2]).toFixed(1)+" vs "+Math.hypot(swing[0],swing[2]).toFixed(1));
 t("10s ...and swinging across the ball sends it that way",across[0]>.5&&across[2]<0,across.map(v=>v.toFixed(1)).join(","))}
{const G={ball:{p:[0,.1,1.2],v:[0,0,0]},hands:{X:hand("X",[0,SR.hy,1.6]),O:hand("O",[0,SR.hy,-2.4])},touch:{X:0,O:0},t:0};const e=R.srHitBall(G,"X",[.3,-1],8);let top=0;for(let i=0;i<60;i++){R.srTick(G,1/60,null);top=Math.max(top,G.ball.p[1])}
 t("10t A TAP slap sends the ball off fast towards their end with a little air",e&&e.res==="ok"&&top>.3&&top<SR.GH,"highest "+top.toFixed(2))}
{let saves=0,n=0;for(const x of [-.25,-.12,0,.12,.25])for(const vy of [0,1.5,2.5]){n++;const S={p:[x,.1,.2],v:[0,vy,6]};R.srRun(S,.45,[hand("X",[0,SR.hy,1.4])],R.srRng(3));if(S.p[2]<1.4&&S.v[2]<=0)saves++}
 t("10z A still glove saves shots that hit anywhere on it, even bouncing ones",saves===n,saves+"/"+n)}
{const G={ball:{p:[0,.12,-1],v:[0,0,7]},hands:{X:hand("X",[0,SR.hy,2.6],[0,0,0],true),O:hand("O",[0,SR.hy,-3.2])},touch:{X:0,O:0},t:0};G.hands.O.ghost=0;let back=0;
 for(let r=0;r<5;r++){G.ball={p:[(r-2)*.5,.12,-1],v:[0,0,7]};G.touch={X:0,O:0};G.hands.X.p=[(r-2)*.5,SR.hy,2.6];G.hands.X.pp=G.hands.X.p.slice();let ok=false;
  for(let i=0;i<60&&!ok;i++){R.srTick(G,1/60,null);if(G.ball.v[2]<-1)ok=true}if(ok)back++}
 t("10r RALLY: a still glove keeps hitting it back shot after shot (glove never stays see-through)",back===5,back+"/5")}
{const mk=kid=>({ball:{p:[0,.1,1.2],v:[0,0,0]},hands:{X:{...hand("X",[0,SR.hy,1.6],[0,0,0],kid),reach:(kid?R.SR_HAND.kid:R.SR_HAND.adult).reach},O:hand("O",[0,SR.hy,-2.4])},touch:{X:0,O:0},t:0}),A=mk(true),B=mk(false),kid=A.hands.X,dad=B.hands.X;
 R.srSwipeHit(A,"X",[0,0,1.7],[0,0,.5],15);R.srSwipeHit(B,"X",[0,0,1.7],[0,0,.5],15);const a=A.ball,b=B.ball;
 t("11 Cass's hand is bigger and smacks a bit harder (his hidden advantage)",kid.r>dad.r&&Math.hypot(...a.v)>Math.hypot(...b.v),Math.hypot(...a.v).toFixed(1)+" vs "+Math.hypot(...b.v).toFixed(1))}
{const mk=()=>({ball:{p:[.2,.1,1.3],v:[0,0,0]},hands:{X:{...hand("X",[.2,SR.hy,1.62]),reach:R.SR_HAND.adult.reach},O:hand("O",[0,SR.hy,-2.4])},touch:{X:0,O:0},t:0});
 let G=mk();R.srSlap(G,"X",[0,-1],6);const e=[];for(let i=0;i<10;i++)e.push(...R.srTick(G,1/60,null));const s=e.find(x=>x.slap);
 t("10b FLICK straight up: the glove slaps the ball straight at their wall, fast and low",s&&G.ball.v[2]<-5&&G.ball.p[1]<.35,JSON.stringify(G.ball.v.map(v=>+v.toFixed(2))));
 G=mk();R.srSlap(G,"X",[1,-1],6);for(let i=0;i<10;i++)R.srTick(G,1/60,null);const ang=Math.atan2(G.ball.v[0],-G.ball.v[2])*180/Math.PI;
 t("10c FLICK: it goes the way you flicked (45 degrees right here)",Math.abs(ang-45)<4,ang.toFixed(1)+" degrees");
 G=mk();G.ball.p=[1.3,.1,.2];const e2=[];R.srSlap(G,"X",[0,-1],6);for(let i=0;i<10;i++)e2.push(...R.srTick(G,1/60,null));t("10d A slap that's nowhere near the ball doesn't touch it",!e2.some(x=>x.k==="touch"));
 G=mk();let res=[];for(let k=0;k<3;k++){G.ball.p=[.2,.1,1.3];G.ball.v=[0,0,0];G.t+=.5;R.srSlap(G,"X",[0,-1],2);for(let i=0;i<8;i++){const ee=R.srTick(G,1/60,null);ee.filter(x=>x.slap).forEach(x=>res.push(x.res))}}
 t("10e Slaps count as touches: a 3rd one in your half is a penalty",res.join()==="ok,ok,pen"&&G.pen==="O",res.join())}
{const mk=()=>({ball:{p:[.1,.1,1.2],v:[0,0,0]},hands:{X:{...hand("X",[.1,SR.hy,1.6]),reach:R.SR_HAND.adult.reach},O:hand("O",[0,SR.hy,-2.4])},touch:{X:0,O:0},t:0});
 let G=mk();const h=R.srSwipeHit(G,"X",[.1,0,1.7],[.1,0,.6],7);let top=0;for(let i=0;i<60;i++){R.srTick(G,1/60,null);top=Math.max(top,G.ball.p[1])}
 t("10f SWIPE through the ball: it goes along your swipe, with some air (a low arc under head height)",h&&top>.3&&top<SR.GH,"highest "+top.toFixed(2)+" m");
 G=mk();const ang=(()=>{R.srSwipeHit(G,"X",[-.3,0,1.6],[.5,0,.8],7);return Math.atan2(G.ball.v[0],-G.ball.v[2])*180/Math.PI})();t("10g ...a diagonal swipe sends it diagonally",Math.abs(ang-45)<2,ang.toFixed(1));
 G=mk();t("10h ...a swipe that passes well away from the ball does nothing",R.srSwipeHit(G,"X",[1.2,0,1.7],[1.2,0,.4],7)===null);
 G=mk();G.ball.p=[.1,.1,-1];t("10i ...and you can't swipe the ball when it's in their half",R.srSwipeHit(G,"X",[.1,0,1.7],[.1,0,-1.5],7)===null)}
{const S={p:[0,.1,1.6],v:[0,0,0]};R.srRun(S,.05,[hand("X",[0,SR.hy,1.4],[0,0,5])],null);t("10y A glove pulling back towards your own wall hardly drags the ball (no hitting it backwards)",S.v[2]<1.6,S.v.map(v=>v.toFixed(2)).join(","))}
{const G={ball:{p:[0,.12,1.5],v:[0,0,0]},hands:{X:hand("X",[0,SR.hy,1.35]),O:hand("O",[0,SR.hy,-3])},touch:{X:0,O:0},t:0};R.srHitBall(G,"X",[0,-1],8);for(let i=0;i<24;i++)R.srTick(G,1/60,null);
 t("10w Slapping a ball that's tucked behind your glove: it flies forward through the glove, it doesn't bounce back at you",G.ball.v[2]<-4&&G.ball.p[2]<0,G.ball.p.map(v=>v.toFixed(2)).join(",")+" v "+G.ball.v.map(v=>v.toFixed(1)).join(","))}
console.log("\nRules");
{const G={touch:{X:0,O:0}};const a=[R.srTouch(G,"X"),R.srTouch(G,"X"),R.srTouch(G,"X")];t("12 Two touches are fine; the third is a penalty to the other player",a.join()==="ok,ok,pen"&&G.pen==="O",a.join()+" pen:"+G.pen)}
{const G={touch:{X:0,O:0}};R.srTouch(G,"X");R.srTouch(G,"X");R.srCross(G,"O");R.srCross(G,"X");t("13 Touches reset when the ball goes into the other half",G.touch.X===0&&R.srTouch(G,"X")==="ok")}
{const mk=()=>({ball:{p:[0,.1,1],v:[0,1,-7]},hands:{X:hand("X",[0,SR.hy,2.5]),O:hand("O",[1.5,SR.hy,-2.5])},touch:{X:0,O:0}});const G=mk(),ev=[];for(let i=0;i<240;i++)ev.push(...R.srTick(G,1/60,null));
 t("14 A goal is counted once and the ball stops there",ev.filter(e=>e.k==="goal").length===1&&G.ball.dead)}
{const a=run([0,.1,1],[.7,2,-5],4,[hand("O",[0,SR.hy,-1.2])],7),b=run([0,.1,1],[.7,2,-5],4,[hand("O",[0,SR.hy,-1.2])],7);t("15 Same shot gives exactly the same result (replays and tests)",JSON.stringify(a.S)===JSON.stringify(b.S))}
console.log("\nShadow Knight");
{/* the bug: with 2 touches used and the ball sitting in its half, it used to stop playing for ever */
 const G={ball:{p:[.3,.1,-1.4],v:[0,0,0]},hands:{X:hand("X",[0,SR.hy,2.6]),O:hand("O",[0,SR.hy,-2.4])},touch:{X:0,O:2}},rnd=R.srRng(2);let pen=null,tt=0;
 for(let i=0;i<60*8&&!pen;i++){R.srAI(G,1/60,false,rnd);const e=R.srTick(G,1/60,rnd);if(G.pen)pen=G.pen;tt=i/60}
 t("16 With 2 touches used and a dead ball in its half, it still plays it: that's a PENALTY to you",pen==="X",pen?"penalty after "+tt.toFixed(1)+"s":"never touched it")}
{const G={ball:{p:[.4,.1,-1.2],v:[0,0,0]},hands:{X:hand("X",[0,SR.hy,2.6]),O:hand("O",[0,SR.hy,-2.4])},touch:{X:0,O:0}},rnd=R.srRng(5);let crossed=false;
 for(let i=0;i<60*6&&!crossed;i++){R.srAI(G,1/60,false,rnd);const e=R.srTick(G,1/60,rnd);if(e.some(x=>x.k==="cross"&&x.to==="X")||e.some(x=>x.k==="goal"))crossed=true}
 t("17 With touches left it smacks the ball over into your half",crossed)}
console.log("\nPenalties (from the halfway line, same controls as Penalties)");
{let ok=0;R.SR_Z.forEach((Z,i)=>{const r=R.srPenRun({tx:Z.x,ty:Z.y,pw:1,lift:0},{z:i,kid:0},false);if(!r.goal&&r.kind==="saved")ok++});t("18 Keeper picks the right area: saved, for all 7 areas",ok===7,ok+"/7")}
{let ok=0;R.SR_Z.forEach((Z,i)=>{const r=R.srPenRun({tx:Z.x,ty:Z.y,pw:1,lift:0},{z:(i+2)%7,kid:0},false);if(r.goal)ok++});t("19 Keeper picks another area: GOAL",ok===7,ok+"/7")}
{const r=R.srPenRun({tx:-1,ty:.3,...R.srPower(.97,false)},{z:3,kid:0},false);t("20 Far too hard: it flies above head height off the wall, no goal",r.kind==="over"&&!r.goal,r.kind)}
{const s={tx:-1.2,ty:.4,...R.srPower(.42,false)},a=R.srPenRun(s,{z:0,kid:0},false),b=R.srPenRun({...s,...R.srPower(.56,false)},{z:0,kid:0},false);
 t("21 A bit soft: slower, and a keeper in the next area along saves it",!a.goal&&a.kind==="saved"&&b.goal===true,a.kind+" / perfect: "+b.kind)}
{const r=R.srPenRun({tx:.5,ty:.3,...R.srPower(.15,false)},{z:3,kid:0},true),last=r.frames[r.frames.length-1];t("22 Far too soft: it rolls and stops before the wall",r.kind==="short"&&!r.goal&&last.p[2]>-SR.L+.3,"stops at z="+last.p[2].toFixed(2))}
{let bad=0,n=0;for(let tx=-1.6;tx<=1.6;tx+=.2)for(let ty=.1;ty<=.85;ty+=.15)for(let z=0;z<7;z++){n++;const r=R.srPenRun({tx,ty,pw:1,lift:0},{z,kid:0},false);if(r.save===r.goal)bad++}
 t("23 Across "+n+" penalties: saved exactly when the keeper picked the closest area",bad===0,bad+" wrong")}
console.log(`\n${pass} passed, ${fail} failed`);if(fail)process.exit(1);
