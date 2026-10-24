/* Zombie Tag rules tests. Run: node zt_tests.js (needs zt_core.js next to it or in ../) */
let Z;try{Z=require("./zt_core.js")}catch(e){Z=require("../zt_core.js")}
const {ZT}=Z;let pass=0,fail=0;const t=(name,c,info)=>{if(c){pass++;console.log("  ok   "+name)}else{fail++;console.log("  FAIL "+name+(info!=null?"  ->  "+info:""))}};
const t0=Date.now(),W=Z.ztWorld(12345),tw=Date.now()-t0;
console.log("The city");
t("1  Builds quickly (phone friendly)",tw<1500,tw+" ms");
t("2  Big: about 200 x 200 with lots of buildings, cars and trees",W.S>=200&&W.blds.length>80&&W.rects.filter(r=>r.k==="car").length>40&&W.circs.filter(c=>c.k==="tree").length>40,`${W.blds.length} buildings, ${W.rects.filter(r=>r.k==="car").length} cars, ${W.circs.filter(c=>c.k==="tree").length} trees`);
{let free=0,reach=0;for(let i=0;i<W.nav.b.length;i++)if(!W.nav.b[i]){free++;if(W.reach[i]<65535)reach++}t("3  Almost every open space can be reached (no sealed-off spots)",reach/free>.97,(reach/free*100).toFixed(1)+"%")}
t("4  Same code = same city on both phones",JSON.stringify(Z.ztWorld(12345).rects.slice(0,40))===JSON.stringify(W.rects.slice(0,40))&&JSON.stringify(Z.ztWorld(999).rects.slice(0,5))!==JSON.stringify(W.rects.slice(0,5)));
const mk=(o)=>Z.ztGame({W,seed:12345,dur:o.dur||120,players:o.players||[{id:"X",name:"YOU"},{id:"O",name:"DAD"}],z:o.z||"O"});
const run=(G,inp,secs)=>{const ev=[];for(let i=0;i<secs*60;i++)ev.push(...Z.ztStep(G,typeof inp==="function"?inp(G,i):inp,1/60));return ev};
console.log("Moving");
{const G=mk({});G.t=0;const e=G.ents[0];e.fx.frozen=0;const sp=(mx,mz,spr)=>{e.x=37;e.z=101;e.vx=e.vz=0;e.st=1;e.tired=0;for(let i=0;i<60;i++)Z.ztMove(G,e,{mx,mz,sprint:spr},1/60);return e.sp};
 const a=sp(1,0),b=sp(.7071,.7071),c=sp(0,-1);t("5  Same speed straight or diagonal",Math.abs(a-b)<.05&&Math.abs(a-c)<.05,[a,b,c].map(v=>v.toFixed(2)).join(" "));
 const w=sp(.3,0),r=sp(1,0),s=sp(1,0,true);t("6  Small push walks, full push runs, SPRINT is fastest",w<2.2&&r>3.8&&r<4.2&&s>5.6,[w,r,s].map(v=>v.toFixed(2)).join(" / "));
 const d=Z.ztSnap(.9,.3);t("7  Goes exactly the way the thumb points (not snapped)",Math.abs(d.x-.9/Math.hypot(.9,.3))<1e-9);
 e.yaw=0;e.ta=0;Z.ztMove(G,e,{mx:-1,mz:0},1/60);t("8  Turns smoothly to face the way it's going (no snapping)",Math.abs(e.yaw)>0&&Math.abs(e.yaw)<.4,e.yaw.toFixed(3))}
{const G=mk({});G.t=0;const e=G.ents[0];e.fx.frozen=0;e.x=37;e.z=101;e.st=1;let n=0;while(!e.tired&&n<1000){Z.ztMove(G,e,{mx:1,mz:0,sprint:true},1/60);n++}
 t("9  Sprint bar runs out after about 3.5 s of sprinting",Math.abs(n/60-ZT.drain)<.3,(n/60).toFixed(2)+" s");const before=e.sp;for(let i=0;i<30;i++)Z.ztMove(G,e,{mx:1,mz:0,sprint:true},1/60);t("10 ...then you can only run until it fills a bit",e.sp<4.3,e.sp.toFixed(2));
 let m=0;while(e.st<.999&&m<2000){Z.ztMove(G,e,{},1/60);m++}t("11 ...and it fills back up in about 5 s",Math.abs(m/60-ZT.refill)<.6,(m/60).toFixed(2)+" s")}
{const G=mk({players:[{id:"X",name:"C",kid:1,stK:1.3,mul:1.07},{id:"O",name:"D"}]});G.t=0;const c=G.ents[0],d=G.ents[1];for(const e of [c,d]){e.fx.frozen=0;e.st=1;e.x=37;e.z=101}let a=0,b=0;
 while(!c.tired){Z.ztMove(G,c,{mx:1,mz:0,sprint:true},1/60);a++}while(!d.tired){Z.ztMove(G,d,{mx:1,mz:0,sprint:true},1/60);b++}t("12 Cass's sprint lasts longer than Dad's (hidden)",a>b*1.2,(a/60).toFixed(1)+" s v "+(b/60).toFixed(1)+" s")}
{const G=mk({});const e=G.ents[0];e.fx.frozen=0;let inside=0;const B=W.blds[10];e.x=B.x0-2;e.z=(B.z0+B.z1)/2;for(let i=0;i<300;i++){Z.ztMove(G,e,{mx:1,mz:0,sprint:true},1/60);if(e.x>B.x0+.05&&e.x<B.x1-.05&&e.z>B.z0+.05&&e.z<B.z1-.05)inside++}
 t("13 You can't run through buildings",inside===0,"x "+e.x.toFixed(2)+" wall "+B.x0);let slide=Math.abs(e.z-(B.z0+B.z1)/2);e.x=B.x0-.6;e.z=(B.z0+B.z1)/2;const z0=e.z;for(let i=0;i<60;i++)Z.ztMove(G,e,{mx:.7071,mz:.7071},1/60);t("14 ...you slide along the wall instead of sticking",e.z-z0>1.5,(e.z-z0).toFixed(2))}
