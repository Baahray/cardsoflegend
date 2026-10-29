/* ===================== BOOM TOWN: the rules and the physics (no drawing) =====================
   Wobbleton's empty old houses are made of physics blocks; you knock them down with a cannon.
   World: the cannon sits at the origin and fires along +z; houses stand around z = WB.dist; y is up. Units are metres.
   The physics engine (cannon.js) is passed in as C so the game and the tests share this code. */
const WB={townK:.5,townDown:.5,mortar:60,vshot:34,reload:.45,densK:3,dist:22,pitch:.34,vmin:11,vmax:31,yawMax:.42,step:1/60,settle:7,flat:.8,muzzle:[0,1.35,1.3]};

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
  office:{dens:.35,fric:.6,rest:.03,brk:4.5,bits:2,col:0x9fc6e8},apart:{dens:.5,fric:.7,rest:.02,brk:5,bits:2,col:0xe8c9a6},shopf:{dens:.45,fric:.7,rest:.03,brk:7,bits:2,col:0xf0e0c0},car:{dens:.35,fric:.6,rest:.15,col:0xff4040},metal:{dens:.9,fric:.6,rest:.05,col:0x55585e},
  snow:{dens:.6,fric:.7,rest:.02,brk:5.5,bits:2,col:0xf4fbff},
  sand:{dens:1.1,fric:.95,rest:0,brk:2.6,bits:2,col:0xe6c98a},
  jelly:{dens:.5,fric:.5,rest:.9,col:0x7dff5a,wobble:1},
  trunk:{dens:.75,fric:.9,rest:.02,col:0x6b4426},
  leaf:{dens:.12,fric:.8,rest:.05,col:0x4caf50},
  stone:{dens:1.3,fric:.85,rest:.02,col:0x8d8a94},
  haunt:{dens:1.2,fric:.8,rest:.02,col:0x5a4a78},
  slate:{dens:1,fric:.8,rest:.02,col:0x2e2a3a},
  glass:{dens:.4,fric:.4,rest:.05,brk:2.2,shatter:1,col:0x9fe3ff},
  gold:{dens:3,fric:.8,rest:.02,col:0xffc93a},
  crumb:{dens:.7,fric:.85,rest:.03},
  ball:{dens:0,fric:.4,rest:.15},bowl:{dens:0,fric:.15,rest:.05},bouncy:{dens:0,fric:.5,rest:.95},melon:{dens:0,fric:.6,rest:.05},chicken:{dens:0,fric:.5,rest:.6},mallow:{dens:0,fric:.95,rest:0},mega:{dens:0,fric:.5,rest:.05}};

/* ---------------- things to shoot ---------------- */
/* materials drawn in each building's own colour */
const WB_TINT={office:1,apart:1,shopf:1,car:1};
const WB_AMMO=[
  {k:"ball",name:"CANNONBALL",icon:"⚫",r:.46,mass:10,vk:1,unlock:0,say:"BOOM!",blast:{r:3.8,dv:16}},
  {k:"bowl",name:"BOWLING BALL",icon:"🎳",r:.55,mass:11,vk:.92,unlock:1,say:"STRIKE!",rolls:1},
  {k:"bouncy",name:"BOUNCY BALL",icon:"🔴",r:.45,mass:2.2,vk:1.05,unlock:2,say:"BOING!"},
  {k:"melon",name:"WATERMELON",icon:"🍉",r:.5,mass:6,vk:.95,unlock:3,say:"SPLAT!",splat:1},
  {k:"chicken",name:"RUBBER CHICKEN",icon:"🐔",r:.3,mass:2,vk:1.1,unlock:4,say:"BAWK!",chicken:1},
  {k:"mallow",name:"GIANT MARSHMALLOW",icon:"☁️",r:.55,mass:3,vk:.95,unlock:5,say:"SPLODGE!",sticky:1},
  {k:"mega",name:"MEGA BALL",icon:"🌑",r:1.5,mass:150,vk:.62,unlock:8,cost:300,say:"MEGA!!",blast:{r:5,dv:13}}];

