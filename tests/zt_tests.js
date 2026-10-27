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
 const types=new Set();for(let s=0;s<30;s++)for(let i=0;i<22;i++)types.add(Z.ztPickAt(G,i,s).type);t("24 Nine kinds: shield, energy, rocket shoes, banana, gum, brains, ghost, zombie call, mystery box",types.size===9,[...types].join(","));
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
console.log("TEAM UP");
const team=(o={})=>{const G=Z.ztGame({W:Z.ztWorld(4321),seed:4321,mode:"team",dur:o.dur??120,players:[{id:"X",name:"DAD"},{id:"O",name:"CASS",kid:1,mul:1.07,stK:1.3}]});G.t=5;G.ents.forEach(e=>e.fx.frozen=0);return G};
{const G=team();t("53 Team: Dad and Cass are both human, against 2 computer zombies, 5 hearts",G.ents.filter(e=>e.role==="h").map(e=>e.id).join()==="X,O"&&Z.ztZombies(G).length===2&&Z.ztHearts(G)===5);
 const [X,O,Z1]=G.ents;X.fx.immune=0;Z1.x=X.x+.5;Z1.z=X.z;const ev=[];Z.ztTagCheck(G,ev);t("54 A zombie bite costs a heart, no swapping",ev[0]&&ev[0].k==="hit"&&Z.ztHearts(G)===4&&X.role==="h"&&Z1.role==="z");
 const ev2=[];Z.ztTagCheck(G,ev2);t("55 ...then a few seconds safe",!ev2.length&&X.fx.immune>2)}
{const G=team();const n=G.npcs[0];Z.ztNpcLoopAt(n,G.t);const Z1=G.ents[2];Z1.x=n.x+.4;Z1.z=n.z;const X=G.ents[0];X.x=n.x+2.5;X.z=n.z;X.fx.immune=0;const ev=[];Z.ztNpcStep(G,1/60,ev,{convert:true,grab:G.ents});
 t("56 Team: zombies turn the people in the street",n.role==="z");G.t+=40;const e2=[];Z.ztNpcStep(G,1/60,e2,{convert:false,grab:G.ents});t("57 ...and they STAY zombies",n.role==="z");
 Z1.x=5;Z1.z=5;G.ents[3].x=5;G.ents[3].z=8;let hit=null;for(let i=0;i<180&&!hit;i++){const e=[];Z.ztNpcStep(G,1/60,e,{convert:false,grab:G.ents});hit=e.find(q=>q.k==="hit")}t("58 ...and they chase and bite (a heart each)",hit&&Z.ztHearts(G)===4,JSON.stringify(hit))}
{const G=team();const [X,O]=G.ents;let ev=[];G.letters.forEach((L,i)=>{const p=i%2?O:X;p.x=L.x;p.z=L.z;ev=ev.concat(Z.ztStep(G,{},1/60))});const end=ev.find(e=>e.k==="end");
 t("59 Team: you share the letters; spell ZOMBIE together and the team wins",end&&end.team&&end.why==="letters"&&Z.ztLetterCount(G,"X")===3&&Z.ztLetterCount(G,"O")===3,JSON.stringify(end))}
{const G=team();G.hits.X=5;const ev=Z.ztStep(G,{},1/60);t("60 Team: lose all 5 hearts = game over",ev.some(e=>e.k==="end"&&e.lost))}
{const G=team({dur:10});const ev=[];for(let i=0;i<6*60;i++)ev.push(...Z.ztStep(G,{X:{},O:{}},1/60));t("61 Team: still going when the time runs out = you survived (win)",ev.some(e=>e.k==="end"&&e.survived))}
{const G=Z.ztGame({W,seed:12345,dur:0,players:[{id:"X"},{id:"O"}],z:"O"});t("62 Unlimited time: no clock",G.dur===Infinity);G.t=5000;const ev=Z.ztStep(G,{},1/60);t("63 ...it only ends with letters (or hearts in team)",!ev.some(e=>e.k==="end"))}
console.log("ZOMBIE CALL (the horde)");
{const G=mk({z:"O"});G.t=5;const [H,Zm]=G.ents;H.fx.frozen=Zm.fx.frozen=0;H.fx.immune=0;t("64 Only the zombie can pick up the Zombie Call",!Z.ztCanGet(H,"horn")&&Z.ztCanGet(Zm,"horn"));
 Zm.item="horn";Zm.x=H.x+40;Zm.z=H.z;const ev=[];Z.ztUseItem(G,Zm,ev);const Hd=G.horde;t("65 Tap it: a horde of well over 100 zombies",Hd&&Hd.list.length>=120,Hd&&Hd.list.length);
 const ang=new Set(Hd.list.map(m=>Math.floor((Math.atan2(m.x-H.x,m.z-H.z)+Math.PI)/(Math.PI/4))));t("66 ...coming in from all sides, starting well away",ang.size===8&&Hd.list.every(m=>Math.hypot(m.x-H.x,m.z-H.z)>25),ang.size);
 t("67 ...about 10% slower than the zombie",Math.abs(Z.ZT_HORDE.spd/(Z.ZT.run*Z.ZT.zfast)-.9)<.01);
 const before=Hd.list.reduce((a,m)=>a+Math.hypot(m.x-H.x,m.z-H.z),0)/Hd.list.length;for(let i=0;i<300;i++){H.fx.immune=99;Z.ztHordeStep(G,1/60,[],{bite:[]});G.t+=1/60}const after=Hd.list.reduce((a,m)=>a+Math.hypot(m.x-H.x,m.z-H.z),0)/Hd.list.length;
 t("68 ...and they close in on the human",after<before-8,before.toFixed(0)+" -> "+after.toFixed(0));
 H.fx.immune=0;const m=Hd.list.find(q=>!q.down);m.x=H.x+.5;m.z=H.z;const zx=Zm.x;const e2=[];G.cool=0;Z.ztHordeStep(G,1/60,e2,{bite:[H]});t("69 A horde zombie catching the human counts as the zombie's bite (they swap)",e2.some(q=>q.k==="tag")&&H.role==="z"&&Zm.role==="h"&&Zm.x===zx);
 G.t=Hd.until+2;Z.ztHordeStep(G,1/60,[],{});t("70 ...after a minute the horde is gone",!G.horde)}
{const G=team();G.ents[2].x=G.ents[0].x+40;const Zm=G.ents[2];Z.ztHordeCall(G,Zm);const X=G.ents[0];X.fx.immune=0;const m=G.horde.list[0];m.x=X.x+.4;m.z=X.z;const ev=[];Z.ztHordeStep(G,1/60,ev,{bite:G.ents});t("71 Team: the horde's bites cost hearts",ev.some(q=>q.k==="hit")&&Z.ztHearts(G)===4)}
console.log("CARS");
{const G=mk({z:"O"});G.t=5;const [H,Zm]=G.ents;H.fx.frozen=Zm.fx.frozen=0;H.fx.immune=0;
 t("72 Six special cars round town",G.cars.length===6&&new Set(G.cars.map(c=>Math.floor(c.x/68)+","+Math.floor(c.z/101))).size>=5);
 const c=G.cars[0];Zm.x=c.x+1.5;Zm.z=c.z;t("73 Zombies can't drive",!Z.ztCarNear(G,Zm));H.x=c.x+1.6;H.z=c.z;const ev=[];Z.ztCarToggle(G,H,ev);t("74 A human walks up and gets in",H.car===0&&ev[0].k==="carin");
 const x0=c.x,z0=c.z;let mx=0;for(let i=0;i<120;i++){Z.ztMove(G,H,{mx:Math.sin(c.yaw),mz:Math.cos(c.yaw)},1/60);mx=Math.max(mx,c.sp)}t("75 It drives (fast!)",Math.hypot(c.x-x0,c.z-z0)>6&&mx>7,mx.toFixed(1));
 Zm.x=H.x+.5;Zm.z=H.z;G.cool=0;const e2=[];Z.ztTagCheck(G,e2);t("76 Nobody can bite you in a car",!e2.length&&H.role==="h");
 Zm.x=c.x+Math.sin(c.yaw)*1.2;Zm.z=c.z+Math.cos(c.yaw)*1.2;c.sp=8;const e3=[];Z.ztRam(G,H,e3);t("77 Ram the zombie: it's knocked dizzy",e3.some(q=>q.k==="ram")&&Zm.fx.stun>1.5);
 Z.ztHordeCall(G,Zm);const m=G.horde.list[0];m.x=c.x+.5;m.z=c.z;c.sp=8;const e4=[];Z.ztRam(G,H,e4);t("78 Ram the horde: bowled over",m.down>0);
 c.left=.01;Z.ztMove(G,H,{},1/30);const e5=Z.ztStep(G,{},1/60);t("79 After a minute it kicks you out (and that car is done)",H.car==null&&c.used===1&&!Z.ztCarNear(G,H),"")}
{const G=team();const X=G.ents[0];const c=G.cars[1];X.x=c.x+1.5;X.z=c.z;X.fx.frozen=0;Z.ztCarToggle(G,X,[]);for(let i=0;i<90*30;i++)Z.ztMove(G,X,{mx:0,mz:0},1/30);
 t("80 Team Up: drive as long as you like (still in after 90 s)",X.car===1);Z.ztCarExit(G,X,[]);X.fx.frozen=0;X.fx.stun=0;t("81 ...and hop back in whenever you want",!!Z.ztCarNear(G,X)&&c.used===0)}
{const G=mk({});const e=G.ents[0];e.fx.frozen=0;const x=e.x;Z.ztMove(G,e,{mx:1,mz:0},0);Z.ztNpcStep(G,0,[],{});t("82 A frame with no time in it can't break anyone's position",isFinite(e.x)&&isFinite(e.vx)&&e.x===x&&G.npcs.every(n=>isFinite(n.x)))}