console.log("The bite");
const pair=()=>{const G=mk({z:"O"});G.t=0;const H=G.ents[0],Zm=G.ents[1];for(const e of G.ents){e.fx.frozen=0;e.fx.immune=0}H.x=69;H.z=101;Zm.x=66;Zm.z=101;return{G,H,Zm}};
{const {G,H,Zm}=pair();const ev=run(G,(G,i)=>({O:{mx:1,mz:0,sprint:true}}),1);const tg=ev.find(e=>e.k==="tag");
 t("15 Zombie touches human: they SWAP (human turns zombie, zombie turns human)",tg&&H.role==="z"&&Zm.role==="h",JSON.stringify(tg));
 t("16 Only ever one zombie",G.ents.filter(e=>e.role==="z").length===1);
 t("17 HEAD START: the new zombie has to wait 3 s before it can move; the one who got away can run straight away",H.fx.frozen>2.8&&Zm.fx.frozen<.7&&Zm.fx.immune>H.fx.frozen,H.fx.frozen.toFixed(2)+" / "+Zm.fx.frozen.toFixed(2));
 {const G2=mk({z:"O"});G2.t=0;const a=G2.ents[0],b=G2.ents[1];for(const e of G2.ents){e.fx.frozen=0;e.fx.immune=0}a.x=69;a.z=101;b.x=68.5;b.z=101;Z.ztStep(G2,{},1/60);const x0=b.x;run(G2,{X:{mx:-1,mz:0},O:{mx:1,mz:0,sprint:true}},3.6);
  t("17b ...so after 3.6 s the runner is well away (about 10 steps)",Math.abs(b.x-a.x)>8,(b.x-a.x).toFixed(1)+" apart")}
 /* new zombie tries to bite straight back */const before=G.nTag;H.x=Zm.x+.5;H.z=Zm.z;run(G,{X:{mx:-1,mz:0}},4);t("18 ...and no instant tag-backs, even standing right next to them",G.nTag===before,G.nTag+" tags")}
{const {G,H,Zm}=pair();H.fx.shield=1;const ev=run(G,{O:{mx:1,mz:0,sprint:true}},1);t("19 A SHIELD blocks one bite (and knocks the zombie dizzy)",ev.some(e=>e.k==="block")&&H.role==="h"&&Zm.role==="z"&&H.fx.shield===0&&ev.find(e=>e.k==="block"),"")
 t("20 ...the zombie is pushed back and stunned",Zm.fx.stun>0||Math.hypot(Zm.x-H.x,Zm.z-H.z)>1.5,Zm.fx.stun.toFixed(2));G.cool=0;Zm.fx.stun=0;H.fx.immune=0;Zm.x=H.x-.4;Zm.z=H.z;const ev2=Z.ztStep(G,{},1/60);t("21 ...but only once",ev2.some(e=>e.k==="tag"),JSON.stringify(ev2))}
{const {G,H,Zm}=pair();H.x=Zm.x+1.25;H.z=Zm.z;const Hk=Z.ztPerson({id:"C",kid:1});const a=Z.ztTagR(Zm,H),b=Z.ztTagR({...Zm,kid:1,sc:.88},{...H,sc:1}),c=Z.ztTagR(Zm,{...H,kid:1,sc:.88});
 t("22 Cass is a bit harder to catch and a bit better at catching (hidden)",c<a&&b>a,[a,b,c].map(v=>v.toFixed(2)).join(" "))}
