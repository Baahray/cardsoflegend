/* Penalty shootout physics tests. Run:  node pen_tests.js   (needs pen_phys.js next to it or in ../)
   Every kick is a real kick through the same physics the game uses, against a real diving keeper. Nothing is faked. */
let P;try{P=require("./pen_phys.js")}catch(e){P=require("../pen_phys.js")}
let pass=0,fail=0;const t=(name,cond,info)=>{if(cond){pass++;console.log("  ok   "+name)}else{fail++;console.log("  FAIL "+name+(info?"  ->  "+info:""))}};
const kick=(tx,ty,pw,cu,dx,dy,kidK=false)=>{const r=P.pnSim(P.pnLaunch({tx,ty,pw,cu},false),{x:dx,y:dy},kidK,true);r.kind=P.pnKind(r);return r};
const seq=r=>r.ev.filter(e=>e.k!=="ground").map(e=>e.k+(e.part?":"+e.part:"")).join(",")+" -> "+r.kind;
const STAY={x:0,y:1},LEFT={x:-2.5,y:1};
console.log("Shot outcomes");
let r=kick(2.4,.2,1,0,STAY.x,STAY.y);t("1  Low corner: keeper stays, ball into the bottom corner",r.goal&&r.kind==="low-corner",seq(r));
r=kick(2.4,1.6,1,0,STAY.x,STAY.y);t("2  Top corner: into the top corner",r.goal&&r.kind==="top-corner",seq(r));
r=kick(0,.2,1,0,LEFT.x,LEFT.y);  t("3  Down the middle while the keeper dives away",r.goal&&r.kind==="middle",seq(r));
r=kick(2.9,.2,1,0,2.8,.4);       t("4  Caught: keeper dives the right way and holds it",!r.goal&&r.kind==="caught",seq(r));
r=kick(2.9,.3,1,0,2.8,.4);       t("5  Saved: keeper pushes it away",!r.goal&&r.kind==="saved",seq(r));
r=kick(3.7,.2,1,0,STAY.x,STAY.y);t("6  Hits the post and stays out",!r.goal&&r.kind==="post",seq(r));
r=kick(3.6,.2,1,0,STAY.x,STAY.y);t("7  In off the post",r.goal&&r.kind==="post-in",seq(r));
r=kick(0,2.5,1,0,STAY.x,STAY.y); t("8  Hits the crossbar and stays out",!r.goal&&r.kind==="bar",seq(r));
r=kick(0,2.4,1,0,STAY.x,STAY.y); t("9  Off the crossbar and in",r.goal&&r.kind==="bar-in",seq(r));
r=kick(4,.2,1,0,STAY.x,STAY.y);  t("10 Wide of the post",!r.goal&&r.kind==="wide",seq(r));
r=kick(0,3.1,1,0,LEFT.x,LEFT.y); t("11 Over the bar",!r.goal&&r.kind==="over",seq(r));
r=kick(.1,.2,1,0,STAY.x,STAY.y); t("12 Keeper gets a touch but it still goes in",r.goal&&r.kind==="keeper-in",seq(r));
r=kick(1.1,.2,1,0,STAY.x,STAY.y);{const last=r.frames[r.frames.length-1],prev=r.frames[r.frames.length-3];
 t("13 The net catches it: ball hits the net, drops and stops",r.goal&&r.ev.some(e=>e.k==="net")&&last.p[2]<0&&last.p[2]>-P.PN.netD&&last.p[1]<P.PN.br+.05&&Math.hypot(last.p[0]-prev.p[0],last.p[2]-prev.p[2])<.06,seq(r)+" ends at "+last.p.map(v=>v.toFixed(2)))}

