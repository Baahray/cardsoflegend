/* ===================== BOOM TOWN: the rules and the physics (no drawing) =====================
   Wobbleton's empty old houses are made of physics blocks; you knock them down with a cannon.
   World: the cannon sits at the origin and fires along +z; houses stand around z = WB.dist; y is up. Units are metres.
   The physics engine (cannon.js) is passed in as C so the game and the tests share this code. */
const WB={densK:3,dist:22,pitch:.34,vmin:11,vmax:31,yawMax:.42,step:1/60,settle:7,flat:.8,muzzle:[0,1.35,1.3]};

/* ---------------- what things are made of ---------------- */
/* dens: kg per cubic metre (scaled), fric/rest: friction and bounciness, brk: how hard a hit has to be to break it (0 = never), bits: what it breaks into */
const WB_MAT={
  grass:{dens:0,fric:.9,rest:.05},
  straw:{dens:.06,fric:.55,rest:.05,col:0xe8c55a},
  wood:{dens:.55,fric:.7,rest:.05,col:0xb07a45},
  plank:{dens:.5,fric:.7,rest:.05,col:0xc99358},
  brick:{dens:1.5,fric:.85,rest:.02,col:0xc0563a},
  roof:{dens:.8,fric:.8,rest:.03,col:0x9b2f2f},
  ginger:{dens:.7,fric:.75,rest:.03,brk:6.5,bits:2,col:0xb8743a},
  icing:{dens:.5,fric:.6,rest:.05,brk:5,bits:2,col:0xfafafa},
  candy:{dens:.4,fric:.6,rest:.2,col:0xff4fa3},
  ice:{dens:.9,fric:.02,rest:.1,brk:7,bits:2,col:0xbfe8ff},
  sand:{dens:1.1,fric:.95,rest:0,brk:2.6,bits:2,col:0xe6c98a},
  jelly:{dens:.5,fric:.5,rest:.9,col:0x7dff5a,wobble:1},
  trunk:{dens:.75,fric:.9,rest:.02,col:0x6b4426},
  leaf:{dens:.12,fric:.8,rest:.05,col:0x4caf50},
  stone:{dens:1.9,fric:.85,rest:.02,col:0x8d8a94},
  haunt:{dens:1.2,fric:.8,rest:.02,col:0x5a4a78},
  slate:{dens:1,fric:.8,rest:.02,col:0x2e2a3a},
  glass:{dens:.4,fric:.4,rest:.05,brk:3,bits:2,col:0x9fe3ff},
  gold:{dens:3,fric:.8,rest:.02,col:0xffc93a},
  crumb:{dens:.7,fric:.85,rest:.03},
  ball:{dens:0,fric:.4,rest:.15},bowl:{dens:0,fric:.15,rest:.05},bouncy:{dens:0,fric:.5,rest:.95},melon:{dens:0,fric:.6,rest:.05},chicken:{dens:0,fric:.5,rest:.6},mallow:{dens:0,fric:.95,rest:0},mega:{dens:0,fric:.5,rest:.05}};

/* ---------------- things to shoot ---------------- */
const WB_AMMO=[
  {k:"ball",name:"CANNONBALL",icon:"⚫",r:.38,mass:5,vk:1,unlock:0,say:"BOOM!"},
  {k:"bowl",name:"BOWLING BALL",icon:"🎳",r:.55,mass:11,vk:.92,unlock:1,say:"STRIKE!",rolls:1},
  {k:"bouncy",name:"BOUNCY BALL",icon:"🔴",r:.45,mass:2.2,vk:1.05,unlock:2,say:"BOING!"},
  {k:"melon",name:"WATERMELON",icon:"🍉",r:.5,mass:6,vk:.95,unlock:3,say:"SPLAT!",splat:1},
  {k:"chicken",name:"RUBBER CHICKEN",icon:"🐔",r:.3,mass:2,vk:1.1,unlock:4,say:"BAWK!",chicken:1},
  {k:"mallow",name:"GIANT MARSHMALLOW",icon:"☁️",r:.55,mass:3,vk:.95,unlock:5,say:"SPLODGE!",sticky:1},
  {k:"mega",name:"MEGA BALL",icon:"🌑",r:1.3,mass:70,vk:.62,unlock:8,cost:300,say:"MEGA!!"}];