/* ---------------- the houses of Wobbleton ---------------- */
/* a house is a list of blocks {t, x,y,z (centre), w,h,d, ry (turned round y)} */
const WB_LEVELS=[
  {k:"straw",name:"STRAW HOUSE",icon:"🌾",par:1,easy:1,tip:"One good shot and it's gone!"},
  {k:"brick",name:"BRICK HOUSE",icon:"🧱",par:2,tip:"Hit it low, where it holds up the rest"},
  {k:"ginger",name:"GINGERBREAD HOUSE",icon:"🍪",par:2,tip:"It crumbles into cookie bits"},
  {k:"igloo",name:"IGLOO",icon:"🧊",par:3,tip:"Slippery ice — it slides and shatters"},
  {k:"sand",name:"SANDCASTLE",icon:"🏰",par:3,tip:"Crumbles into a pile of sand"},
  {k:"jelly",name:"JELLY HOUSE",icon:"🍮",par:3,tip:"Wobbly! Soft shots bounce back — fire hard!"},
  {k:"tree",name:"TREEHOUSE",icon:"🌳",par:3,tip:"Knock the tree down first!"},
  {k:"boss",name:"HAUNTED MANSION",icon:"👻",par:4,tip:"The big one. It'll take a lot of shots!",boss:1},
  {k:"domino",name:"DOMINO STREET",icon:"🁢",par:2,tip:"Knock the first one over…"},
  {k:"pyramid",name:"SAND PYRAMID",icon:"🔺",par:4,tip:"Chip away at the corners"},
  {k:"jenga",name:"WOBBLY TOWER",icon:"🪵",par:3,tip:"Hit it near the bottom!"},
  {k:"light",name:"LIGHTHOUSE",icon:"🗼",par:2,tip:"Tall and thin — topple it!"},
  {k:"castle",name:"STONE CASTLE",icon:"🏯",par:9,tip:"Thick walls and four towers",boss:1},
  {k:"sky",name:"SKYSCRAPER",icon:"🏢",par:4,tip:"Knock out the bottom floors"},
  {k:"farm",name:"WOBBLY FARM",icon:"🚜",par:6,tip:"Barn, windmill, cottages — flatten the farm!",town:1},
  {k:"village",name:"WOBBLETON VILLAGE",icon:"🏘️",par:7,tip:"Knock down every building in the village!",town:1},
  {k:"seaside",name:"SEASIDE TOWN",icon:"⛵",par:7,tip:"Don't forget the lighthouse!",town:1},
  {k:"candy",name:"CANDY TOWN",icon:"🍭",par:8,tip:"Gingerbread, jelly towers and a candy castle",town:1},
  {k:"snow",name:"SNOWY VILLAGE",icon:"⛄",par:6,tip:"Igloos everywhere — they slide and shatter",town:1},
  {k:"spooky",name:"SPOOKY TOWN",icon:"🎃",par:9,tip:"Haunted houses and a creepy church",town:1},
  {k:"market",name:"MARKET TOWN",icon:"🏪",par:13,tip:"A whole high street, a church and a clock tower!",town:1},
  {k:"city",name:"BIG CITY",icon:"🏙️",par:14,tip:"Skyscrapers! Hit them low to topple them",town:1},
  {k:"mega",name:"MEGA CITY",icon:"🌆",par:20,tip:"The biggest city of all. Good luck!",town:1}];
function wbHouse(k,D=WB.dist){if(typeof WB_TOWNS!=="undefined"&&WB_TOWNS[k])return wbTown(k);const B=[];let OX=0,OZ=0;const b=(t,x,y,z,w,h,d,ry)=>B.push({t,x:+(x+OX).toFixed(3),y:+y.toFixed(3),z:+(z+D+OZ).toFixed(3),w,h,d,ry:ry||0});
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
  else if(k==="domino"){/* a long row of dominoes going away from the cannon */for(let i=0;i<14;i++)b(i%2?"candy":"wood",0,1.2,-6+i*.92,1.6,2.4,.26)}
  else if(k==="pyramid"){let y=0;for(let n=5;n>=1;n--){for(let i=0;i<n;i++)for(let j=0;j<n;j++)b("sand",(i-(n-1)/2)*1.02,y+.4,(j-(n-1)/2)*1.02,1,.8,1);y+=.8}}
  else if(k==="jenga"){for(let l=0;l<14;l++){const y=.2+l*.4;for(let i=-1;i<=1;i++){if(l%2)b("plank",i*1,y,0,.95,.4,3);else b("plank",0,y,i*1,3,.4,.95)}}}
  else if(k==="light"){let y=0;for(let r=0;r<12;r++)y=ring(r%4<2?"brick":"icing",2.4,2.4,1,.8,.55,.5,y);b("slate",0,y+.1,0,2.8,.2,2.8);y+=.2;for(const [x,z] of [[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]])b("glass",x,y+.45,z,.6,.9,.6);b("gold",0,y+.45,0,.7,.7,.7);roof("roof",2.6,2.6,y+.9,3,.3,.4)}
  else if(k==="castle"){const top=ring("stone",6.6,5,3,1,.7,.5,0,2);for(const [x,z] of [[-4,-3.2],[4,-3.2],[-4,3.2],[4,3.2]]){for(let r=0;r<6;r++)b("stone",x,.35+r*.7,z,1.2,.7,1.2);b("slate",x,4.2+.2,z,1.4,.4,1.4)}
    let y=ring("stone",2.6,2.4,4,.9,.7,.5,0);b("slate",0,y+.1,0,2.8,.2,2.6);roof("roof",2.8,2.6,y+.2,3,.35,.45);for(const x of [-2.6,-.9,.9,2.6])b("stone",x,top+.25,-2.5+.3,.6,.5,.6)}
  else if(k==="sky"){let y=0;for(let f=0;f<8;f++){for(const [x,z] of [[-1.05,-1.05],[1.05,-1.05],[-1.05,1.05],[1.05,1.05]])b("stone",x,y+.6,z,.5,1.2,.5);b("glass",0,y+.6,-1.05,1.5,1.1,.12);b("glass",0,y+.6,1.05,1.5,1.1,.12);b("slate",0,y+1.3,0,2.7,.2,2.7);y+=1.4}b("gold",0,y+.4,0,.8,.8,.8)}
  else if(k==="village"){/* six little houses of all kinds, spread round the yard */const H=(ox,oz,f)=>{OX=ox;OZ=oz;f();OX=0;OZ=0};
    H(-5.2,-2.5,()=>{const t=ring("straw",2.6,2.2,3,1,.55,.5,0,2);roof("straw",2.9,2.5,t,3,.3,.4)});
    H(0,-3.5,()=>{const t=ring("brick",3,2.4,6,.75,.4,.4,0,3);b("plank",0,t+.08,0,3.1,.16,2.5);roof("roof",3.3,2.7,t+.16,3,.35,.45)});
    H(5.2,-2.5,()=>{const t=ring("wood",2.6,2.4,5,.9,.45,.4,0,3);roof("roof",2.9,2.7,t,3,.35,.4)});
    H(-4.6,3.8,()=>{const t=ring("ginger",2.6,2.2,4,.85,.5,.4,0,2);roof("icing",2.9,2.5,t,2,.3,.45)});
    H(.3,4.2,()=>{for(let r=0;r<7;r++)b("stone",0,.35+r*.7,0,1.3,.7,1.3);b("slate",0,5.1,0,1.6,.4,1.6);b("slate",0,5.5,0,.9,.4,.9)});
    H(4.8,4,()=>{const t=ring("ice",2.4,2.2,4,.8,.5,.4,0,2);b("ice",0,t+.15,0,2.5,.3,2.3)})}
  return B}