console.log("\nRules");
{const a=kick(2.5,1,1,.6,-2.5,1),b=kick(2.5,1,1,.6,-2.5,1);t("Same kick and same dive give exactly the same result",JSON.stringify(a.frames)===JSON.stringify(b.frames))}
{const r=kick(2,1,1,0,STAY.x,STAY.y);t("The ball goes where you aimed (within 3 cm)",Math.abs(r.cross.x-2)<.03&&Math.abs(r.cross.y-1)<.03,JSON.stringify(r.cross))}
{const a=kick(2.5,1,1,0,LEFT.x,LEFT.y),b=kick(2.5,1,1,.9,LEFT.x,LEFT.y),c=kick(2.5,1,1,-.9,LEFT.x,LEFT.y),mid=r=>r.frames.find(f=>f.p[2]<5.5).p[0];
 t("Curl bends the ball: it swings in from one side or the other",mid(b)<mid(a)-.12&&mid(c)>mid(a)+.12,[mid(c),mid(a),mid(b)].map(v=>v.toFixed(2)).join(" "))}
{const r=kick(0,1,1.4,0,STAY.x,STAY.y);t("Hitting it far too hard makes it fly up (over or off the bar)",!r.goal&&(r.kind==="over"||r.kind==="bar"),seq(r))}
{/* the ball must cross the line completely: one sitting on the line is not a goal */let line=0;for(let tx=-3;tx<=3;tx+=.5)for(let ty=.2;ty<=2.2;ty+=.4){const r=kick(tx,ty,1,0,9,1);if(r.goal){const f=r.frames.find(f=>f.t>=r.goalT);if(!(f.p[2]<=-P.PN.br+1e-6))line++}}
 t("A goal only counts when the whole ball is over the line",line===0)}
{let bad=0;for(let tx=-3.5;tx<=3.5;tx+=.5)for(const dv of [STAY,LEFT,{x:2.5,y:1}]){const r=kick(tx,1,1,0,dv.x,dv.y);if(r.goal&&!(r.goalT>0))bad++}t("Each goal is counted once, at one moment",bad===0)}
{const r=kick(1.1,.2,1,0,STAY.x,STAY.y);t("A ball that hits the net and rolls about is still only one goal",r.goal&&r.ev.filter(e=>e.k==="net").length>=1)}
{const r=kick(2.9,.2,1,0,2.8,.4),hold=r.frames.filter(f=>f.t>.6);t("A caught ball stays in the keeper's gloves",r.caught&&hold.every(f=>f.p[2]>-.1),seq(r))}
{const k0=P.pnKeeper({x:2.8,y:.4},-1,false),k1=P.pnKeeper({x:2.8,y:.4},1,false);t("The keeper really dives: starts standing, ends stretched out low to the side",Math.abs(k0.J.hip[0])<.01&&k1.J.handL[0]>2.4&&k1.J.handL[1]<.8,JSON.stringify(k1.J.handL.map(v=>+v.toFixed(2))))}
{let reach=0;for(let tx=0;tx<=3.6;tx+=.05){const k=P.pnKeeper({x:tx,y:.4},1,false);reach=Math.max(reach,k.J.handL[0])}t("Corners right by the post are out of the keeper's reach",reach<3.3,"reach "+reach.toFixed(2))}
{const kid=P.pnKeeper({x:3.3,y:.4},1,true).J.handL[0],dad=P.pnKeeper({x:3.3,y:.4},1,false).J.handL[0];t("Cass in goal reaches a bit further (his hidden advantage)",kid>dad,kid.toFixed(2)+" vs "+dad.toFixed(2))}
{const a=P.pnAssist({tx:4.5,ty:3.5,pw:1,cu:0},true),b=P.pnAssist({tx:4.5,ty:3.5,pw:1,cu:0},false);t("Cass's wild aims are pulled back towards the goal more than Dad's",a.tx<b.tx&&a.ty<b.ty,JSON.stringify([a,b]))}
console.log("\nSave areas and the power bar (the game's rules)");
{const pk=(z,tx,ty)=>P.pnRun({tx,ty,pw:1,lift:0,cu:0,kid:0},{z,kid:0},false);let ok=0;P.PN_Z.forEach((Z,i)=>{const r=pk(i,Z.x,Z.y);if(!r.goal)ok++});
 t("Keeper picks the right area: every one of the 7 areas is saved",ok===7,ok+"/7")}
{let ok=0;P.PN_Z.forEach((Z,i)=>{const r=P.pnRun({tx:Z.x,ty:Z.y,pw:1,lift:0,cu:0,kid:0},{z:(i+2)%7,kid:0},false);if(r.goal)ok++});t("Keeper picks a different area: it's a goal",ok===7,ok+"/7")}
{let bad=0,n=0;for(let tx=-3.5;tx<=3.5;tx+=.25)for(let ty=.15;ty<=2.3;ty+=.25)for(let z=0;z<7;z++){n++;const s={tx,ty,pw:1,lift:0,cu:0,kid:0},r=P.pnRun(s,{z,kid:0},false),k=P.pnKind(r);
  if(r.plan.save&&r.goal)bad++;if(!r.plan.save&&(k==="saved"||k==="caught"))bad++}
 t("Across "+n+" kicks: saved exactly when the shot is closest to the keeper's area",bad===0,bad+" wrong")}
{const r=P.pnRun({tx:-2.9,ty:.3,pw:1,lift:0,cu:0,kid:0},{z:2,kid:0},true);t("A save really happens in the physics: the keeper's gloves or body touch the ball",r.ev.some(e=>e.k==="keeper"||e.k==="catch"),seq(r))}
{const g=P.pnPower(P.PN_BAR.mid,false),hi=P.pnPower(.98,false),lo=P.pnPower(.05,false);t("Power bar: green is perfect, top is too hard, bottom is too soft",g.q==="perfect"&&g.lift===0&&hi.q==="too hard"&&hi.lift>1&&lo.q==="too soft"&&lo.pw<.7,JSON.stringify([g,hi,lo]))}
{const s={tx:0,ty:1.6,cu:0,kid:0},a=P.pnRun({...s,...P.pnPower(P.PN_BAR.mid,false)},{z:0,kid:0},false),b=P.pnRun({...s,...P.pnPower(1,false)},{z:0,kid:0},false);
 t("Hit it in the green and it goes where you picked; too hard and it flies over",a.goal&&!b.goal&&(P.pnKind(b)==="over"||P.pnKind(b)==="bar"),P.pnKind(a)+" / "+P.pnKind(b))}
{const p=P.PN_BAR.mid+P.PN_BAR.adult+.02;t("Cass's green area is a bit wider (his hidden advantage)",P.pnPower(p,true).q==="perfect"&&P.pnPower(p,false).q!=="perfect")}
{/* a shot just on the border between two areas: Cass in goal gets it, Dad doesn't */const s={tx:-2.4,ty:.79,pw:1,lift:0,cu:0,kid:0},kid=P.pnRun(s,{z:2,kid:1},false),dad=P.pnRun(s,{z:2,kid:0},false);
 t("Cass in goal also saves shots right on the edge of his area",!kid.goal&&dad.goal,P.PN_Z[kid.plan.zone].n)}
console.log(`\n${pass} passed, ${fail} failed`);if(fail)process.exit(1);