/* ---------------- the houses of Wobbleton ---------------- */
/* a house is a list of blocks {t, x,y,z (centre), w,h,d, ry (turned round y)} */
const WB_LEVELS=[
  {k:"straw",name:"STRAW HOUSE",icon:"🌾",par:1,easy:1,tip:"One good shot and it's gone!"},
  {k:"brick",name:"BRICK HOUSE",icon:"🧱",par:2,tip:"Hit it low, where it holds up the rest"},
  {k:"ginger",name:"GINGERBREAD HOUSE",icon:"🍪",par:2,tip:"It crumbles into cookie bits"},
  {k:"igloo",name:"IGLOO",icon:"🧊",par:3,tip:"Slippery ice — it slides and shatters"},
  {k:"sand",name:"SANDCASTLE",icon:"🏰",par:3,tip:"Crumbles into a pile of sand"},
  {k:"jelly",name:"JELLY HOUSE",icon:"🍮",par:4,tip:"Wobbly! Soft shots bounce back — fire hard!"},
  {k:"tree",name:"TREEHOUSE",icon:"🌳",par:3,tip:"Knock the tree down first!"},
  {k:"boss",name:"HAUNTED MANSION",icon:"👻",par:6,tip:"The big one. It'll take a lot of shots!",boss:1}];