const wbBlocksOf=k=>wbHouse(k);

/* ---------------- a house you built (cubes on a 7 x 7 plot) ---------------- */
const WB_BUILD={size:13,maxH:24,max:1500,price:{office:3,apart:3,car:2,straw:1,wood:2,plank:2,brick:3,stone:4,slate:3,roof:3,sand:2,ginger:3,candy:3,icing:2,ice:3,glass:2,jelly:4,leaf:1,haunt:4,trunk:3,gold:10}};
function wbFromBuild(cells,D=WB.dist){const half=(WB_BUILD.size-1)/2;return cells.map(([t,gx,gy,gz])=>({t,x:gx-half,y:gy+.5,z:gz-half+D,w:.99,h:.99,d:.99,ry:0,g:[gx,gy,gz]}))}
const wbBuildCost=cells=>cells.reduce((a,c)=>a+(WB_BUILD.price[c[0]]||1),0);
/* can this block go here? on the ground, or touching another block (on top, underneath or on any side), inside the plot, not in the same spot */
function wbCanPlace(cells,gx,gy,gz){const n=WB_BUILD.size;if(gx<0||gz<0||gx>=n||gz>=n||gy<0||gy>=WB_BUILD.maxH)return false;if(cells.some(c=>c[1]===gx&&c[2]===gy&&c[3]===gz))return false;
  return gy===0||cells.some(c=>Math.abs(c[1]-gx)+Math.abs(c[2]-gy)+Math.abs(c[3]-gz)===1)}

/* ---------------- the physics world ---------------- */
/* the physics engine's "who might be touching whom" check looked at every pair of sleeping blocks (very slow for a whole city);
   this version stops looking as soon as blocks are too far apart along the sorting direction */
/* …and it remembered touching pairs in a table the size of (blocks x blocks), cleared every step; a small list is much quicker */
const wbCM=()=>({s:new Set(),get(a,b){let i=a.id,j=b.id;if(j>i){const t=i;i=j;j=t}return this.s.has(i*4194304+j)},set(a,b,v){let i=a.id,j=b.id;if(j>i){const t=i;i=j;j=t}if(v)this.s.add(i*4194304+j);else this.s.delete(i*4194304+j)},reset(){this.s.clear()},setNumObjects(){}});
function wbFastSAP(C){if(C.SAPBroadphase.prototype.wbFast)return;C.SAPBroadphase.prototype.wbFast=1;
  C.SAPBroadphase.prototype.collisionPairs=function(world,p1,p2){const bodies=this.axisList,N=bodies.length,ax=this.axisIndex;if(this.dirty){this.sortList();this.dirty=false}
    for(let i=0;i!==N;i++){const bi=bodies[i];for(let j=i+1;j<N;j++){const bj=bodies[j];if(!C.SAPBroadphase.checkBounds(bi,bj,ax))break;if(!this.needBroadphaseCollision(bi,bj))continue;this.intersectionTest(bi,bj,p1,p2)}}}}