console.log("TEAM UP 2: the big city, two seats, the crossbow, the boss");
const BW=Z.ztWorld(777,true);
const big=(o={})=>{const G=Z.ztGame({W:BW,seed:777,mode:"team",dur:o.dur??300,players:o.players||[{id:"X",name:"DAD"},{id:"O",name:"CASS",kid:1,mul:1.07,stK:1.3}]});G.t=5;G.ents.forEach(e=>e.fx.frozen=0);return G};
{let free=0,reach=0;for(let i=0;i<BW.nav.b.length;i++)if(!BW.nav.b[i]){free++;if(BW.reach[i]<65535)reach++}
 t("85 Team Up city is much bigger, with a river and bridges",BW.S>=260&&BW.bridges.length>=3&&BW.blds.length>100&&reach/free>.97,`${BW.S} wide, ${BW.bridges.length} bridges, ${(reach/free*100).toFixed(1)}% reachable`)}
{const r=BW.river,nb=[...Array(9).keys()].find(k=>!Z.ZT_RIVER.bridges.includes(k)),x=nb*Z.ZT.P+5,br=Z.ZT_RIVER.bridges[1]*Z.ZT.P+5,mz=(r[1]+r[3])/2;
 t("86 The river can only be crossed on a bridge",Z.ztHit(BW,x,mz,.4)&&!Z.ztHit(BW,br,mz,.4)&&BW.reach[Z.ztNi(BW,x,r[1]-3)]<65535&&BW.reach[Z.ztNi(BW,x,r[3]+3)]<65535)}
{const sh=BW.shelters,ok=sh.filter(s=>{let any=false;for(let x=Math.ceil(s.x0);x<s.x1-1;x++)for(let z=Math.ceil(s.z0);z<s.z1-1;z++)if(BW.reach[Z.ztNi(BW,x+.5,z+.5)]<65535)any=true;return any});
 t("87 Buildings you can go inside, spread round town (all reachable through a door)",sh.length>=6&&ok.length===sh.length&&sh.every(s=>s.door),sh.length+" shelters")}
{const G=big(),[X]=G.ents,Zb=G.ents.find(e=>e.bot),s=BW.shelters.find(q=>!q.garage),cx=(s.x0+s.x1)/2,cz=(s.z0+s.z1)/2;
 let spot=null;for(let i=0;i<200&&!spot;i++){const x=s.x0+1+((i*7)%10)/10*(s.x1-s.x0-2),z=s.z0+1+((i*3)%10)/10*(s.z1-s.z0-2);if(!Z.ztHit(BW,x,z,.5))spot=[x,z]}
 X.x=spot[0];X.z=spot[1];G.ents[1].x=10;G.ents[1].z=10;G.ents[1].fx.immune=99;Z.ztMove(G,X,{},1/60);Zb.x=X.x+(s.out[0]||.3)*12;Zb.z=X.z+(s.out[1]||.3)*12;Z.ztCollide(BW,Zb,.5);
 const inp=Z.ztBotInput(G,Zb,1/60),dx=X.x-Zb.x,dz=X.z-Zb.z,toward=(inp.mx||0)*dx+(inp.mz||0)*dz;
 t("88 Hide inside: the zombies lose track of you",X.hid&&!(Zb.B&&Zb.B.tgt==="X"),JSON.stringify(inp));
 for(let i=0;i<16*60;i++)Z.ztMove(G,X,{},1/60);t("89 ...but after 15 seconds they smell you",!X.hid)}
{const G=big(),J=G.cars.find(c=>c.jeep),g=BW.shelters.find(q=>q.garage);
 t("90 A tough jeep is hidden in a garage",J&&g&&J.x>g.x0&&J.x<g.x1&&J.z>g.z0&&J.z<g.z1&&J.max>=2*G.cars[0].max&&BW.reach[Z.ztNi(BW,J.x+g.out[0]*6,J.z+g.out[1]*6)]<65535)
 /* drive it out of the garage */const X=G.ents[0];X.x=J.x+1;X.z=J.z;Z.ztCarToggle(G,X,[]);for(let i=0;i<120;i++)Z.ztMove(G,X,{mx:g.out[0],mz:g.out[1]},1/60);
 t("91 ...and it drives out of the garage",X.car===J.i&&(J.x<g.x0||J.x>g.x1||J.z<g.z0||J.z>g.z1),J.x.toFixed(1)+","+J.z.toFixed(1))}
{const G=big(),[X,O]=G.ents;const c=G.cars[0];X.x=c.x+1.5;X.z=c.z;Z.ztCarToggle(G,X,[]);c.yaw=0;for(let i=0;i<120;i++)Z.ztMove(G,X,{mx:0,mz:1},1/60);
 const sp0=c.sp;let n=0;while(Math.abs(Z.ztWrap(c.yaw-Math.PI/2))>.1&&n<120){Z.ztMove(G,X,{mx:1,mz:0},1/60);n++}
 const vy=Math.atan2(c.vx,c.vz);t("92 Steering: snappy (a right-angle turn in about half a second) and no sliding",n/60<.6&&Math.abs(Z.ztWrap(vy-c.yaw))<.05&&sp0>7,(n/60).toFixed(2)+" s")}
{const G=big(),[X,O]=G.ents,c=G.cars[1];c.x=BW.mid;c.z=BW.mid;c.yaw=Math.PI/2;X.x=c.x+1.5;X.z=c.z;O.x=c.x-1.5;O.z=c.z;const ev=[];Z.ztCarToggle(G,X,ev);Z.ztCarToggle(G,O,ev);
 t("93 Two seats: first in drives, the next one rides with the crossbow",c.by==="X"&&c.pas==="O"&&X.seat===0&&O.seat===1);
 for(let i=0;i<60;i++){Z.ztMove(G,X,{mx:1,mz:0},1/60);Z.ztMove(G,O,{mx:-1,mz:0},1/60)}t("94 ...the passenger can't steer, just rides along",O.x===c.x&&O.z===c.z&&c.sp>3);
 Z.ztCarExit(G,X,[]);t("95 Driver gets out: the passenger slides over to drive",c.by==="O"&&!c.pas&&O.seat===0&&X.car==null)}
{const G=big(),X=G.ents[0],Zb=G.ents.find(e=>e.bot),c=G.cars[2];X.x=c.x+1.5;X.z=c.z;Z.ztCarToggle(G,X,[]);c.sp=8;Zb.x=c.x+Math.sin(c.yaw)*2;Zb.z=c.z+Math.cos(c.yaw)*2;Zb.fx.stun=0;const ev=[];Z.ztRam(G,X,ev);
 t("96 Run a zombie over: SPLAT (it's dead) and the car gets a dent",Zb.dead>0&&ev.some(q=>q.k==="kill"&&q.on===Zb.id)&&c.hp===c.max-1&&X.kills===1);
 const t0=G.t;for(let i=0;i<10.5*60;i++)Z.ztStep(G,{},1/60);t("97 ...it comes back later, somewhere far away",!Zb.dead&&Math.hypot(Zb.x-X.x,Zb.z-X.z)>30,Math.hypot(Zb.x-X.x,Zb.z-X.z).toFixed(0)+" away")}
{const G=big(),X=G.ents[0],c=G.cars[3];X.x=c.x+1.5;X.z=c.z;Z.ztCarToggle(G,X,[]);const top=()=>{c.sp=0;c.x=10;c.z=BW.mid;c.yaw=Math.PI/2;for(let i=0;i<150;i++)Z.ztMove(G,X,{mx:1,mz:0},1/60);return c.sp};
 const s1=top();for(let i=0;i<7;i++)Z.ztCarHurt(G,c,1,[]);const s2=top();t("98 About 7 hits: it smokes and slows right down",s2<s1*.7&&!c.dead,s1.toFixed(1)+" -> "+s2.toFixed(1));
 const ev=[];for(let i=0;i<3;i++)Z.ztCarHurt(G,c,1,ev);c.sp=0;const x0=c.x;for(let i=0;i<60;i++)Z.ztMove(G,X,{mx:1,mz:0},1/60);G.ents[1].x=c.x+1.6;G.ents[1].z=c.z;t("99 10 hits: wrecked, it won't drive",c.dead&&ev.some(q=>q.k==="wreck")&&Math.abs(c.x-x0)<.01&&!Z.ztCarNear(G,G.ents[1]))}
{const G=big(),[X,O]=G.ents,Zb=G.ents.find(e=>e.bot),c=G.cars[4];X.x=c.x+1.5;X.z=c.z;O.x=c.x-1.5;O.z=c.z;Z.ztCarToggle(G,X,[]);Z.ztCarToggle(G,O,[]);c.sp=0;
 G.ents.filter(e=>e.bot&&e!==Zb).forEach(e=>{e.x=5;e.z=5});Zb.x=c.x+Math.cos(c.yaw)*1.6;Zb.z=c.z-Math.sin(c.yaw)*1.6;Zb.fx.stun=0;Zb.fx.frozen=0;const ev=[];for(let i=0;i<90;i++)Z.ztCarDanger(G,1/60,ev,{});
 const h0=Z.ztHearts(G);t("100 Zombies at the door of a stopped car claw it (damage)",c.hp<c.max&&ev.some(q=>q.k==="claw"));
 t("101 ...and drag you out (costs a heart)",ev.filter(q=>q.k==="drag").length>=1&&(X.car==null||O.car==null)&&h0===4,Z.ztHearts(G)+" hearts");
 const G2=big(),X2=G2.ents[0],Z2=G2.ents.find(e=>e.bot),c2=G2.cars[4];X2.x=c2.x+1.5;X2.z=c2.z;Z.ztCarToggle(G2,X2,[]);c2.sp=6;Z2.x=c2.x+Math.cos(c2.yaw)*1.6;Z2.z=c2.z-Math.sin(c2.yaw)*1.6;Z2.fx.stun=Z2.fx.frozen=0;const e2=[];for(let i=0;i<120;i++){c2.sp=6;Z.ztCarDanger(G2,1/60,e2,{})}
 t("102 ...but not while you keep moving",X2.car!=null&&!e2.some(q=>q.k==="drag"))}
{const G=big(),[X,O]=G.ents,Zb=G.ents.find(e=>e.bot),c=G.cars[0];X.x=c.x+1.5;X.z=c.z;O.x=c.x-1.5;O.z=c.z;Z.ztCarToggle(G,X,[]);Z.ztCarToggle(G,O,[]);
 Zb.x=c.x+8;Zb.z=c.z;const ev=[];const b0=O.bolts;Z.ztShoot(G,X,Zb.x,Zb.z,null,ev);t("103 The driver can't shoot (eyes on the road)",!ev.length&&X.bolts===b0);
 Z.ztShoot(G,O,Zb.x,Zb.z,null,ev);for(let i=0;i<30;i++)Z.ztBoltStep(G,1/60,ev,{});t("104 The passenger shoots: a bolt flies, the zombie goes SPLAT, one bolt used",ev.some(q=>q.k==="shoot")&&Zb.dead>0&&O.bolts===b0-1&&O.kills===1);
 const e2=[];Z.ztShoot(G,O,Zb.x,Zb.z,null,e2);t("105 ...a short reload between shots",!e2.length);G.t+=1;O.bolts=0;Z.ztShoot(G,O,Zb.x,Zb.z,null,e2);t("106 ...and no bolts = no shooting",!e2.length)}
{const G=big(),X=G.ents[0],Zb=G.ents.find(e=>e.bot);G.ents.filter(e=>e.bot&&e!==Zb).forEach(e=>{e.x=5;e.z=5});X.x=101;X.z=37;Z.ztCollide(BW,X,.5);X.yaw=Math.PI/2;Zb.x=X.x+7;Zb.z=X.z;Z.ztCollide(BW,Zb,.5);
 const a=Z.ztAutoAim(G,X);const ev=[];if(a)Z.ztShoot(G,X,a.x,a.z,a.zone,ev);for(let i=0;i<30;i++)Z.ztBoltStep(G,1/60,ev,{});t("107 On foot: the 🏹 button aims at the nearest zombie for you",a&&Zb.dead>0)}
{const G=big(),X=G.ents[0],s=BW.blds.find(b=>b.x1-b.x0>6&&b.z1-b.z0>6);X.x=s.x0-3;X.z=(s.z0+s.z1)/2;Z.ztCollide(BW,X,.5);const ev=[];G.t=10;Z.ztShoot(G,X,s.x1+5,X.z,null,ev);const b=G.bolts[0];for(let i=0;i<60;i++)Z.ztBoltStep(G,1/60,ev,{});
 t("108 Bolts stop at walls",ev.some(q=>q.k==="thunk")&&!G.bolts.length&&b.x<s.x0+.6)}
{const G=big();const types=new Set(G.picks.map(p=>p.type));const X=G.ents[0],p=G.picks.find(q=>q.type==="bolts");X.x=p.x;X.z=p.z;const b0=X.bolts,ev=[];Z.ztPickups(G,X,ev);
 t("109 Bolts to collect round town (+6 each)",types.has("bolts")&&G.picks.filter(q=>q.type==="bolts").length>=4&&X.bolts===b0+6,G.picks.filter(q=>q.type==="bolts").length+" bolt pickups");
 const G2=big(),[A,B]=G2.ents,c=G2.cars[0],p2=G2.picks.find(q=>q.type==="bolts");A.x=c.x+1.5;A.z=c.z;B.x=c.x-1.5;B.z=c.z;Z.ztCarToggle(G2,A,[]);Z.ztCarToggle(G2,B,[]);c.x=A.x=B.x=p2.x;c.z=A.z=B.z=p2.z;const a0=A.bolts,b1=B.bolts;Z.ztPickups(G2,A,[]);Z.ztPickups(G2,B,[]);
 t("110 ...drive over them and the passenger grabs them",B.bolts===b1+6&&A.bolts===a0)}
{const G=big(),[X]=G.ents,Zm=G.ents.find(e=>e.bot);Z.ztHordeCall(G,Zm);const B=G.boss;
 t("111 When the horde comes, a giant BOSS zombie comes too",!!B&&B.hp===100&&Math.hypot(B.x-X.x,B.z-X.z)>30);
 const c=G.cars[0];X.x=c.x+1.5;X.z=c.z;Z.ztCarToggle(G,X,[]);c.sp=0;B.x=c.x+Math.cos(c.yaw)*2.6;B.z=c.z-Math.sin(c.yaw)*2.6;G.ents.filter(e=>e.bot).forEach(e=>{e.x=5;e.z=5});G.horde.list.forEach(m=>m.down=1);
 const ev=[];let n=0;while(!c.dead&&n<12*60){Z.ztBossStep(G,1/60,ev,{});c.sp=0;n++;G.t+=1/60}t("112 ...two slams wreck a car",c.dead&&ev.filter(q=>q.k==="slam").length===2,ev.filter(q=>q.k==="slam").length+" slams");
 const J=G.cars.find(q=>q.jeep);Z.ztCarExit(G,X,[]);X.x=J.x+1;X.z=J.z;X.fx.immune=0;Z.ztCarToggle(G,X,[]);const e2=[];Z.ztBossSlam(G,J.x,J.z,e2,{});Z.ztBossSlam(G,J.x,J.z,e2,{});t("113 ...the jeep can take more",!J.dead&&J.hp===J.max-10)}
{const mkB=()=>{const G=big();Z.ztHordeCall(G,G.ents.find(e=>e.bot));return G};
 let G=mkB(),ev=[];Z.ztBossHurt(G,"head",ev,"X");t("114 Boss: a bolt in the HEAD kills it",G.boss.dead>0&&ev.some(q=>q.k==="bossdie"));
 G=mkB();Z.ztBossHurt(G,"middle",[],"X");const mid=100-G.boss.hp;G=mkB();Z.ztBossHurt(G,"sides",[],"X");const side=100-G.boss.hp;t("115 ...the MIDDLE does big damage, the SIDES half that",mid===20&&side===10,mid+" / "+side);
 G=mkB();const B=G.boss,X=G.ents[0];X.x=B.x+20;X.z=B.z;X.fx.immune=99;G.ents.filter(e=>e.bot).forEach(e=>{e.x=5;e.z=5});const run=()=>{X.x=B.x+22;X.z=B.z;Z.ztCollide(BW,X,.5);B.st=0;const x0=B.x,z0=B.z;for(let i=0;i<60;i++)Z.ztBossStep(G,1/60,[],{});return Math.hypot(B.x-x0,B.z-z0)};
 run();const v1=run();Z.ztBossHurt(G,"legs",[],"X");const v2=run();t("116 ...the LEGS slow it down for a few seconds",v2<v1*.6&&B.slow>0,v1.toFixed(1)+" -> "+v2.toFixed(1));for(let i=0;i<4*60;i++)Z.ztBossStep(G,1/60,[],{});t("117 ...then it speeds up again",B.slow===0&&run()>v1*.8)}
{t("118 Where the bolt lands on the boss: head / middle / sides / legs",Z.ztBossZone(0,1.9)==="head"&&Z.ztBossZone(.1,1.3)==="middle"&&Z.ztBossZone(.45,1.4)==="sides"&&Z.ztBossZone(.1,.5)==="legs"&&Z.ztBossZone(1.2,1)===null)}
{const G=big();Z.ztHordeCall(G,G.ents.find(e=>e.bot));const h0=Z.ztHearts(G);Z.ztBossHurt(G,"head",[],"X");t("119 Beat the boss: you get a heart back",Z.ztHearts(G)===h0+1);
 const G2=big();Z.ztHordeCall(G2,G2.ents.find(e=>e.bot));G2.t=G2.horde.until+2;const ev=[];Z.ztHordeStep(G2,1/60,ev,{});t("120 ...if you don't, it leaves with the horde",!G2.boss&&ev.some(q=>q.k==="bossgone"))}
{const G=big(),X=G.ents[0],Zb=G.ents.find(e=>e.bot);X.x=101;X.z=37;Z.ztCollide(BW,X,.5);Zb.x=X.x+5;Zb.z=X.z;Z.ztCollide(BW,Zb,.5);Zb.fx.frozen=1;Zb.fx.stun=0;const ev=[];Z.ztKill(G,Zb,ev,X);
 const e2=[];for(let i=0;i<60;i++)Z.ztTagCheck(G,e2);t("121 Dead zombies don't bite",!e2.length)}
{const G=Z.ztGame({seed:4242,mode:"team",dur:150,players:[{id:"me",name:"YOU"}]});const t0=Date.now();let ev=[],bad=0;G.ents.forEach(e=>{if(e.bot)e.react=.3});
 for(let i=0;i<150*60&&!G.over;i++){const inp={};for(const e of G.ents)if(e.bot)inp[e.id]=Z.ztBotInput(G,e,1/60);const me=G.ents[0];me.fx.immune=99;
   if(i===300){Z.ztHordeCall(G,G.ents.find(e=>e.bot))}if(i%40===0){const a=Z.ztAutoAim(G,me);if(a)inp.me={shoot:a}}
   const e=Z.ztStep(G,inp,1/60);ev=ev.concat(e.filter(q=>q.k!=="bowl"));if(G.ents.some(q=>!isFinite(q.x)||!isFinite(q.z))||(G.boss&&!isFinite(G.boss.x)))bad++}
 const ms=Date.now()-t0;t("122 A whole 2½ minute solo Team Up game with the horde and the boss runs smoothly",!bad&&ms<20000&&ev.some(q=>q.k==="slam"||q.k==="bosswind"||q.k==="kill"),ms+" ms, "+ev.filter(q=>q.k==="kill").length+" kills, boss "+(G.boss?G.boss.hp:"gone"))}