function wbHouse(k,D=WB.dist){const B=[],b=(t,x,y,z,w,h,d,ry)=>B.push({t,x:+x.toFixed(3),y:+y.toFixed(3),z:+(z+D).toFixed(3),w,h,d,ry:ry||0});
  /* a rectangular wall-ring of blocks, rows of bh high; alternate rows offset so it holds together like real bricks */
  const ring=(t,W,Dp,rows,bw,bh,bt,y0=0,door=0)=>{for(let r=0;r<rows;r++){const y=y0+bh*(r+.5),off=(r%2)*bw/2;
      for(let x=-W/2+bw/2-off;x<W/2-bw/2+.01;x+=bw){if(x<-W/2+bw/2-.01)continue;if(door&&r<door&&Math.abs(x)<bw*.9)continue;b(t,x,y,-Dp/2+bt/2,bw,bh,bt);b(t,x,y,Dp/2-bt/2,bw,bh,bt)}
      for(let z=-Dp/2+bt+bw/2-off;z<Dp/2-bt-bw/2+.01;z+=bw){if(z<-Dp/2+bt+bw/2-.01)continue;b(t,-W/2+bt/2,y,z,bt,bh,bw);b(t,W/2-bt/2,y,z,bt,bh,bw)}}return y0+rows*bh};
  /* a stepped roof: rows of slabs getting narrower */
  const roof=(t,W,Dp,y0,steps,sh,inset)=>{let y=y0;for(let s=0;s<steps;s++){const w=W-s*inset*2;if(w<.4)break;b(t,0,y+sh/2,0,w,sh,Dp);y+=sh}return y};
  if(k==="straw"){/* bales of straw, a little hut */const top=ring("straw",3.6,2.4,3,1.2,.6,.6,0,2);roof("straw",4,2.8,top,4,.35,.5)}
  else if(k==="brick"){const top=ring("brick",4.8,3.6,7,.8,.4,.4,0,3);b("plank",0,top+.08,0,4.9,.16,3.7);roof("roof",5.2,3.9,top+.16,4,.4,.55);b("brick",1.4,top+1.85,.6,.5,.9,.5)}
  else if(k==="ginger"){const top=ring("ginger",3.8,3,4,.95,.6,.45,0,2);roof("icing",4.3,3.4,top,3,.3,.55);for(const [x,z] of [[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]])b("candy",x,.25,z+(z<0?-.3:.3),.5,.5,.5)}
  else if(k==="igloo"){/* rings of ice blocks getting smaller towards the top */const rows=[[2.3,14],[2.2,13],[2.0,12],[1.75,10],[1.45,8],[1.05,6],[.6,4]];let y=.25;
    rows.forEach(([r,n],ri)=>{for(let i=0;i<n;i++){const a=(i+(ri%2)*.5)/n*Math.PI*2;if(ri<2&&Math.abs(Math.sin(a))<.25&&Math.cos(a)<0)continue;const cw=2*Math.PI*r/n;b("ice",Math.sin(a)*r,y,Math.cos(a)*r,cw*.96,.5,.5,a)}y+=.5});
    b("ice",0,y+.25,0,.8,.5,.8);for(const z of [-2.7,-3.3])for(const x of [-.6,.6])b("ice",x,.25,z,.4,.5,.55);b("ice",0,.7,-3,1.6,.4,1.3)}
  else if(k==="sand"){/* walls, four towers and a keep, all of sand */const sq=.6;ring("sand",3.1,3.1,3,sq*1.5,sq,sq,0);
    for(const [x,z] of [[-2,-2],[2,-2],[-2,2],[2,2]]){for(let r=0;r<5;r++)b("sand",x,sq*(r+.5),z,.9,sq,.9);b("sand",x,sq*5+.2,z,.5,.4,.5)}
    for(let r=0;r<4;r++)b("sand",0,sq*(r+.5),0,1.4,sq,1.4);b("sand",0,sq*4+.25,0,.7,.5,.7)}
  else if(k==="jelly"){/* big wobbly cubes in jelly colours */for(let r=0;r<3;r++)for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){if(r<2&&i===0&&j===0)continue;b("jelly",i*1.02,r*1.02+.51,j*1.02,1,1,1)}
    for(let i=-.5;i<=.5;i++)for(let j=-.5;j<=.5;j++)b("jelly",i*1.02,3.57,j*1.02,1,1,1);b("jelly",0,4.59,0,1,1,1)}
  else if(k==="tree"){/* a thick tree trunk with a little wooden house balanced on top */for(let r=0;r<5;r++)b("trunk",0,.55+r*1.1,0,1.15,1.1,1.15);const p=5.5;
    b("plank",0,p+.1,0,3.4,.2,3.4);for(const [x,z] of [[-1.4,0],[1.4,0]])for(let r=0;r<3;r++)b("wood",x,p+.2+.3+r*.6,z,.4,.6,2.4);for(let r=0;r<3;r++){b("wood",0,p+.2+.3+r*.6,-1.4,2.4,.6,.4)}
    roof("roof",3.6,3.4,p+2,2,.3,.6);for(const x of [-1.25,1.25])b("leaf",x,p+.6,1.3,.8,.8,.8)}
  else if(k==="boss"){/* the haunted mansion: a big main house, two spooky towers and a gatehouse — each has to be knocked down on its own */
    let y=ring("haunt",5.4,4.2,5,.9,.6,.5,0,3);b("slate",0,y+.1,0,5.5,.2,4.3);y=ring("haunt",4.6,3.6,4,.9,.6,.5,y+.2);b("slate",0,y+.1,0,4.7,.2,3.7);roof("slate",5,3.9,y+.2,4,.4,.6);
    for(const x of [-5.6,5.6]){for(let r=0;r<10;r++)b("stone",x,.4+r*.8,1.2,1.5,.8,1.5);b("slate",x,8.15,1.2,1.7,.3,1.7);b("slate",x,8.5,1.2,1.1,.4,1.1);b("slate",x,8.9,1.2,.5,.4,.5)}
    for(const x of [-2.4,2.4])for(let r=0;r<4;r++)b("stone",x,.4+r*.8,-4.6,.9,.8,.9);b("slate",0,3.4,-4.6,5.8,.4,1)}
  return B}
const wbBlocksOf=k=>wbHouse(k);

/* ---------------- a house you built (cubes on a 7 x 7 plot) ---------------- */
const WB_BUILD={size:7,maxH:9,budget:45,price:{straw:1,wood:2,brick:3,stone:4,ice:3,jelly:4,glass:2,gold:10}};
function wbFromBuild(cells,D=WB.dist){const half=(WB_BUILD.size-1)/2;return cells.map(([t,gx,gy,gz])=>({t,x:gx-half,y:gy+.5,z:gz-half+D,w:.99,h:.99,d:.99,ry:0}))}
const wbBuildCost=cells=>cells.reduce((a,c)=>a+(WB_BUILD.price[c[0]]||1),0);
/* can this block go here? on the ground or on top of another block, inside the plot, not in the same spot */
function wbCanPlace(cells,gx,gy,gz){const n=WB_BUILD.size;if(gx<0||gz<0||gx>=n||gz>=n||gy<0||gy>=WB_BUILD.maxH)return false;if(cells.some(c=>c[1]===gx&&c[2]===gy&&c[3]===gz))return false;
  return gy===0||cells.some(c=>c[1]===gx&&c[2]===gy-1&&c[3]===gz)}