function wbWorld(C,blocks,o={}){wbFastSAP(C);const W=new C.World();W.gravity.set(0,-9.82,0);W.broadphase=new C.SAPBroadphase(W);W.broadphase.axisIndex=2;W.collisionMatrix=wbCM();W.collisionMatrixPrevious=wbCM();W.solver.iterations=o.iter||14;W.solver.tolerance=.0005;W.allowSleep=true;
  W.quatNormalizeFast=true;W.quatNormalizeSkip=2;const mats={},M=k=>mats[k]||(mats[k]=new C.Material(k));W.wbMats=mats;
  /* friction and bounce for every pair of materials (the slipperier and the bouncier one wins) */const ks=Object.keys(WB_MAT);
  for(let i=0;i<ks.length;i++)for(let j=i;j<ks.length;j++){const a=WB_MAT[ks[i]],b=WB_MAT[ks[j]];W.addContactMaterial(new C.ContactMaterial(M(ks[i]),M(ks[j]),{friction:Math.min(a.fric,b.fric),restitution:Math.max(a.rest,b.rest),contactEquationStiffness:1e7,contactEquationRelaxation:4}))}
  const ground=new C.Body({mass:0,material:M("grass")});ground.addShape(new C.Plane());ground.quaternion.setFromAxisAngle(new C.Vec3(1,0,0),-Math.PI/2);W.addBody(ground);W.wbGround=ground;
  const G={C,W,mats:M,bodies:[],blocks:[],ball:null,balls:[],t:0,ev:[],queue:[],shots:0,coins:0,down:0,boss:!!o.boss,easy:!!o.easy,crumbs:0};
  for(const s of blocks)wbAddBlock(G,s,1);
  /* built houses: blocks touching each other are stuck together with "mortar", so things can stick out sideways; a hard hit snaps it */
  G.mortar=[];if(blocks.some(s=>s.g)){const at={};for(const b of G.blocks)if(b.wb.s.g)at[b.wb.s.g.join(",")]=b;
    /* only where it's needed: a block with nothing under it is stuck to every block it touches, and the blocks holding it up are stuck down to the ground */
    const done=new Set(),K=(x,y,z)=>at[x+","+y+","+z],glue=(b,o)=>{const key=Math.min(b.id,o.id)+"_"+Math.max(b.id,o.id);if(done.has(key))return;done.add(key);
      const c=new C.LockConstraint(b,o,{maxForce:WB.mortar*(b.mass+o.mass)});W.addConstraint(c);G.mortar.push({c,a:b,b:o,d:b.position.distanceTo(o.position)})};
    for(const b of G.blocks){const g=b.wb.s.g;if(!g||g[1]===0||K(g[0],g[1]-1,g[2]))continue;for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const o=K(g[0]+dx,g[1]+dy,g[2]+dz);if(!o)continue;glue(b,o);
      let q=o,h=o.wb.s.g;while(h[1]>0){const u=K(h[0],h[1]-1,h[2]);if(!u)break;glue(q,u);q=u;h=u.wb.s.g}}}
    /* a hard knock shakes the mortar loose round about */for(const b of G.blocks)if(b.wb.s.g)b.addEventListener("collide",e=>{if(G.t<.3||!G.mortar.length)return;const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>5)G.queue.push({k:"unglue",p:b.position.clone(),r:Math.min(1.4,.18*v)})})}
  return G}
function wbAddBlock(G,s,orig){const C=G.C,m=WB_MAT[s.t]||WB_MAT.wood,mass=Math.max(.05,m.dens*WB.densK*s.w*s.h*s.d*(s.bld!=null&&s.bld>=-1?WB.townK:1)),b=new C.Body({mass,material:G.mats(s.t)});
  b.addShape(new C.Box(new C.Vec3(s.w/2,s.h/2,s.d/2)));b.position.set(s.x,s.y,s.z);if(s.ry)b.quaternion.setFromAxisAngle(new C.Vec3(0,1,0),s.ry);b.linearDamping=.03;b.angularDamping=.08;
  b.sleepSpeedLimit=.12;b.sleepTimeLimit=.5;b.wb={s,orig:!!orig,i:G.blocks.length,y0:s.y,x0:s.x,z0:s.z,h:s.h,down:0,mat:s.t,born:G.t};
  if(m.brk)b.addEventListener("collide",e=>{if(G.t<.6||b.wb.gone||!b.wb.orig&&!b.wb.canBreak)return;const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>m.brk)G.queue.push({k:"break",b,v})});
  if(m.shatter)b.addEventListener("collide",e=>{if(G.t<.6||b.wb.gone||b.wb.cracked)return;const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>.9&&v<=m.brk){b.wb.cracked=1;G.ev.push({k:"crack",x:b.position.x,y:b.position.y,z:b.position.z})}});
  if(m.wobble)b.addEventListener("collide",e=>{const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>1.5){b.wb.wob=Math.min(1,v/8);b.wb.wobT=G.t}});
  G.W.addBody(b);G.bodies.push(b);G.blocks.push(b);return b}