console.log("PLAYING ALONE: the computer buddy");
{const G=Z.ztGame({W:BW,seed:777,mode:"team",dur:0,players:[{id:"me",name:"YOU"},{id:"bud",name:"CASS",look:"cass",kid:1,buddy:1,stK:3}]});const [me,bud]=G.ents;
 const step=(f,n)=>{for(let i=0;i<n;i++){const inp={bud:Z.ztBuddyInput(G,bud,1/60),me:typeof f==="function"?f(i):f};me.fx.immune=bud.fx.immune=99;G.ents.filter(e=>e.bot).forEach(e=>{e.x=5;e.z=5;e.fx.frozen=1});Z.ztStep(G,inp,1/60)}};
 step({},4*60);step({mx:1,mz:0},4*60);t("123 Your buddy follows you round",Math.hypot(me.x-bud.x,me.z-bud.z)<5);
 const c=G.cars[0];me.x=c.x+1.5;me.z=c.z;step(i=>i?{}:{drive:true},1);step({},14*60);t("124 You drive: your buddy jumps in beside you",me.seat===0&&bud.car===c.i&&bud.seat===1);
 const zb=G.ents.find(e=>e.bot);step(i=>{zb.x=c.x+8;zb.z=c.z;return{}},1);let shot=false;for(let i=0;i<90&&!shot;i++){const inp={bud:Z.ztBuddyInput(G,bud,1/60)};zb.x=c.x+8;zb.z=c.z;zb.fx.frozen=1;if(inp.bud.shoot)shot=true;Z.ztStep(G,inp,1/60)}
 t("125 ...and shoots the zombies for you",shot);
 step(i=>i?{}:{drive:true},1);step({},20);me.x=c.x+1.6;me.z=c.z;Z.ztCollide(BW,me,.4);me.fx.frozen=me.fx.stun=0;step(i=>i?{}:{drive:true},1);
 t("126 Get out: your buddy takes the wheel; hop back in and YOU ride with the crossbow",me.car===c.i&&me.seat===1&&bud.seat===0);
 const x0=c.x,z0=c.z;step({},10*60);t("127 ...and your buddy drives you round town",Math.hypot(c.x-x0,c.z-z0)>30,Math.hypot(c.x-x0,c.z-z0).toFixed(0)+" away");
 step(i=>i?{}:{drive:true},1);step({},10*60);t("128 You get out for good: your buddy gets out too and follows",bud.car==null&&Math.hypot(me.x-bud.x,me.z-bud.z)<6)}