/* ---------------- the physics world ---------------- */
function wbWorld(C,blocks,o={}){const W=new C.World();W.gravity.set(0,-9.82,0);W.broadphase=new C.SAPBroadphase(W);W.solver.iterations=o.iter||14;W.solver.tolerance=.0005;W.allowSleep=true;
  W.quatNormalizeFast=true;W.quatNormalizeSkip=2;const mats={},M=k=>mats[k]||(mats[k]=new C.Material(k));W.wbMats=mats;
  /* friction and bounce for every pair of materials (the slipperier and the bouncier one wins) */const ks=Object.keys(WB_MAT);
  for(let i=0;i<ks.length;i++)for(let j=i;j<ks.length;j++){const a=WB_MAT[ks[i]],b=WB_MAT[ks[j]];W.addContactMaterial(new C.ContactMaterial(M(ks[i]),M(ks[j]),{friction:Math.min(a.fric,b.fric),restitution:Math.max(a.rest,b.rest),contactEquationStiffness:1e7,contactEquationRelaxation:4}))}
  const ground=new C.Body({mass:0,material:M("grass")});ground.addShape(new C.Plane());ground.quaternion.setFromAxisAngle(new C.Vec3(1,0,0),-Math.PI/2);W.addBody(ground);W.wbGround=ground;
  const G={C,W,mats:M,bodies:[],blocks:[],ball:null,balls:[],t:0,ev:[],queue:[],shots:0,coins:0,down:0,boss:!!o.boss,easy:!!o.easy,crumbs:0};
  for(const s of blocks)wbAddBlock(G,s,1);return G}
function wbAddBlock(G,s,orig){const C=G.C,m=WB_MAT[s.t]||WB_MAT.wood,mass=Math.max(.05,m.dens*WB.densK*s.w*s.h*s.d),b=new C.Body({mass,material:G.mats(s.t)});
  b.addShape(new C.Box(new C.Vec3(s.w/2,s.h/2,s.d/2)));b.position.set(s.x,s.y,s.z);if(s.ry)b.quaternion.setFromAxisAngle(new C.Vec3(0,1,0),s.ry);b.linearDamping=.03;b.angularDamping=.08;
  b.sleepSpeedLimit=.12;b.sleepTimeLimit=.5;b.wb={s,orig:!!orig,i:G.blocks.length,y0:s.y,x0:s.x,z0:s.z,h:s.h,down:0,mat:s.t,born:G.t};
  if(m.brk)b.addEventListener("collide",e=>{if(G.t<.6||b.wb.gone||!b.wb.orig&&!b.wb.canBreak)return;const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>m.brk)G.queue.push({k:"break",b,v})});
  if(m.wobble)b.addEventListener("collide",e=>{const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>1.5){b.wb.wob=Math.min(1,v/8);b.wb.wobT=G.t}});
  G.W.addBody(b);G.bodies.push(b);G.blocks.push(b);return b}
/* let the house settle before you start (so it doesn't fall down by itself); then remember where everything is */
function wbSettle(G,secs=1.2){for(let i=0;i<secs*60;i++)wbStep(G,WB.step,true);for(const b of G.blocks){const w=b.wb;w.y0=b.position.y;w.x0=b.position.x;w.z0=b.position.z;w.q0=b.quaternion.clone();b.sleep()}G.t=0;G.ev=[]}

/* ---------------- firing ---------------- */
function wbAim(power,yaw,ammo){const a=WB_AMMO.find(q=>q.k===ammo)||WB_AMMO[0],v=(WB.vmin+(WB.vmax-WB.vmin)*Math.max(0,Math.min(1,power)))*a.vk,p=WB.pitch,y=Math.max(-WB.yawMax,Math.min(WB.yawMax,yaw));
  const sx=Math.sin(y),cz=Math.cos(y),m=WB.muzzle;return{x:m[0]+sx*m[2],y:m[1],z:m[2]*cz,vx:sx*Math.cos(p)*v,vy:Math.sin(p)*v,vz:cz*Math.cos(p)*v,a}}