/* let the house settle before you start (so it doesn't fall down by itself); then remember where everything is */
function wbSettle(G,secs=1.2){if(G.blocks.length>260)secs=Math.min(secs,.35);for(let i=0;i<secs*60;i++)wbStep(G,WB.step,true);for(const b of G.blocks){const w=b.wb;w.y0=b.position.y;w.x0=b.position.x;w.z0=b.position.z;w.q0=b.quaternion.clone();b.sleep()}G.t=0;G.ev=[]}

/* ---------------- firing ---------------- */
function wbAim(power,yaw,ammo){const a=WB_AMMO.find(q=>q.k===ammo)||WB_AMMO[0],v=(WB.vmin+(WB.vmax-WB.vmin)*Math.max(0,Math.min(1,power)))*a.vk,p=WB.pitch,y=Math.max(-WB.yawMax,Math.min(WB.yawMax,yaw));
  const sx=Math.sin(y),cz=Math.cos(y),m=WB.muzzle;return{x:m[0]+sx*m[2],y:m[1],z:m[2]*cz,vx:sx*Math.cos(p)*v,vy:Math.sin(p)*v,vz:cz*Math.cos(p)*v,a}}
/* the path the shot will take (for the aiming dots); stops at the ground */
function wbArc(power,yaw,ammo,n=40,dt=.06){const s=wbAim(power,yaw,ammo),P=[];let x=s.x,y=s.y,z=s.z,vx=s.vx,vy=s.vy,vz=s.vz;for(let i=0;i<n;i++){P.push([x,y,z]);x+=vx*dt;y+=vy*dt;z+=vz*dt;vy-=9.82*dt;if(y<0)break}return P}
/* aim at a point: the cannon works out the angle (a fast, fairly flat shot; a long lob if it's too far for that) */
function wbShotAt(tx,ty,tz,ammo){const a=WB_AMMO.find(q=>q.k===ammo)||WB_AMMO[0],v=WB.vshot*a.vk,g=9.82,yaw=Math.max(-1.2,Math.min(1.2,Math.atan2(tx,tz))),m=WB.muzzle;
  const sx=Math.sin(yaw),cz=Math.cos(yaw),x0=sx*m[2],z0=cz*m[2],y0=m[1],d=Math.max(.5,Math.hypot(tx-x0,tz-z0)),h=ty-y0;
  const disc=v**4-g*(g*d*d+2*h*v*v);let p=disc<0?Math.PI/4:Math.atan((v*v-Math.sqrt(disc))/(g*d));p=Math.max(-.25,Math.min(1.2,p));
  return{x:x0,y:y0,z:z0,vx:sx*Math.cos(p)*v,vy:Math.sin(p)*v,vz:cz*Math.cos(p)*v,a,yaw,pitch:p}}