console.log("THE GRAVEYARD");
{const yard=BW.graveyard[0];t("129 The park at the top of town is a graveyard (headstones, a crypt, railings with gates)",yard&&BW.graves.length>=20&&BW.rects.some(r=>r.k==="crypt")&&BW.rects.filter(r=>r.k==="stone").length===BW.graves.length&&BW.graves.every(g=>BW.reach[Z.ztNi(BW,g.x,g.z)]<65535));
 const G=big(),X=G.ents[0];X.x=BW.mid;X.z=BW.mid+40;Z.ztHordeCall(G,G.ents.find(e=>e.bot));const gz=G.horde.list.filter(m=>m.grave);
 t("130 When the horde comes, zombies climb out of every grave",gz.length===BW.graves.length&&gz.every(m=>m.rise>0));const x0=gz.map(m=>m.x+","+m.z).join();
 for(let i=0;i<150;i++){Z.ztHordeStep(G,1/60,[],{bite:[]});G.t+=1/60}t("131 ...one after another, not all at once",gz.some(m=>m.rise>0)&&gz.some(m=>!(m.rise>0)));
 for(let i=0;i<8*60;i++){X.fx.immune=99;Z.ztHordeStep(G,1/60,[],{bite:[]});G.t+=1/60}t("132 ...then they come after you",gz.filter(m=>Math.hypot(m.x-BW.graves[0].x,m.z-BW.graves[0].z)>6).length>gz.length/2)}