console.log("Pickups");
{const G=mk({});t("23 Lots of pickups round the city, all where you can reach",G.picks.length>=20&&G.picks.every(p=>!Z.ztHit(W,p.x,p.z,1)&&W.reach[Z.ztNi(W,p.x,p.z)]<65535));
 const types=new Set();for(let s=0;s<30;s++)for(let i=0;i<22;i++)types.add(Z.ztPickAt(G,i,s).type);t("24 Eight kinds: shield, energy, rocket shoes, banana, gum, brains, ghost, mystery box",types.size===8,[...types].join(","));
 const e=G.ents[0];G.t=0;e.fx.frozen=0;const p=G.picks[0];p.type="shield";e.x=p.x;e.z=p.z;const ev=[];Z.ztPickups(G,e,ev);t("25 Walk over a shield: you've got it (one use)",e.fx.shield===1&&!p.on&&ev[0].type==="shield");
 G.t+=ZT.respawn+.1;Z.ztRespawn(G);t("26 A new pickup appears somewhere else 10 s later",G.picks[0].on&&G.picks[0].s===1&&(G.picks[0].x!==p.x||G.picks[0].z!==p.z));
 const zz=G.ents[1];zz.role="z";const q={...G.picks[1],type:"shield",on:1};G.picks[1]=q;zz.x=q.x;zz.z=q.z;Z.ztPickups(G,zz,[]);t("27 Zombies can't pick up shields (brains are for zombies)",q.on===1&&!zz.fx.shield);
 e.fx.energy=0;e.st=.1;Z.ztGive(G,e,"energy");t("28 Energy fills the sprint bar",e.st===1&&e.fx.energy>0)}
{const G=mk({});G.t=0;const a=G.ents[0],b=G.ents[1];for(const e of G.ents){e.fx.frozen=0;e.fx.immune=0}a.item="banana";a.x=101;a.z=37;a.yaw=Math.PI/2;b.x=95;b.z=37;b.role="h";
 const ev=[];Z.ztUseItem(G,a,ev);t("29 BANANA: tap to drop it behind you",G.bananas.length===1&&G.bananas[0].x<a.x&&!a.item);G.t+=1;b.x=G.bananas[0].x-.5;b.z=G.bananas[0].z;const ev2=[];Z.ztSlips(G,b,ev2);
 t("30 ...whoever else steps on it slips over (stunned)",b.fx.stun>1&&G.bananas.length===0&&ev2[0].k==="slip")}