/* the path the shot will take (for the aiming dots); stops at the ground */
function wbArc(power,yaw,ammo,n=40,dt=.06){const s=wbAim(power,yaw,ammo),P=[];let x=s.x,y=s.y,z=s.z,vx=s.vx,vy=s.vy,vz=s.vz;for(let i=0;i<n;i++){P.push([x,y,z]);x+=vx*dt;y+=vy*dt;z+=vz*dt;vy-=9.82*dt;if(y<0)break}return P}
function wbFire(G,power,yaw,ammo){const C=G.C,s=wbAim(power,yaw,ammo),a=s.a,b=new C.Body({mass:a.mass,material:G.mats(a.k)});
  if(a.chicken){/* a long floppy body with a head */b.addShape(new C.Box(new C.Vec3(.17,.17,.5)));b.addShape(new C.Sphere(.2),new C.Vec3(0,.12,.62));b.angularVelocity.set(6,2,0)}
  else b.addShape(new C.Sphere(a.r));
  b.position.set(s.x,s.y+(a.r>1?a.r-.3:0),s.z);b.velocity.set(s.vx,s.vy,s.vz);b.linearDamping=a.rolls?.02:.04;b.angularDamping=a.rolls?.05:.2;b.sleepSpeedLimit=.15;b.sleepTimeLimit=.6;
  b.wbBall={a,t0:G.t,hit:0,stuck:0};
  b.addEventListener("collide",e=>{const o=e.body===b?e.target:e.body;const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v<1)return;
    G.ev.push({k:"thud",v,ammo:a.k,x:b.position.x,y:b.position.y,z:b.position.z,on:o&&o.wb?o.wb.mat:"grass"});
    if(a.splat&&!b.wbBall.hit&&v>4)G.queue.push({k:"splat",b});
    if(a.sticky&&!b.wbBall.stuck&&o&&o.wb)G.queue.push({k:"stick",b,o});
    if(o&&o.wb)b.wbBall.hit=1});
  G.W.addBody(b);G.balls.push(b);G.ball=b;G.shots++;G.fireT=G.t;G.ev.push({k:"fire",ammo:a.k,power,yaw});
  /* wake the house up so it can fall */for(const q of G.blocks)q.wakeUp();return b}

/* ---------------- one step of the world ---------------- */
function wbStep(G,dt,quiet){const C=G.C;G.W.step(WB.step,dt,4);G.t+=dt;
  /* things that happen after a hit: breaking, splatting, sticking */
  const Q=G.queue.splice(0);for(const q of Q){
    if(q.k==="break"&&!q.b.wb.gone)wbBreak(G,q.b,q.v);
    else if(q.k==="splat"&&!q.b.wbBall.hit2){q.b.wbBall.hit2=1;wbSplat(G,q.b)}
    else if(q.k==="stick"&&!q.b.wbBall.stuck&&!q.o.wb.gone){q.b.wbBall.stuck=1;const c=new C.LockConstraint(q.b,q.o);G.W.addConstraint(c);q.b.wbBall.con=c;G.ev.push({k:"stick",x:q.b.position.x,y:q.b.position.y,z:q.b.position.z})}}
  if(!quiet)wbCount(G);
  /* tidy: balls and bits that fell off the world */for(const b of G.balls)if(!b.wbGone&&(b.position.y<-5||Math.abs(b.position.x)>80||b.position.z>90||b.position.z<-20)){b.wbGone=1;G.W.removeBody(b)}}
/* a breakable block shatters into smaller bits (cookie crumbs, ice shards, sand) */
function wbBreak(G,b,v){const s=b.wb.s,m=WB_MAT[b.wb.mat],n=m.bits||2;b.wb.gone=1;b.wb.down=b.wb.down||1;G.W.removeBody(b);const C=G.C,q=b.quaternion,p=b.position;
  const bw=s.w/n,bh=s.h/n,bd=s.d/n;const pieces=[];if(G.crumbs>320)return G.ev.push({k:"break",mat:b.wb.mat,x:p.x,y:p.y,z:p.z,n:0});
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){const lp=new C.Vec3((i+.5)*bw-s.w/2,(j+.5)*bh-s.h/2,(k+.5)*bd-s.d/2),wp=q.vmult(lp).vadd(p);
    const nb=wbAddBlock(G,{t:b.wb.mat,x:wp.x,y:wp.y,z:wp.z,w:bw*.96,h:bh*.96,d:bd*.96,ry:0},0);nb.quaternion.copy(q);nb.velocity.copy(b.velocity).vadd(new C.Vec3((Math.random()-.5)*v*.3,Math.random()*v*.2,(Math.random()-.5)*v*.3),nb.velocity);
    nb.wb.crumb=1;nb.wb.down=1;G.crumbs++;pieces.push(nb)}
  G.ev.push({k:"break",mat:b.wb.mat,x:p.x,y:p.y,z:p.z,n:pieces.length})}