function wbArcS(s,n=40,dt=.04){const P=[];let x=s.x,y=s.y,z=s.z,vx=s.vx,vy=s.vy,vz=s.vz;for(let i=0;i<n;i++){P.push([x,y,z]);x+=vx*dt;y+=vy*dt;z+=vz*dt;vy-=9.82*dt;if(y<0)break}return P}
function wbFireAt(G,tx,ty,tz,ammo){return wbLaunch(G,wbShotAt(tx,ty,tz,ammo))}
function wbFire(G,power,yaw,ammo){return wbLaunch(G,wbAim(power,yaw,ammo))}
function wbLaunch(G,s){const C=G.C,a=s.a,b=new C.Body({mass:a.mass,material:G.mats(a.k)});
  if(a.chicken){/* a long floppy body with a head */b.addShape(new C.Box(new C.Vec3(.17,.17,.5)));b.addShape(new C.Sphere(.2),new C.Vec3(0,.12,.62));b.angularVelocity.set(6,2,0)}
  else b.addShape(new C.Sphere(a.r));
  b.position.set(s.x,s.y+(a.r>1?a.r-.3:0),s.z);b.velocity.set(s.vx,s.vy,s.vz);b.linearDamping=a.rolls?.02:.04;b.angularDamping=a.rolls?.05:.2;b.sleepSpeedLimit=.15;b.sleepTimeLimit=.6;
  b.wbBall={a,t0:G.t,hit:0,stuck:0};
  b.addEventListener("collide",e=>{const o=e.body===b?e.target:e.body;const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v<1)return;
    G.ev.push({k:"thud",v,ammo:a.k,x:b.position.x,y:b.position.y,z:b.position.z,on:o&&o.wb?o.wb.mat:"grass"});
    if(a.splat&&!b.wbBall.hit&&v>4)G.queue.push({k:"splat",b});
    if(a.sticky&&!b.wbBall.stuck&&o&&o.wb)G.queue.push({k:"stick",b,o});
    if(o&&o.wb&&G.mortar&&G.mortar.length&&v>4)G.queue.push({k:"unglue",p:b.position.clone(),r:Math.min(3.2,.3*Math.pow(.5*a.mass*v*v,.25))});
    /* jelly: a soft hit boings straight back off it */if(o&&o.wb&&o.wb.mat==="jelly"&&!b.wbBall.jb&&v<19&&a.k!=="mega"){b.wbBall.jb=1;G.queue.push({k:"jbounce",b})}
    /* KABOOM: the first hard hit on a building blows the blocks round about outwards */if(a.blast&&o&&o.wb&&!b.wbBall.blasted&&v>5){b.wbBall.blasted=1;G.queue.push({k:"blast",p:b.position.clone(),r:a.blast.r,dv:a.blast.dv*Math.min(1.2,v/22),ball:b})}
    if(o&&o.wb)b.wbBall.hit=1});
  G.W.addBody(b);G.balls.push(b);G.ball=b;G.shots++;G.fireT=G.t;G.ev.push({k:"fire",ammo:a.k});
  /* not too many balls lying about: the oldest one goes */const live=G.balls.filter(q=>!q.wbGone);if(live.length>6){const o=live[0];o.wbGone=1;if(o.wbBall.con)G.W.removeConstraint(o.wbBall.con);G.W.removeBody(o)}
  /* small houses: wake the whole house so it can fall; big places wake up bit by bit round whatever is moving */if(G.blocks.length<260)for(const q of G.blocks)q.wakeUp();return b}
/* wake sleeping blocks next to anything that's moving (so a wall knocked out from under a roof lets the roof fall) */
function wbWakeNear(G){const S=2,H={},key=(x,y,z)=>x+","+y+","+z;let any=0;
  const mv=G.blocks.concat(G.balls).filter(b=>!b.wbGone&&b.world&&b.sleepState!==2&&(b.velocity.lengthSquared()>.09||b.angularVelocity.lengthSquared()>.25));if(!mv.length)return;
  for(const b of G.blocks){if(b.wb.gone||!b.world||b.sleepState!==2)continue;const p=b.position;const k=key(Math.floor(p.x/S),Math.floor(p.y/S),Math.floor(p.z/S));(H[k]||(H[k]=[])).push(b);any=1}if(!any)return;
  for(const b of mv){const p=b.position,cx=Math.floor(p.x/S),cy=Math.floor(p.y/S),cz=Math.floor(p.z/S),r=b.wbBall?2:1;for(let i=-r;i<=r;i++)for(let j=-1;j<=r;j++)for(let k=-r;k<=r;k++){const L=H[key(cx+i,cy+j,cz+k)];if(!L)continue;
    for(const q of L)if(q.sleepState===2&&q.position.distanceTo(p)<(b.wbBall?b.wbBall.a.r+2.2:2.4)){q.wakeUp()}}}}