console.log("A whole game");
{const G=mk({dur:60,z:"O"});const ev=run(G,{},64);const end=ev.find(e=>e.k==="end");t("31 When the time runs out (after a 3-2-1 start), the zombie loses",G.over===1&&end&&end.loser==="O",JSON.stringify(end))}
{let tags=0,bad=0,inWalls=0;for(const seed of [1,2,3]){const G=Z.ztGame({seed,dur:120,players:[{id:"A",name:"A",bot:1},{id:"B",name:"B",bot:1},{id:"C",name:"C",bot:1},{id:"D",name:"D",bot:1}],z:"A"});
  for(let i=0;i<120*60;i++){const inp={};for(const e of G.ents)inp[e.id]=Z.ztBotInput(G,e,1/60);const ev=Z.ztStep(G,inp,1/60);tags+=ev.filter(e=>e.k==="tag").length;
    if(G.ents.filter(e=>e.role==="z").length!==1)bad++;for(const e of G.ents){if(!isFinite(e.x)||!isFinite(e.z))bad++;if(Z.ztHit(G.W,e.x,e.z,ZT.r*e.sc*.6))inWalls++}}}
 t("32 Computer players really play: the zombie catches people, people run (3 games of 2 min)",tags>=3&&tags<60,tags+" bites");t("33 Never 0 or 2 zombies, never broken numbers",bad===0,bad);t("34 Nobody ever ends up inside a wall",inWalls===0,inWalls)}
{/* a human bot running away from a zombie bot lasts a while, but a standing human gets caught fast */const G=Z.ztGame({W,seed:12345,dur:200,players:[{id:"H",name:"H",bot:1},{id:"Z",name:"Z",bot:1}],z:"Z"});G.t=0;for(const e of G.ents)e.fx.frozen=0;
 let t1=null;for(let i=0;i<90*60&&t1===null;i++){const ev=Z.ztStep(G,{Z:Z.ztBotInput(G,G.ents[1],1/60)},1/60);if(ev.some(e=>e.k==="tag"))t1=G.t}t("35 The zombie bot finds and catches someone who stands still",t1!==null&&t1<45,t1&&t1.toFixed(1)+" s")}