/* the watermelon goes SPLAT: it's gone, chunks fly */
function wbSplat(G,b){const C=G.C,p=b.position;b.wbGone=1;G.W.removeBody(b);for(let i=0;i<7;i++){const nb=wbAddBlock(G,{t:"crumb",x:p.x+(Math.random()-.5)*.4,y:p.y+(Math.random()-.2)*.4,z:p.z+(Math.random()-.5)*.4,w:.25,h:.18,d:.3,ry:Math.random()*3},0);
    nb.wb.melon=i%3?1:2;nb.wb.down=1;nb.velocity.set(b.velocity.x*.3+(Math.random()-.5)*6,2+Math.random()*4,b.velocity.z*.3+(Math.random()-.5)*6)}G.ev.push({k:"splat",x:p.x,y:p.y,z:p.z})}
/* how much of the house is down: a block is down once it has dropped, slid away, tipped over or broken */
function wbIsDown(b){const w=b.wb;if(w.gone)return true;const p=b.position,dy=w.y0-p.y,dh=Math.hypot(p.x-w.x0,p.z-w.z0);if(dy>Math.max(.45,w.h*.7)||dh>1.4)return true;
  if(w.q0){const d=Math.abs(w.q0.x*b.quaternion.x+w.q0.y*b.quaternion.y+w.q0.z*b.quaternion.z+w.q0.w*b.quaternion.w);if(d<.82)return true}return false}
/* how much is knocked down: the blocks that fell, and how low what's still standing is (the bottom row lying where it was doesn't count as standing) */
function wbCount(G){let n=0,tot=0,top=0;for(const b of G.blocks){if(!b.wb.orig)continue;tot++;if(b.wb.down!==2&&wbIsDown(b)){b.wb.down=2;const v=G.boss?2:1;G.coins+=v;const p=b.position;G.ev.push({k:"coin",v,x:p.x,y:p.y,z:p.z})}
    if(b.wb.down===2)n++;else top=Math.max(top,b.position.y+b.wb.h/2)}
  if(G.h0==null){let h=0;for(const b of G.blocks)if(b.wb.orig)h=Math.max(h,b.wb.y0+b.wb.h/2);G.h0=h}
  const low=Math.max(1,G.h0*.18),hk=Math.max(0,Math.min(1,(G.h0-top)/Math.max(.1,G.h0-low)));G.fell=tot?n/tot:0;G.down=Math.max(G.fell,hk);G.top=top;G.total=tot;return G.down}
/* has everything stopped moving? (then the shot is over) */
function wbSettled(G){if(G.fireT==null)return true;const since=G.t-G.fireT;if(since>WB.settle)return true;if(since<1.2)return false;
  for(const b of G.bodies.concat(G.balls)){if(b.wbGone||(b.wb&&b.wb.gone))continue;if(b.world&&b.sleepState!==2&&b.velocity.length()>.6)return false}return true}
const wbFlat=G=>G.down>=(G.easy?.85:.999)||G.fell>=(G.boss?.75:WB.flat);
/* stars: as few shots as possible */
function wbStars(level,shots){const p=WB_LEVELS[level]?WB_LEVELS[level].par:3;return shots<=p?3:shots<=p+2?2:1}
/* who wins a build-for-each-other round: the house that took more shots to knock flat (if it was never flattened, it took the most) */
function wbDuelWinner(a,b){const sa=a.flat?a.shots:99,sb=b.flat?b.shots:99;return sa===sb?null:sa>sb?"a":"b"}
if(typeof module!=="undefined")module.exports={WB,WB_MAT,WB_AMMO,WB_LEVELS,WB_BUILD,wbHouse,wbFromBuild,wbBuildCost,wbCanPlace,wbWorld,wbAddBlock,wbSettle,wbAim,wbArc,wbFire,wbStep,wbBreak,wbSplat,wbIsDown,wbCount,wbSettled,wbFlat,wbStars,wbDuelWinner};