/* ---------------- one step of the world ---------------- */
function wbStep(G,dt,quiet){const C=G.C;G.W.step(WB.step,dt,4);G.t+=dt;G.nstep=(G.nstep||0)+1;if(!quiet&&G.blocks.length>=260&&G.nstep%3===0)wbWakeNear(G);
  /* things that happen after a hit: breaking, splatting, sticking */
  const Q=G.queue.splice(0);for(const q of Q){
    if(q.k==="break"&&!q.b.wb.gone)wbBreak(G,q.b,q.v);
    else if(q.k==="splat"&&!q.b.wbBall.hit2){q.b.wbBall.hit2=1;wbSplat(G,q.b)}
    else if(q.k==="blast"){const P=q.p,hitB=new Set();for(const o of G.blocks){if(o.wb.gone||!o.world)continue;const d=o.position.distanceTo(P);if(d>q.r)continue;o.wakeUp();if(o.wb.s.bld!=null&&o.wb.s.bld>=0)hitB.add(o.wb.s.bld);const k=1-d/q.r,dir=o.position.vsub(P);dir.y=Math.max(dir.y,0)+.35*d;const L=dir.length()||1,dv=q.dv*k*Math.max(.35,Math.min(1.5,Math.pow(8/o.mass,.35)));
        o.velocity.x+=dir.x/L*dv;o.velocity.y+=dir.y/L*dv;o.velocity.z+=dir.z/L*dv;o.angularVelocity.x+=(Math.random()-.5)*dv;o.angularVelocity.z+=(Math.random()-.5)*dv}
      /* the whole building that got hit wakes up and feels it */if(hitB.size)for(const o of G.blocks)if(!o.wb.gone&&o.world&&hitB.has(o.wb.s.bld))o.wakeUp();
      if(q.ball&&!q.ball.wbGone)q.ball.velocity.scale(.55,q.ball.velocity);if(G.mortar&&G.mortar.length)G.queue.push({k:"unglue",p:P,r:q.r});G.ev.push({k:"blast",x:P.x,y:P.y,z:P.z,r:q.r})}
    else if(q.k==="jbounce"){const v=q.b.velocity;q.b.velocity.set(-v.x*.5,Math.abs(v.y)*.5+3,-Math.abs(v.z)*.75-2);q.b.wbBall.blasted=1}
    else if(q.k==="unglue"){for(let i=G.mortar.length-1;i>=0;i--){const m=G.mortar[i];if(m.a.position.distanceTo(q.p)<q.r||m.b.position.distanceTo(q.p)<q.r){G.W.removeConstraint(m.c);G.mortar.splice(i,1);G.ev.push({k:"snap",x:m.a.position.x,y:m.a.position.y,z:m.a.position.z})}}}
    else if(q.k==="stick"&&!q.b.wbBall.stuck&&!q.o.wb.gone){q.b.wbBall.stuck=1;const c=new C.LockConstraint(q.b,q.o);G.W.addConstraint(c);q.b.wbBall.con=c;G.ev.push({k:"stick",x:q.b.position.x,y:q.b.position.y,z:q.b.position.z})}}
  /* mortar snaps when the blocks get pulled apart or one breaks */if(G.mortar&&G.mortar.length)for(let i=G.mortar.length-1;i>=0;i--){const m=G.mortar[i];if(m.a.wb.gone||m.b.wb.gone||Math.abs(m.a.position.distanceTo(m.b.position)-m.d)>.1){G.W.removeConstraint(m.c);G.mortar.splice(i,1);if(!quiet)G.ev.push({k:"snap",x:m.a.position.x,y:m.a.position.y,z:m.a.position.z})}}
  if(!quiet&&(G.blocks.length<260||G.nstep%4===0))wbCount(G);
  /* if the maths ever goes wrong for a block, take it away rather than let it spoil everything */if(G.nstep%3===0)for(const b of G.blocks)if(!b.wb.gone&&b.world&&b.sleepState!==2&&!isFinite(b.position.x+b.position.y+b.position.z+b.quaternion.w)){b.wb.gone=1;b.wb.down=2;G.W.removeBody(b)}
  /* tidy: balls and bits that fell off the world */for(const b of G.balls)if(!b.wbGone&&(b.position.y<-5||Math.abs(b.position.x)>80||b.position.z>90||b.position.z<-20)){b.wbGone=1;G.W.removeBody(b)}}