console.log("THE OUTBREAK, DAY AND NIGHT");
{const G=Z.ztGame({seed:4242,mode:"team",dur:0,players:[{id:"me",name:"YOU"}]}),W2=G.W,me=G.ents[0];
 t("133 A BAR, a MALL and a SCHOOL full of people",W2.venues.map(v=>v.kind).join()==="bar,mall,school"&&G.npcs.filter(n=>n.crowd).length>=24);
 t("134 The computer zombies start at them",G.ents.filter(e=>e.bot).every((z,i)=>Math.hypot(z.x-W2.venues[i].dx,z.z-W2.venues[i].dz)<3));
 const seen=[];let d0=null,ev=[];for(let i=0;i<120*60;i++){const inp={};for(const e of G.ents)if(e.bot)inp[e.id]=Z.ztBotInput(G,e,1/60);me.fx.immune=99;ev=ev.concat(Z.ztStep(G,inp,1/60).filter(q=>q.k==="npcbite"));if(i===20*60)seen.push(G.npcs.filter(n=>n.zt!=null).length)}
 const ts=ev.map(q=>q.t);t("135 People get bitten one by one (not all at once) and it spreads",seen[0]>=2&&ev.length>=20&&new Set(ts.map(x=>Math.round(x))).size>=12,seen[0]+" turned at 20 s, "+ev.length+" by 2 min");
 t("136 ...and then the zombies come looking for you",G.npcs.filter(n=>n.zt!=null&&Math.hypot(n.x-me.x,n.z-me.z)<30).length>=3)}
{const G=Z.ztGame({seed:4242,mode:"team",dur:0,players:[{id:"me",name:"YOU"}]});const at=s=>{G.t=s;return Z.ztNight(G)};
 t("137 Day and night: day, dusk, night, dawn, day again (same on both phones: it's the shared clock)",at(30)===0&&at(85)>0&&at(85)<1&&at(120)===1&&at(170)===0);
 G.t=120;const z=G.ents.find(e=>e.bot);z.fx.frozen=0;z.x=10;z.z=G.W.mid;Z.ztCollide(G.W,z,.5);z.vx=z.vz=0;for(let i=0;i<60;i++)Z.ztMove(G,z,{mx:1,mz:0},1/60);const vn=z.sp;G.t=30;z.vx=z.vz=0;for(let i=0;i<60;i++)Z.ztMove(G,z,{mx:1,mz:0},1/60);
 t("138 Zombies are faster at night",vn>z.sp*1.08,vn.toFixed(2)+" vs "+z.sp.toFixed(2))}
console.log(`\n${pass} passed, ${fail} failed`);if(fail)process.exit(1);