console.log("Z-O-M-B-I-E letters, prize boxes, gum, people in the street");
{const G=mk({z:"O"});G.t=1;const H=G.ents[0],Zm=G.ents[1];for(const e of G.ents){e.fx.frozen=0}
 t("36 Six letters Z O M B I E spread right round the city, all reachable",G.letters.map(L=>L.ch).join("")==="ZOMBIE"&&G.letters.every(L=>!Z.ztHit(W,L.x,L.z,1)&&W.reach[Z.ztNi(W,L.x,L.z)]<65535)&&Math.max(...G.letters.map(L=>L.x))-Math.min(...G.letters.map(L=>L.x))>80);
 const L0=G.letters[0];Zm.x=L0.x;Zm.z=L0.z;const e0=[];Z.ztLetters(G,Zm,e0);t("37 The zombie can't pick letters up",!L0.by&&!e0.length);
 H.x=L0.x;H.z=L0.z;const e1=[];Z.ztLetters(G,H,e1);t("38 A human picks one up, and it's gone for everyone else",L0.by==="X"&&e1[0].ch==="Z"&&H.letters===1);
 const G2=mk({z:"O"});G2.t=1;const h2=G2.ents[0];let ev=[];for(const L of G2.letters){h2.x=L.x;h2.z=L.z;h2.fx.frozen=0;ev=ev.concat(Z.ztStep(G2,{},1/60));if(G2.over)break}
 const end=ev.find(e=>e.k==="end");t("39 Spell all of ZOMBIE = you WIN straight away",end&&end.winner==="X"&&end.why==="letters"&&G2.over===1,JSON.stringify(end))}
{const G=mk({});G.t=1;const H=G.ents[0];H.fx.frozen=0;t("40 Three prize boxes per game (coin / card / coin wheel)",G.boxes.length===3&&G.boxes.every(b=>["coin","card","wheel"].includes(b.prize)));
 const b=G.boxes[0];H.x=b.x;H.z=b.z;const ev=[];Z.ztBoxes(G,H,ev);Z.ztBoxes(G,H,ev);t("41 Grab a box: you get its prize, once",ev.length===1&&ev[0].prize===b.prize&&b.by==="X");
 const bot=Z.ztPerson({id:"b",bot:1});bot.x=G.boxes[1].x;bot.z=G.boxes[1].z;const G3=mk({players:[{id:"X"},{id:"b",bot:1}],z:"b"});G3.t=1;G3.ents[1].x=G3.boxes[1].x;G3.ents[1].z=G3.boxes[1].z;G3.ents[1].fx.frozen=0;Z.ztStep(G3,{},1/60);t("42 Computer players leave the prize boxes for you",!G3.boxes[1].by);const L=G3.letters[2];G3.ents[1].role="h";G3.ents[1].x=L.x;G3.ents[1].z=L.z;Z.ztStep(G3,{},1/60);t("42b ...and the letters too",!L.by)}
{const G=mk({z:"O"});G.t=1;const H=G.ents[0],Zm=G.ents[1];for(const e of G.ents){e.fx.frozen=0;e.fx.immune=0}H.item="gum";H.x=101;H.z=37;H.yaw=Math.PI/2;Zm.x=60;Zm.z=60;const ev=[];Z.ztUseItem(G,H,ev);
 t("43 GUM: tap to drop it behind you",G.bananas.length===1&&G.bananas[0].k==="gum");G.t+=1;const g0=G.bananas[0];H.x=g0.x;H.z=g0.z;const e2=[];Z.ztSlips(G,H,e2);t("44 ...humans walk over it fine",!e2.length&&G.bananas.length===1);
 Zm.x=g0.x-.3;Zm.z=g0.z;const e3=[];Z.ztSlips(G,Zm,e3);t("45 ...the zombie gets stuck in it for a couple of seconds",e3[0]&&e3[0].k==="stuck"&&Zm.fx.stuck>2);const x0=Zm.x;Z.ztMove(G,Zm,{mx:1,mz:0,sprint:true},1);t("46 ...and can't move while stuck",Math.abs(Zm.x-x0)<.01);
 const zz=G.ents[1];const G4=mk({z:"O"});const zz4=G4.ents[1];zz4.role="z";t("47 Only humans can collect gum",!Z.ztCanGet(zz4,"gum")&&Z.ztCanGet(G4.ents[0],"gum"))}
{const G=mk({z:"O"});G.t=5;const H=G.ents[0],Zm=G.ents[1];for(const e of G.ents){e.fx.frozen=0;e.fx.immune=0}
 t("48 People walk round the blocks (12 of them)",G.npcs.length===12);const n=G.npcs[0];Z.ztNpcLoopAt(n,5);const a=[n.x,n.z];Z.ztNpcLoopAt(n,7);t("49 ...walking along (worked out from the clock, so both phones agree)",Math.hypot(n.x-a[0],n.z-a[1])>1.5);
 Z.ztNpcLoopAt(n,G.t);Zm.x=n.x+.5;Zm.z=n.z;H.x=5;H.z=5;const ev=[];Z.ztNpcStep(G,1/60,ev,{convert:true,grab:G.ents});t("50 The zombie bites one: it turns into a little zombie",n.role==="z"&&ev[0]&&ev[0].k==="npcbite");
 H.x=n.x+2;H.z=n.z;H.fx.slow=0;let grab=null;for(let i=0;i<120&&!grab;i++){const e=[];Z.ztNpcStep(G,1/60,e,{convert:false,grab:G.ents});grab=e.find(q=>q.k==="grab")}
 t("51 ...it shuffles after humans and grabs them (slows them, can't bite)",grab&&H.fx.slow>1&&H.role==="h",grab&&JSON.stringify(grab));
 G.t+=31;const e2=[];Z.ztNpcStep(G,1/60,e2,{});t("52 ...and turns back into a person after 30 s",n.role==="h"&&e2.some(q=>q.k==="npcfree"))}
console.log(`\n${pass} passed, ${fail} failed`);if(fail)process.exit(1);