/* a breakable block shatters into smaller bits (cookie crumbs, ice shards, sand) */
function wbBreak(G,b,v){const s=b.wb.s,m=WB_MAT[b.wb.mat],n=m.bits||2;b.wb.gone=1;b.wb.down=b.wb.down||1;G.W.removeBody(b);const C=G.C,q=b.quaternion,p=b.position;
  /* glass doesn't break into blocks: it shatters into a shower of shards (drawn by the game, nothing left to bump into) */if(m.shatter)return G.ev.push({k:"break",mat:b.wb.mat,x:p.x,y:p.y,z:p.z,n:0,shatter:1,w:s.w,h:s.h,d:s.d,vx:b.velocity.x,vy:b.velocity.y,vz:b.velocity.z,v});
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
/* how many buildings are knocked down (a building counts once it's mostly fallen or knocked down low) */
function wbBldCount(G){if(!G.blds){const n=1+Math.max(-1,...G.blocks.map(b=>b.wb.orig&&b.wb.s.bld!=null?b.wb.s.bld:-1));if(n<=1)return null;G.blds=Array.from({length:n},()=>({n:0,h0:0}));
    for(const b of G.blocks){const k=b.wb.s.bld;if(!b.wb.orig||k==null||k<0)continue;const B=G.blds[k];B.n++;B.h0=Math.max(B.h0,b.wb.y0+b.wb.h/2);B.x0=(B.x0||0)+b.wb.x0;B.z0=(B.z0||0)+b.wb.z0}for(const B of G.blds)if(B.n){B.x0/=B.n;B.z0/=B.n}for(const B of G.blds)B.low=Math.max(.8,B.h0*.3)}
  for(const B of G.blds){B.f=0;B.top=0}for(const b of G.blocks){const k=b.wb.s.bld;if(!b.wb.orig||k==null||k<0)continue;const B=G.blds[k];if(b.wb.down===2)B.f++;else if(isFinite(b.position.y))B.top=Math.max(B.top,b.position.y+b.wb.h/2)}
  let tot=0,sum=0,dn=0;for(const B of G.blds){if(!B.n)continue;const hk=Math.max(0,Math.min(1,(B.h0-B.top)/Math.max(.1,B.h0-B.low))),d=Math.min(1,Math.max(B.f/B.n/.8,hk));B.d=d;B.down=d>=WB.townDown-1e-6;if(B.down)dn++;sum+=Math.min(1,d/WB.townDown)*B.n;tot+=B.n}
  G.bTot=G.blds.filter(B=>B.n).length;G.bDown=dn;return tot?sum/tot:0}
function wbCount(G){let n=0,tot=0,top=0;for(const b of G.blocks){if(!b.wb.orig||!isFinite(b.position.y))continue;tot++;if(b.wb.down!==2&&wbIsDown(b)){b.wb.down=2;const v=G.boss?2:1;G.coins+=v;const p=b.position;G.ev.push({k:"coin",v,x:p.x,y:p.y,z:p.z})}
    if(b.wb.down===2)n++;else top=Math.max(top,b.position.y+b.wb.h/2)}
  if(G.h0==null){let h=0;for(const b of G.blocks)if(b.wb.orig)h=Math.max(h,b.wb.y0+b.wb.h/2);G.h0=h}
  const low=Math.max(1,G.h0*.18),hk=Math.max(0,Math.min(1,(G.h0-top)/Math.max(.1,G.h0-low)));G.fell=tot?n/tot:0;G.down=Math.max(G.fell,hk);if(G.townMode!==0){const bd=wbBldCount(G);if(bd!=null){G.townMode=1;G.down=bd}else G.townMode=0}G.top=top;G.total=tot;return G.down}
/* has everything stopped moving? (then the shot is over) */
function wbSettled(G){if(G.fireT==null)return true;const since=G.t-G.fireT;if(since>WB.settle)return true;if(since<1.2)return false;
  for(const b of G.bodies.concat(G.balls)){if(b.wbGone||(b.wb&&b.wb.gone))continue;if(b.world&&b.sleepState!==2&&b.velocity.length()>.6)return false}return true}
const wbFlat=G=>G.townMode===1?G.bDown>=G.bTot:G.down>=(G.easy?.85:.999)||G.fell>=(G.boss?.75:WB.flat);
/* stars: as few shots as possible */
function wbStars(level,shots){const L=WB_LEVELS[level],p=L?L.par:3;return shots<=p?3:shots<=(L&&L.town?Math.ceil(p*1.5):p+2)?2:1}
/* who wins a build-for-each-other round: the house that took more shots to knock flat (if it was never flattened, it took the most) */
function wbDuelWinner(a,b){const sa=a.flat?a.shots:99,sb=b.flat?b.shots:99;return sa===sb?null:sa>sb?"a":"b"}
/* the state of a house as a short string (sent to the other phone) and back */
function wbSnap(G){return G.blocks.filter(b=>b.wb.orig).map(b=>b.wb.gone?"x":[b.position.x,b.position.y,b.position.z].map(v=>v.toFixed(2)).join(",")+","+[b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w].map(v=>v.toFixed(3)).join(",")).join(";")}
function wbApplySnap(G,str){const o=G.blocks.filter(b=>b.wb.orig),L=(str||"").split(";");if(L.length!==o.length)return false;
  o.forEach((b,i)=>{const t=L[i];if(t==="x"){if(!b.wb.gone){b.wb.gone=1;b.wb.down=2;G.W.removeBody(b)}return}if(b.wb.gone)return;const v=t.split(",").map(Number);b.position.set(v[0],v[1],v[2]);b.quaternion.set(v[3],v[4],v[5],v[6]);b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);b.sleep()});
  if(G.mortar)for(let i=G.mortar.length-1;i>=0;i--){const m=G.mortar[i];if(m.a.wb.gone||m.b.wb.gone||Math.abs(m.a.position.distanceTo(m.b.position)-m.d)>.12){G.W.removeConstraint(m.c);G.mortar.splice(i,1)}}wbCount(G);return true}
if(typeof module!=="undefined")module.exports={WB_TINT,wbBldCount,wbWakeNear,wbShotAt,wbArcS,wbFireAt,wbLaunch,wbSnap,wbApplySnap,WB,WB_MAT,WB_AMMO,WB_LEVELS,WB_BUILD,wbHouse,wbFromBuild,wbBuildCost,wbCanPlace,wbWorld,wbAddBlock,wbSettle,wbAim,wbArc,wbFire,wbStep,wbBreak,wbSplat,wbIsDown,wbCount,wbSettled,wbFlat,wbStars,wbDuelWinner};
