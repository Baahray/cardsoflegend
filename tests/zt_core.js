/* ===================== ZOMBIE TAG: the rules, the city, moving about and the computer players (no drawing) =====================
   Shared by the game, the bots and the tests.  World: x to the right (east), z down the screen (south), y up.
   Characters are about 2 units tall.  Walking 2 units/s, running 4, sprinting 6. */
const ZT={S:202,P:32,RD:10,dt:1/60,r:.45,walk:2,run:4,sprint:6,acc:18,dec:14,turn:20,drain:3.6,refill:5,
  tagR:1.15,zfast:1.08,tagCool:.8,tagT:.25,morphT:.4,immune:1.5,lead:3,stunShield:1.2,stunBanana:1.4,stuckGum:2.5,pickR:1.25,nPick:22,respawn:10,wake:2};
function ztRng(seed){let a=(seed>>>0)||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ztHash=(...n)=>{let h=2166136261;for(const v of n){h^=v|0;h=Math.imul(h,16777619);h^=h>>>13}return h>>>0};
const ztCl=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------------- the city: 6 x 6 blocks with roads between. Some blocks are special (park, plaza, court, car park, container yard) ---------------- */
const ZT_SPECIAL={"2,3":"park","3,2":"plaza","1,1":"court","4,4":"lot","4,1":"yard","1,4":"park","3,4":"plaza","0,2":"yard","5,3":"court"};
const ZT_COLS=[0xe8d5b0,0xc9d8e6,0xd9b38c,0xb7c9a8,0xe6c3c3,0xcfc6e8,0xf0e2a8,0xbfd9d6,0xd8a07a,0xa9b8c9];
const ZT_ROOFS=[0x8a8f99,0x6f7782,0x9a8577,0x7e8a76,0xa5a39c,0x5f6670,0xb58b6a,0x7b6f8f];
function ztWorld(seed){const R=ztRng(seed),S=ZT.S,P=ZT.P,RD=ZT.RD,N=6;
  const W={S,seed,rects:[],circs:[],asph:[],walk:[],grass:[],tile:[],court:[],lot:[],marks:[],blds:[],decor:[]};
  const rect=(x0,z0,x1,z1,o)=>{const r={x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1),...o};W.rects.push(r);return r};
  const circ=(x,z,r,o)=>{const c={x,z,r,...o};W.circs.push(c);return c};
  /* roads: strips 10 wide at every 32. Asphalt in the middle, pavement both sides */
  for(let k=0;k<=N;k++){const a=k*P;W.walk.push([a,0,a+RD,S],[0,a,S,a+RD]);W.asph.push([a+1.6,0,a+RD-1.6,S],[0,a+1.6,S,a+RD-1.6]);
    for(let s=0;s<S;s+=4){const inX=(s%P)<RD+1;if(!inX){W.marks.push([a+RD/2-.08,s,a+RD/2+.08,s+2,"y"]);W.marks.push([s,a+RD/2-.08,s+2,a+RD/2+.08,"y"])}}
    for(let j=0;j<=N;j++){const b=j*P;/* zebra crossings at each crossroads */for(let i=0;i<5;i++){const o=1.9+i*1.35;W.marks.push([a+o,b+RD+.2,a+o+.7,b+RD+1.4,"w"],[a+o,b-1.4,a+o+.7,b-.2,"w"],[b+RD+.2,a+o,b+RD+1.4,a+o+.7,"w"],[b-1.4,a+o,b-.2,a+o+.7,"w"])}}}
  /* parked cars along the kerbs, never in the crossroads */
  for(let k=0;k<=N;k++)for(let j=0;j<N;j++){const a=k*P,s0=j*P+RD+3,s1=(j+1)*P-3;for(const side of [0,1]){let s=s0+R()*4;while(s+4.4<s1){if(R()<.42){const col=Math.floor(R()*8);
        const lane=side?a+RD-1.6-1.15:a+1.6+.15;rect(lane,s,lane+2,s+4.4,{k:"car",h:1.45,col,dir:0});const lane2=side?a+RD-1.6-1.15:a+1.6+.15;rect(s,lane2,s+4.4,lane2+2,{k:"car",h:1.45,col:(col+3)%8,dir:1})}s+=5.2+R()*3}}}
  /* pavement trees, lamps and hydrants */
  for(let k=0;k<=N;k++)for(let s=4;s<S;s+=9+Math.floor(R()*4)){if((s%P)<RD+2||(s%P)>P-2)continue;const a=k*P,u=R();
    if(u<.35){circ(a+.8,s,.42,{k:"tree"});circ(s,a+RD-.8,.42,{k:"tree"})}else if(u<.55){circ(a+RD-.6,s,.16,{k:"lamp"});circ(s,a+.6,.16,{k:"lamp"})}else if(u<.62)circ(a+.7,s,.2,{k:"hyd"})}
  /* the blocks */
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const bx=i*P+RD,bz=j*P+RD,B=P-RD,t=ZT_SPECIAL[i+","+j]||"bld",cx=bx+B/2,cz=bz+B/2;
    if(t==="park"){W.grass.push([bx,bz,bx+B,bz+B]);W.tile.push([cx-1.5,bz,cx+1.5,bz+B],[bx,cz-1.5,bx+B,cz+1.5]);const pr=3.6+R()*1.2,px=cx+(R()<.5?-5.5:5.5),pz=cz+(R()<.5?-5.5:5.5);circ(px,pz,pr,{k:"pond"});
      for(let n=0;n<16;n++){const x=bx+1.5+R()*(B-3),z=bz+1.5+R()*(B-3);if(Math.abs(x-cx)<2.6||Math.abs(z-cz)<2.6||Math.hypot(x-px,z-pz)<pr+1.6)continue;circ(x,z,.55,{k:"tree",big:1})}
      rect(cx+2.2,cz-6,cx+2.9,cz-3.8,{k:"bench",h:.5});rect(cx-6,cz-2.9,cx-3.8,cz-2.2,{k:"bench",h:.5})}
    else if(t==="plaza"){W.tile.push([bx,bz,bx+B,bz+B]);circ(cx,cz,2.7,{k:"fountain"});
      for(const [dx,dz] of [[-6.5,-6.5],[6.5,-6.5],[-6.5,6.5],[6.5,6.5]]){rect(cx+dx-1.1,cz+dz-1.1,cx+dx+1.1,cz+dz+1.1,{k:"planter",h:.6});W.decor.push({k:"ptree",x:cx+dx,z:cz+dz})}
      rect(cx-1.2,bz+2,cx+1.2,bz+2.6,{k:"bench",h:.5});rect(cx-1.2,bz+B-2.6,cx+1.2,bz+B-2,{k:"bench",h:.5})}
    else if(t==="court"){W.court.push([bx,bz,bx+B,bz+B]);const f=(x0,z0,x1,z1)=>rect(x0,z0,x1,z1,{k:"fence",h:2.2});
      /* a fence round the court with a gap in the middle of every side */f(bx+.5,bz+.5,cx-2,bz+.7);f(cx+2,bz+.5,bx+B-.5,bz+.7);f(bx+.5,bz+B-.7,cx-2,bz+B-.5);f(cx+2,bz+B-.7,bx+B-.5,bz+B-.5);
      f(bx+.5,bz+.5,bx+.7,cz-2);f(bx+.5,cz+2,bx+.7,bz+B-.5);f(bx+B-.7,bz+.5,bx+B-.5,cz-2);f(bx+B-.7,cz+2,bx+B-.5,bz+B-.5);
      circ(cx,bz+2.2,.22,{k:"hoop",dir:1});circ(cx,bz+B-2.2,.22,{k:"hoop",dir:-1})}
    else if(t==="lot"){W.lot.push([bx,bz,bx+B,bz+B]);for(const row of [bz+2.5,bz+9,bz+15.5])for(let x=bx+1.5;x+2.1<bx+B-1;x+=2.9){if(R()<.68)rect(x,row,x+2.1,row+4.4,{k:"car",h:1.45,col:Math.floor(R()*8),dir:0,lot:1})}
      rect(bx+B-3.6,bz+B-3.2,bx+B-1.2,bz+B-1.2,{k:"booth",h:2.4})}
    else if(t==="yard"){W.lot.push([bx,bz,bx+B,bz+B]);const cs=[0xc0392b,0x2e86c1,0x27ae60,0xe67e22,0x8e44ad,0x16a085];
      for(let a=0;a<3;a++)for(let b=0;b<3;b++){if(R()<.2)continue;const x=bx+1.5+a*7+R()*.8,z=bz+1.5+b*7+R()*.8,v=R()<.5;
        rect(x,z,x+(v?2.5:5.6),z+(v?5.6:2.5),{k:"box",h:R()<.3?5.2:2.6,col:cs[Math.floor(R()*cs.length)]})}
      for(let n=0;n<5;n++){const x=bx+2+R()*(B-4),z=bz+2+R()*(B-4);if(!ztHit(W,x,z,1.2))rect(x-.6,z-.6,x+.6,z+.6,{k:"crate",h:1.2})}}
    else{/* buildings, with alleys between them */W.walk.push([bx,bz,bx+B,bz+B]);
      const split=(L)=>{const u=R();if(u<.25)return[[0,L]];if(u<.7){const a=8+R()*(L-19);return[[0,a],[a+3,L]]}const w=(L-5.5)/3;return[[0,w],[w+2.75,2*w+2.75],[2*w+5.5,L]]};
      const cols=split(B),rows=split(B),far=Math.hypot(cx-S/2,cz-S/2)/(S*.7);
      for(const [a0,a1] of cols)for(const [b0,b1] of rows){if(R()<.08){circ(bx+(a0+a1)/2,bz+(b0+b1)/2,.5,{k:"tree"});continue}const ins=R()<.4?R()*.7:0;
        const h=+(5+R()*7+(1-far)*7*R()).toFixed(1),b=rect(bx+a0+ins,bz+b0+ins,bx+a1-ins,bz+b1-ins,{k:"bld",h,col:ZT_COLS[Math.floor(R()*ZT_COLS.length)],roof:ZT_ROOFS[Math.floor(R()*ZT_ROOFS.length)],id:W.blds.length});W.blds.push(b)}
      /* bins and dumpsters in the alleys */for(let n=0;n<2;n++){const x=bx+R()*B,z=bz+R()*B;if(!ztHit(W,x,z,1.6))rect(x-.9,z-.5,x+.9,z+.5,{k:"bin",h:1.1})}}}
  ztIndex(W);ztNav(W);return W}

/* ---------------- collision: a grid of buckets so we only test what is nearby ---------------- */
function ztIndex(W){const C=8,n=Math.ceil(W.S/C)+1;W.hC=C;W.hN=n;W.hash=Array.from({length:n*n},()=>[]);
  const put=(o,x0,z0,x1,z1)=>{for(let gx=Math.max(0,Math.floor((x0-1.2)/C));gx<=Math.min(n-1,Math.floor((x1+1.2)/C));gx++)for(let gz=Math.max(0,Math.floor((z0-1.2)/C));gz<=Math.min(n-1,Math.floor((z1+1.2)/C));gz++)W.hash[gz*n+gx].push(o)};
  W.rects.forEach(r=>put(r,r.x0,r.z0,r.x1,r.z1));W.circs.forEach(c=>put(c,c.x-c.r,c.z-c.r,c.x+c.r,c.z+c.r))}
const ztCell=(W,x,z)=>{if(!W.hash)return[...W.rects,...W.circs];const n=W.hN,gx=ztCl(Math.floor(x/W.hC),0,n-1),gz=ztCl(Math.floor(z/W.hC),0,n-1);return W.hash[gz*n+gx]};
/* is anything solid within r of this point? */
function ztHit(W,x,z,r){if(x<r||z<r||x>W.S-r||z>W.S-r)return true;for(const o of ztCell(W,x,z)){if(o.r!=null){if(Math.hypot(x-o.x,z-o.z)<o.r+r)return true}
    else{const cx=ztCl(x,o.x0,o.x1),cz=ztCl(z,o.z0,o.z1);if(Math.hypot(x-cx,z-cz)<r)return true}}return false}
/* push a circle out of everything it overlaps (it slides along walls) */
function ztCollide(W,p,r){for(let it=0;it<3;it++){let any=false;for(const o of ztCell(W,p.x,p.z)){
      if(o.r!=null){const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz),m=o.r+r;if(d<m){const k=d>1e-6?1/d:0;p.x=o.x+(k?dx*k:1)*m;p.z=o.z+(k?dz*k:0)*m;any=true}}
      else{const cx=ztCl(p.x,o.x0,o.x1),cz=ztCl(p.z,o.z0,o.z1),dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);
        if(d<1e-6){/* centre inside the box: out the nearest side */const L=p.x-o.x0,Rr=o.x1-p.x,T=p.z-o.z0,Bm=o.z1-p.z,m=Math.min(L,Rr,T,Bm);if(m===L)p.x=o.x0-r;else if(m===Rr)p.x=o.x1+r;else if(m===T)p.z=o.z0-r;else p.z=o.z1+r;any=true}
        else if(d<r){p.x=cx+dx/d*r;p.z=cz+dz/d*r;any=true}}}
    p.x=ztCl(p.x,r,W.S-r);p.z=ztCl(p.z,r,W.S-r);if(!any)break}return p}

/* ---------------- a walking map for the computer players: 1-unit squares, blocked if too close to anything ---------------- */
function ztNav(W){const n=Math.ceil(W.S),b=new Uint8Array(n*n);for(let z=0;z<n;z++)for(let x=0;x<n;x++)b[z*n+x]=ztHit(W,x+.5,z+.5,.6)?1:0;W.nav={n,b};
  /* everything reachable from the middle crossroads (so pickups never land somewhere you can't get to) */const c0=ztNi(W,3*ZT.P+5,3*ZT.P+5);W.reach=ztBfs(W,c0,1e9)}
const ztNi=(W,x,z)=>{const n=W.nav.n;return ztCl(Math.floor(z),0,n-1)*n+ztCl(Math.floor(x),0,n-1)};
/* distances (in squares) from one square to every square within maxD. 65535 = can't get there */
function ztBfs(W,start,maxD){const{n,b}=W.nav,D=new Uint16Array(n*n).fill(65535),Q=new Int32Array(n*n);let h=0,t=0;if(b[start]){/* start in a wall: use the nearest free square */
    let best=-1,bd=1e9;const sx=start%n,sz=(start/n)|0;for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const x=sx+dx,z=sz+dz;if(x<0||z<0||x>=n||z>=n||b[z*n+x])continue;const d=dx*dx+dz*dz;if(d<bd){bd=d;best=z*n+x}}if(best<0)return D;start=best}
  D[start]=0;Q[t++]=start;while(h<t){const c=Q[h++],d=D[c];if(d>=maxD)continue;const x=c%n,z=(c/n)|0;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const X=x+dx,Z=z+dz;if(X<0||Z<0||X>=n||Z>=n)continue;const k=Z*n+X;if(b[k]||D[k]!==65535)continue;
      if(dx&&dz&&(b[z*n+X]||b[Z*n+x]))continue;D[k]=d+1;Q[t++]=k}}return D}
/* can you walk in a straight line from a to b? */
function ztLos(W,ax,az,bx,bz){const L=Math.hypot(bx-ax,bz-az),s=Math.ceil(L/.4);for(let i=1;i<=s;i++){const x=ax+(bx-ax)*i/s,z=az+(bz-az)*i/s;if(W.nav.b[ztNi(W,x,z)])return false}return true}
/* follow a distance map downhill from (x,z); returns the furthest point you can run to in a straight line */
function ztDescend(W,D,x,z,look=10){const n=W.nav.n;let c=ztNi(W,x,z),best=null;
  for(let s=0;s<look;s++){const cx=c%n,cz=(c/n)|0;let nb=-1,nd=D[c];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const X=cx+dx,Z=cz+dz;if(X<0||Z<0||X>=n||Z>=n)continue;const k=Z*n+X;if(D[k]<nd){nd=D[k];nb=k}}
    if(nb<0)break;c=nb;const px=c%n+.5,pz=((c/n)|0)+.5;if(ztLos(W,x,z,px,pz))best=[px,pz];else if(best)break;else{best=[px,pz];break}}return best}

/* ---------------- people ---------------- */
/* look: colours, so more humans and zombies can be added later. kid: Cass (a little smaller and quicker) */
const ZT_LOOKS={you:{shirt:0x2f6fe0,pants:0x2b2f3a,shoes:0xf4f4f4,stripe:0x2f6fe0,hair:0x4a2c17,skin:0xf1c39b},
  dad:{shirt:0x2f6fe0,pants:0x262a33,shoes:0xf4f4f4,stripe:0xe03a3a,hair:0x3a2414,skin:0xe8b48e},
  cass:{shirt:0x3aa0ff,pants:0x2d3340,shoes:0xffffff,stripe:0xffc21a,hair:0x6b3e1e,skin:0xf6cfac},
  knight:{shirt:0x7b4bd6,pants:0x24212e,shoes:0x1d1d1d,stripe:0xb48cff,hair:0x111111,skin:0xd9a67e},
  gus:{shirt:0xe5533d,pants:0x30343f,shoes:0xf0f0f0,stripe:0xe5533d,hair:0xd9a441,skin:0xf0c49c},
  pip:{shirt:0xf2b705,pants:0x3a3346,shoes:0xff6fae,stripe:0xff6fae,hair:0x8c4a2f,skin:0xc98b62}};
function ztPerson(o){return{id:o.id,name:o.name,look:o.look||"you",kid:!!o.kid,bot:o.bot||0,mul:o.mul||1,stK:o.stK||1,sc:o.kid?.88:1,role:"h",x:o.x||0,z:o.z||0,vx:0,vz:0,yaw:o.yaw||Math.PI,ta:o.yaw||Math.PI,sp:0,
  st:1,tired:0,spr:false,item:null,fx:{shield:0,energy:0,shoes:0,brain:0,cloak:0,stun:0,immune:0,frozen:0,lead:0,stuck:0,slow:0},ztime:0,tags:0,letters:0}}
const ZT_STARTS=[[2,2],[4,4],[4,2],[2,4]];
/* a new game. players: [{id,name,look,kid,bot,mul,stK}], z = id of the first zombie */
function ztGame(o){const W=o.W||ztWorld(o.seed),G={seed:o.seed,W,t:-3,dur:o.dur===0?Infinity:(o.dur||120),mode:o.mode||"vs",hearts:o.hearts||5,hits:{},cool:0,nTag:0,over:0,ents:[],picks:[],bananas:[],bn:0,ev:[],letters:[],boxes:[],npcs:[],cars:[],horde:null};
  if(G.mode==="team")return ztTeamGame(G,o);
  const mid=3*ZT.P+5;let k=0;for(const p of o.players){const e=ztPerson(p);if(e.id===o.z){e.role="z";e.x=mid;e.z=mid;e.fx.frozen=3+ZT.wake}else{const s=ZT_STARTS[(k++)%4];e.x=s[0]*ZT.P+5;e.z=s[1]*ZT.P+5;e.fx.frozen=3}
    e.yaw=e.ta=Math.atan2(mid-e.x,mid-e.z)+(e.role==="z"?0:Math.PI);G.ents.push(e)}
  for(let i=0;i<ZT.nPick;i++)G.picks.push(ztPickAt(G,i,0));ztLetterSpots(G);ztBoxSpots(G,o.boxes??3);ztNpcSetup(G,o.npcs??12);ztCarSetup(G);return G}
const ztZombies=G=>G.ents.filter(e=>e.role==="z");
const ztZombie=G=>G.ents.find(e=>e.role==="z");

/* ---------------- pickups ---------------- */
const ZT_PK=[["shield",19],["energy",16],["shoes",12],["banana",11],["gum",14],["brain",8],["cloak",7],["horn",7],["mystery",6]];
const ZT_PKI={shield:"🛡️",energy:"⚡",shoes:"👟",banana:"🍌",gum:"🍬",brain:"🧠",cloak:"👻",horn:"📯",mystery:"❓"};
const ZT_PKN={shield:"SHIELD! blocks one bite",energy:"ENERGY! sprint all you like",shoes:"ROCKET SHOES!",banana:"BANANA! tap 🍌 to drop it",gum:"BUBBLE GUM! tap 🍬 to drop it — zombies get stuck",brain:"BRAINS! zombie speed",cloak:"GHOST! the zombie can't see you",horn:"ZOMBIE CALL! tap 📯 to call the horde",mystery:"MYSTERY BOX!"};
/* where slot i appears the s-th time: the same on both phones */
function ztPickAt(G,i,s){const R=ztRng(ztHash(G.seed,i,s,77)),W=G.W;let x=0,z=0;for(let n=0;n<400;n++){x=4+R()*(W.S-8);z=4+R()*(W.S-8);if(!ztHit(W,x,z,1.1)&&W.reach[ztNi(W,x,z)]<65535)break}
  let u=R()*100,type="shield";for(const [k,w] of ZT_PK){if(u<w){type=k;break}u-=w}return{i,s,x:+x.toFixed(2),z:+z.toFixed(2),type,on:1,at:0}}
function ztCanGet(e,t){return t==="shield"?e.role==="h"&&!e.fx.shield:t==="cloak"?e.role==="h":t==="brain"?e.role==="z":t==="banana"?!e.item:t==="gum"?e.role==="h"&&!e.item:t==="horn"?e.role==="z"&&!e.npc&&!e.item&&!(e.G&&e.G.horde):true}
function ztGive(G,e,t,R){if(t==="mystery"){const opts=["energy","shoes","banana",...(e.role==="h"?["shield","cloak","gum"]:["brain","horn"])].filter(k=>ztCanGet(e,k));t=opts[Math.floor((R?R():Math.random())*opts.length)]||"energy"}
  const f=e.fx;if(t==="shield")f.shield=1;else if(t==="energy"){f.energy=4;e.st=1;e.tired=0}else if(t==="shoes")f.shoes=5;else if(t==="banana")e.item="banana";else if(t==="gum")e.item="gum";else if(t==="horn"){if(e.bot)ztHordeCall(G,e);else e.item="horn"}else if(t==="brain")f.brain=5;else if(t==="cloak")f.cloak=6;return t}
function ztPickups(G,e,ev){if(e.car!=null)return;for(const p of G.picks){if(!p.on||Math.hypot(e.x-p.x,e.z-p.z)>ZT.pickR||(p.type==="horn"&&G.horde)||!ztCanGet(e,p.type))continue;
    const got=ztGive(G,e,p.type,ztRng(ztHash(G.seed,p.i,p.s,9)));p.on=0;p.at=G.t+ZT.respawn;ev.push({k:"pick",e:e.id,i:p.i,s:p.s,type:p.type,got});if(got==="horn"&&e.bot&&G.horde)ev.push({k:"horde",by:e.id,t:G.horde.t0,seed:G.horde.seed})}}
function ztRespawn(G){for(let j=0;j<G.picks.length;j++){const p=G.picks[j];if(!p.on&&G.t>=p.at)G.picks[j]=ztPickAt(G,p.i,p.s+1)}}
/* bananas: drop one behind you; whoever else steps on it slips over */
/* gum: drop it behind you; a zombie that treads in it is stuck to the spot for a couple of seconds */
function ztUseItem(G,e,ev){if(e.item==="horn"&&e.role==="z"&&e.fx.frozen<=0){e.item=null;const h=ztHordeCall(G,e);if(h)ev.push({k:"horde",by:e.id,t:h.t0,seed:h.seed});return !!h}
  if((e.item!=="banana"&&e.item!=="gum")||e.fx.frozen>0)return false;const b={id:e.id+"-"+(++G.bn)+"-"+Math.floor(G.t*10),k:e.item,x:e.x-Math.sin(e.yaw)*1.25,z:e.z-Math.cos(e.yaw)*1.25,by:e.id,arm:G.t+.35};
  const q={x:b.x,z:b.z};ztCollide(G.W,q,.3);b.x=+q.x.toFixed(2);b.z=+q.z.toFixed(2);G.bananas.push(b);e.item=null;ev.push({k:"drop",e:e.id,b});return true}
function ztSlips(G,e,ev){for(const b of G.bananas){if(b.gone||G.t<b.arm||e.fx.frozen>0)continue;const gum=b.k==="gum";if(gum?e.role!=="z":b.by===e.id)continue;
    if(Math.hypot(e.x-b.x,e.z-b.z)<(gum?1:.9)){b.gone=1;if(gum){e.fx.stuck=ZT.stuckGum;e.vx=e.vz=0;ev.push({k:"stuck",e:e.id,b:b.id})}else{e.fx.stun=ZT.stunBanana;e.vx*=.3;e.vz*=.3;ev.push({k:"slip",e:e.id,b:b.id})}}}
  G.bananas=G.bananas.filter(b=>!b.gone)}

/* ---------------- Z-O-M-B-I-E: six letters round the city. Only humans can pick them up; each one is gone once taken. Spell it all = WIN ---------------- */
const ZT_WORD="ZOMBIE";
function ztFreeSpot(G,R,x0,z0,x1,z1,clear){const W=G.W;for(let n=0;n<300;n++){const x=x0+R()*(x1-x0),z=z0+R()*(z1-z0);if(!ztHit(W,x,z,clear)&&W.reach[ztNi(W,x,z)]<65535)return[+x.toFixed(2),+z.toFixed(2)]}return[3*ZT.P+5,3*ZT.P+5]}
function ztLetterSpots(G){const R=ztRng(ztHash(G.seed,606)),S=G.W.S,cells=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]].sort(()=>R()-.5);
  /* one letter in each sixth of the city, so they're spread right out */G.letters=[...ZT_WORD].map((ch,i)=>{const [cx,cz]=cells[i],p=ztFreeSpot(G,R,4+cx*S/3,4+cz*S/2,(cx+1)*S/3-4,(cz+1)*S/2-4,1.2);return{i,ch,x:p[0],z:p[1],by:null}})}
function ztLetterCount(G,id){return G.letters.filter(L=>L.by===id).length}
function ztLetters(G,e,ev){/* letters are for real players: computer players leave them alone */if(e.role!=="h"||e.npc||e.bot||G.t<0)return false;for(const L of G.letters){if(L.by||Math.hypot(e.x-L.x,e.z-L.z)>1.35)continue;L.by=e.id;e.letters=ztLetterCount(G,e.id);ev.push({k:"letter",e:e.id,i:L.i,ch:L.ch,n:e.letters});
    if(G.mode==="team"?G.letters.every(q=>q.by):e.letters>=ZT_WORD.length){G.over=1;ev.push(G.mode==="team"?{k:"end",team:1,why:"letters",winner:"team"}:{k:"end",winner:e.id,why:"letters"});return true}}return false}
/* ---------------- prize boxes: a few per game, real prizes (a coin, a card, a spin of the coin wheel) ---------------- */
function ztBoxSpots(G,n){const R=ztRng(ztHash(G.seed,707));G.boxes=[];for(let i=0;i<n;i++){const p=ztFreeSpot(G,R,8,8,G.W.S-8,G.W.S-8,1.2),u=R();G.boxes.push({i,x:p[0],z:p[1],prize:u<.45?"coin":u<.75?"card":"wheel",by:null})}}
function ztBoxes(G,e,ev){if(e.npc||G.t<0)return;for(const b of G.boxes){if(b.by||Math.hypot(e.x-b.x,e.z-b.z)>1.35)continue;b.by=e.id;ev.push({k:"box",e:e.id,i:b.i,prize:b.prize})}}
/* ---------------- people walking round the block. If the zombie bites one it becomes a little zombie for 30 s:
   it shuffles after humans and grabs them (slows them down) but can't bite or win. Their walk is worked out from the clock, so both phones agree ---------------- */
const ZT_NPCLOOK=[[0xe57373,0x3e4a5c,0x5b3a1f,0xf1c39b],[0x81c784,0x2e3440,0x1d1d1d,0xd9a67e],[0xffb74d,0x424242,0x8c4a2f,0xf6cfac],[0x9575cd,0x37474f,0x3a2414,0xc98b62],[0x4dd0e1,0x263238,0xd9a441,0xf0c49c],[0xf06292,0x3e2723,0x111111,0xe8b48e],[0xaed581,0x1a237e,0x6b3e1e,0xf1c39b],[0xffd54f,0x4e342e,0x2b1b10,0xa8714a]];
function ztNpcSetup(G,n){const R=ztRng(ztHash(G.seed,808)),P=ZT.P,RD=ZT.RD;G.npcs=[];
  for(let i=0;i<n;i++){const bi=Math.floor(R()*6),bj=Math.floor(R()*6),x0=bi*P+RD-.35,x1=(bi+1)*P+.35,z0=bj*P+RD-.35,z1=(bj+1)*P+.35,c=ZT_NPCLOOK[i%ZT_NPCLOOK.length];
    G.npcs.push({id:"n"+i,i,npc:1,role:"h",loop:[x0,z0,x1,z1],s0:R()*4*(x1-x0),dir:R()<.5?1:-1,spd:1.1+R()*.4,x:0,z:0,yaw:0,sp:0,vx:0,vz:0,sc:.82,kid:false,
      look:{shirt:c[0],pants:c[1],hair:c[3]===0xa8714a?0x1d1d1d:c[2],skin:c[3],shoes:0xeeeeee,stripe:c[0]},fx:{shield:0,energy:0,shoes:0,brain:0,cloak:0,stun:0,immune:0,frozen:0,lead:0,stuck:0,slow:0},zt:null,cool:0});ztNpcLoopAt(G.npcs[i],0)}}
/* where a walker is on its loop round the block at time t */
function ztNpcLoopAt(n,t){const [x0,z0,x1,z1]=n.loop,w=x1-x0,h=z1-z0,L=2*(w+h);let s=((n.s0+n.dir*n.spd*Math.max(0,t))%L+L)%L;let x,z,dx,dz;
  if(s<w){x=x0+s;z=z0;dx=1;dz=0}else if((s-=w)<h){x=x1;z=z0+s;dx=0;dz=1}else if((s-=h)<w){x=x1-s;z=z1;dx=-1;dz=0}else{s-=w;x=x0;z=z1-s;dx=0;dz=-1}
  n.x=x;n.z=z;n.yaw=Math.atan2(dx*n.dir,dz*n.dir);n.sp=n.spd;n.vx=dx*n.dir*n.spd;n.vz=dz*n.dir*n.spd}
/* opts.convert: this phone decides when the zombie bites a walker; opts.grab: which humans this phone looks after; opts.gum: walkers can tread in gum */
function ztNpcStep(G,dt,ev,opts){const Z=ztZombie(G),team=G.mode==="team",biters=team?[...ztZombies(G),...G.npcs.filter(q=>q.zt!=null)]:Z?[Z]:[];
  for(const n of G.npcs){const f=n.fx;for(const k of ["stun","stuck"])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);n.cool=Math.max(0,n.cool-dt);
    if(n.zt==null){ztNpcLoopAt(n,G.t);
      if(opts.convert&&G.t>0)for(const B of biters){if(B===n||B.fx.frozen>0||B.fx.stun>0||B.fx.stuck>0||Math.hypot(B.x-n.x,B.z-n.z)>=1.15)continue;n.zt=G.t;n.role="z";ev.push({k:"npcbite",i:n.i,by:B.id,t:+G.t.toFixed(2)});break}continue}
    if(!team&&G.t-n.zt>30){/* wears off: back to normal */n.zt=null;n.role="h";ev.push({k:"npcfree",i:n.i});continue}
    /* little zombie: shuffle after the nearest human you can see */let T=null,td=16;for(const h of G.ents){if(h.role!=="h"||h.fx.cloak>0||h.fx.immune>0||h.car!=null)continue;const d=Math.hypot(h.x-n.x,h.z-n.z);if(d<td){td=d;T=h}}if(team&&!T){td=40;for(const h of G.ents){if(h.role!=="h"||h.car!=null)continue;const d=Math.hypot(h.x-n.x,h.z-n.z);if(d<td){td=d;T=h}}}
    const ox=n.x,oz=n.z;if(T&&f.stuck<=0&&f.stun<=0&&n.cool<=0){const dx=T.x-n.x,dz=T.z-n.z,l=Math.hypot(dx,dz)||1,v=team?3.3:2.3;n.x+=dx/l*v*dt;n.z+=dz/l*v*dt;n.yaw=Math.atan2(dx,dz)}
    ztCollide(G.W,n,.35);n.vx=(n.x-ox)/dt;n.vz=(n.z-oz)/dt;n.sp=Math.hypot(n.vx,n.vz);
    if(opts.gum)for(const b of G.bananas){if(b.gone||b.k!=="gum"||G.t<b.arm)continue;if(Math.hypot(n.x-b.x,n.z-b.z)<1){b.gone=1;f.stuck=ZT.stuckGum;ev.push({k:"stuck",e:n.id,b:b.id,npc:1})}}
    /* vs: grab a human (slows them right down). team: it's a real bite (costs a heart) */if(T&&n.cool<=0&&f.stuck<=0&&f.stun<=0&&td<.95&&(opts.grab||[]).includes(T)){if(team){if(T.fx.immune<=0){ztTeamHit(G,T,n,ev);n.cool=2}}else if(T.fx.slow<=0){T.fx.slow=1.6;n.cool=2.2;ev.push({k:"grab",i:n.i,on:T.id})}}}
  G.bananas=G.bananas.filter(b=>!b.gone)}

/* ================= TEAM UP: you (and Cass) against computer zombies. 5 shared hearts; a bite costs one. Spell ZOMBIE together to win ================= */
function ztTeamGame(G,o){const mid=3*ZT.P+5,start=[[2,4],[4,2],[2,2],[4,4]][Math.floor(ztRng(ztHash(G.seed,5))()*4)];let k=0;
  for(const p of o.players){const e=ztPerson(p);e.x=start[0]*ZT.P+5+(k++)*1.4;e.z=start[1]*ZT.P+5;e.fx.frozen=3;e.yaw=e.ta=Math.atan2(mid-e.x,mid-e.z)+Math.PI;G.ents.push(e)}
  /* the zombies are harder in team mode: full speed, quick to react; Cass's games are a touch easier */const kid=o.players.some(p=>p.kid),nz=o.zombies||2;
  for(let i=0;i<nz;i++){const z=ztPerson({id:"Z"+(i+1),name:"ZOMBIE",look:["knight","gus","pip"][i%3],bot:1,mul:kid?.88:.93});z.role="z";z.x=mid+(i?6:-6);z.z=mid;z.fx.frozen=3+ZT.wake;z.react=.22;G.ents.push(z)}
  for(let i=0;i<ZT.nPick;i++)G.picks.push(ztPickAt(G,i,0));ztLetterSpots(G);ztBoxSpots(G,o.boxes??3);ztNpcSetup(G,o.npcs??14);ztCarSetup(G);return G}
const ztHearts=G=>G.hearts-Object.values(G.hits).reduce((a,b)=>a+b,0);
/* a bite in team mode: lose a heart, a moment to get away, the zombie is pushed off */
function ztTeamHit(G,H,Z,ev){if(H.fx.shield>0){H.fx.shield=0;H.fx.immune=1.2;if(Z.fx)Z.fx.stun=ZT.stunShield;const e={k:"block",z:Z.id,h:H.id};ev.push(e);return e}
  G.hits[H.id]=(G.hits[H.id]||0)+1;H.fx.immune=4;H.fx.stun=.4;const dx=H.x-Z.x,dz=H.z-Z.z,d=Math.hypot(dx,dz)||1;H.vx=dx/d*5;H.vz=dz/d*5;/* the zombie stops to chew for a moment */if(Z.fx){Z.fx.frozen=Math.max(Z.fx.frozen,3)}
  const e={k:"hit",on:H.id,by:Z.id,hearts:ztHearts(G)};ev.push(e);return e}

/* ================= ZOMBIE CALL: the zombie calls a horde. ~160 slower, dumber zombies come from every side for 1 minute =================
   Everything about where they start comes from the seed, so both phones make the same horde. */
const ZT_HORDE={n:160,life:60,spd:ZT.run*1.08*.9};
function ztHordeCall(G,by,seed,t0){if(G.horde)return null;seed=seed??ztHash(G.seed,Math.floor(G.t*10),by.id.length,31);t0=t0??G.t;const R=ztRng(seed),W=G.W,hs=G.ents.filter(e=>e.role==="h");
  const cx=hs.length?hs.reduce((a,e)=>a+e.x,0)/hs.length:W.S/2,cz=hs.length?hs.reduce((a,e)=>a+e.z,0)/hs.length:W.S/2,list=[];
  for(let i=0;i<ZT_HORDE.n;i++){let x=0,z=0;for(let t=0;t<40;t++){const a=i/ZT_HORDE.n*Math.PI*2+R()*.3,r=34+R()*36;x=cx+Math.sin(a)*r;z=cz+Math.cos(a)*r;if(x>2&&z>2&&x<W.S-2&&z<W.S-2&&!ztHit(W,x,z,.5)&&W.reach[ztNi(W,x,z)]<65535)break;x=-1}
    if(x<0)continue;list.push({x,z,vx:0,vz:0,yaw:R()*6.28,ph:R(),spd:ZT_HORDE.spd*(.85+R()*.25),wob:R()*6.28,dumb:R()<.3,down:0,stuck:0,col:Math.floor(R()*6)})}
  G.horde={by:by.id,t0,seed,until:t0+ZT_HORDE.life,list,fields:{},ft:0};return G.horde}
function ztHordeStep(G,dt,ev,opts){const H=G.horde;if(!H)return;if(G.t>H.until+1.2){G.horde=null;ev.push({k:"hordeend"});return}const W=G.W,n=W.nav.n,ending=G.t>H.until;
  const hs=G.ents.filter(e=>e.role==="h"&&e.car==null);H.ft-=dt;
  /* a distance map from each human; refreshed now and then (they're not clever) */if(H.ft<=0){H.ft=.7;H.fields={};for(const h of hs)H.fields[h.id]=ztBfs(W,ztNi(W,h.x,h.z),150)}
  const bucket=new Map(),key=(x,z)=>((x/1.5)|0)*1000+((z/1.5)|0);for(const m of H.list)if(!m.down){const k=key(m.x,m.z);if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(m)}
  for(const m of H.list){if(m.down){m.down+=dt;continue}if(ending){m.sink=(m.sink||0)+dt;continue}if(m.stuck>0){m.stuck-=dt;m.vx=m.vz=0;continue}
    m.ph=(m.ph+dt*1.4)%1;let T=null,td=1e9;for(const h of hs){const d=Math.hypot(h.x-m.x,h.z-m.z);if(d<td){td=d;T=h}}
    let dx=0,dz=0;if(T){if(td<6||m.dumb){dx=T.x-m.x;dz=T.z-m.z}else{const D=H.fields[T.id];if(D){const c=ztNi(W,m.x,m.z),cx=c%n,cz=(c/n)|0;let best=c,bd=D[c];
          for(let oz=-1;oz<=1;oz++)for(let ox=-1;ox<=1;ox++){const X=cx+ox,Z=cz+oz;if(X<0||Z<0||X>=n||Z>=n)continue;const k=Z*n+X;if(D[k]<bd){bd=D[k];best=k}}dx=best%n+.5-m.x;dz=((best/n)|0)+.5-m.z}}}
    /* wobbly and a bit dim: they sway about as they come */m.wob+=dt*(1+m.col*.2);const l=Math.hypot(dx,dz)||1;dx=dx/l+Math.sin(m.wob)*.35;dz=dz/l+Math.cos(m.wob*.8)*.35;const l2=Math.hypot(dx,dz)||1;
    const tx=dx/l2*m.spd,tz=dz/l2*m.spd,k=1-Math.exp(-dt*6);m.vx+=(tx-m.vx)*k;m.vz+=(tz-m.vz)*k;
    /* don't all pile into one spot */const b=bucket.get(key(m.x,m.z));if(b)for(const o of b){if(o===m)continue;const ex=m.x-o.x,ez=m.z-o.z,e2=ex*ex+ez*ez;if(e2<.5&&e2>1e-6){const e=Math.sqrt(e2),p=(.71-e)*2;m.vx+=ex/e*p;m.vz+=ez/e*p}}
    m.x+=m.vx*dt;m.z+=m.vz*dt;ztCollide(W,m,.32);m.yaw=Math.atan2(m.vx,m.vz);
    for(const g of G.bananas)if(g.k==="gum"&&!g.gone&&G.t>=g.arm&&Math.hypot(m.x-g.x,m.z-g.z)<1){m.stuck=ZT.stuckGum;g.gone=1;ev.push({k:"stuck",e:"horde",b:g.id,npc:1})}
    /* a horde zombie reaches a human */if(T&&td<.9&&(opts.bite||[]).includes(T)&&T.fx.immune<=0&&T.fx.frozen<=0){if(G.mode==="team")ztTeamHit(G,T,{id:"horde",fx:null,x:m.x,z:m.z},ev);
      else{const Z=ztZombie(G);if(Z&&G.cool<=0){const zx=Z.x,zz=Z.z;Z.x=m.x;Z.z=m.z;const e=ztBite(G,Z,T,ev);if(e&&e.k!=="tag"){Z.x=zx;Z.z=zz}else if(e){/* the zombie player keeps their place */Z.x=zx;Z.z=zz;e.horde=1}}}}}
  G.bananas=G.bananas.filter(b=>!b.gone)}

/* ================= CARS: a few special cars humans can drive for 1 minute (then they kick you out and that car's done).
   You can't be bitten in a car, and you can ram zombies (they're knocked dizzy) and bowl over the horde ================= */
const ZT_CAR={n:6,time:60,spd:9.5,boost:12.5,turn:2.8,r:1.25,useR:2.4};
function ztCarSetup(G){const W=G.W,R=ztRng(ztHash(W.seed,909)),cars=W.rects.filter(r=>r.k==="car"&&!r.lot),pick=W.dcars||[];if(!W.dcars){W.dcars=pick;
  /* spread them out: one from each part of town */for(let i=0;i<ZT_CAR.n&&cars.length;i++){const cx=(i%3+.5)*W.S/3,cz=(Math.floor(i/3)+.5)*W.S/2;let best=null,bd=1e9;for(const r of cars){if(pick.includes(r))continue;const d=Math.hypot((r.x0+r.x1)/2-cx,(r.z0+r.z1)/2-cz)+R()*20;if(d<bd){bd=d;best=r}}if(best)pick.push(best)}
  W.rects=W.rects.filter(r=>!pick.includes(r));ztIndex(W)}/* they're not in the way of anyone (you get in by walking up to them) */
  G.cars=pick.map((r,i)=>({i,x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2,yaw:(r.x1-r.x0)>(r.z1-r.z0)?Math.PI/2:0,col:r.col,sp:0,vx:0,vz:0,by:null,left:ZT_CAR.time,used:0}))}
const ztCarNear=(G,e)=>e.role!=="h"||e.npc||e.car!=null?null:G.cars.find(c=>!c.used&&!c.by&&Math.hypot(c.x-e.x,c.z-e.z)<ZT_CAR.useR)||null;
function ztCarToggle(G,e,ev){if(e.car!=null)return ztCarExit(G,e,ev);const c=ztCarNear(G,e);if(!c||e.fx.frozen>0||e.fx.stun>0)return;c.by=e.id;e.car=c.i;e.x=c.x;e.z=c.z;e.yaw=c.yaw;e.vx=e.vz=0;ev.push({k:"carin",e:e.id,c:c.i})}
function ztCarExit(G,e,ev){const c=G.cars[e.car];if(!c)return;c.by=null;c.used=1;c.sp=0;e.car=null;
  /* climb out of the side of the car */const sx=Math.cos(c.yaw),sz=-Math.sin(c.yaw);for(const s of [1.7,-1.7,2.6,-2.6]){const q={x:c.x+sx*s,z:c.z+sz*s};if(!ztHit(G.W,q.x,q.z,.5)){e.x=q.x;e.z=q.z;break}}ztCollide(G.W,e,.45);e.fx.immune=Math.max(e.fx.immune,1.5);e.vx=e.vz=0;ev.push({k:"carout",e:e.id,c:c.i})}
function ztDrive(G,e,inp,dt){const c=G.cars[e.car],f=e.fx;for(const k of ["energy","shoes","brain","cloak","stun","immune","frozen","lead","stuck","slow"])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
  c.left-=dt;if(c.left<=0){ztCarExit(G,e,G.ev);G.ev.push({k:"carout",e:e.id,c:c.i,fuel:1});return}
  const d=ztSnap(inp.mx||0,inp.mz||0),want=d?(inp.sprint?ZT_CAR.boost:ZT_CAR.spd):0;
  /* steer: the car turns towards where you point (faster turning when it's moving) */if(d){let da=d.a-c.yaw;da=((da%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;const mt=ZT_CAR.turn*dt*Math.min(1,.35+c.sp/5);c.yaw+=ztCl(da,-mt,mt)}
  c.sp+=((want*(d?Math.max(.25,Math.cos(Math.min(Math.PI/2,Math.abs((((d.a-c.yaw)%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI)))):0))-c.sp)*(1-Math.exp(-dt*(want>c.sp?1.6:2.6)));
  const ox=c.x,oz=c.z;c.x+=Math.sin(c.yaw)*c.sp*dt;c.z+=Math.cos(c.yaw)*c.sp*dt;ztCollide(G.W,c,ZT_CAR.r);const moved=Math.hypot(c.x-ox,c.z-oz)/dt;if(moved<c.sp*.5&&c.sp>2){c.sp*=.6;G.ev.push({k:"bump",c:c.i})}
  c.vx=(c.x-ox)/dt;c.vz=(c.z-oz)/dt;e.x=c.x;e.z=c.z;e.yaw=c.yaw;e.ta=c.yaw;e.vx=c.vx;e.vz=c.vz;e.sp=0;e.spr=false;e.st=Math.min(1,e.st+dt/ZT.refill)}
/* knock zombies flying when the car hits them */
function ztRam(G,e,ev){const c=G.cars[e.car];if(!c||c.sp<3)return;const R=ZT_CAR.r+.4;
  for(const z of G.ents){if(z.role!=="z"||z.fx.stun>1)continue;const dx=z.x-c.x,dz=z.z-c.z,d=Math.hypot(dx,dz);if(d<R){z.fx.stun=2;z.vx=dx/(d||1)*8;z.vz=dz/(d||1)*8;z.x+=dx/(d||1)*.6;z.z+=dz/(d||1)*.6;ztCollide(G.W,z,.45);ev.push({k:"ram",on:z.id,by:e.id})}}
  for(const n of G.npcs){if(n.zt==null||n.fx.stun>1)continue;const dx=n.x-c.x,dz=n.z-c.z,d=Math.hypot(dx,dz);if(d<R){n.fx.stun=2.5;n.x+=dx/(d||1)*1.2;n.z+=dz/(d||1)*1.2;ztCollide(G.W,n,.35);ev.push({k:"ram",on:n.id,by:e.id,npc:1})}}
  if(G.horde)for(const m of G.horde.list){if(m.down)continue;if(Math.hypot(m.x-c.x,m.z-c.z)<R){m.down=.001;m.fx=(m.x-c.x)*3;m.fz=(m.z-c.z)*3;ev.push({k:"bowl",by:e.id})}}}

/* ---------------- moving: 8 directions, same speed on the diagonals, a sprint bar that runs out ---------------- */
/* steering goes exactly where your thumb points (any direction); same speed whichever way */
function ztSnap(mx,mz){const m=Math.hypot(mx,mz);if(m<.15)return null;const a=Math.atan2(mx,mz);return{x:Math.sin(a),z:Math.cos(a),m:Math.min(1,m),a}}
function ztMove(G,e,inp,dt){if(e.car!=null)return ztDrive(G,e,inp,dt);const f=e.fx;for(const k of ["energy","shoes","brain","cloak","stun","immune","frozen","lead","stuck","slow"])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
  const busy=f.frozen>0||f.stun>0||f.stuck>0,d=busy?null:ztSnap(inp.mx||0,inp.mz||0);let want=d?(d.m<.45?ZT.walk:ZT.run):0;e.spr=false;
  if(d&&inp.sprint&&!e.tired&&e.st>0&&d.m>=.45){want=ZT.sprint;e.spr=true}
  /* zombies are a little quicker on their feet (they're hungry) */want*=(e.mul||1)*(f.slow>0?.55:1)*(f.shoes>0?1.35:1)*(e.role==="z"?ZT.zfast*(f.brain>0?1.25:1):1);
  /* sprint bar: empties while sprinting, fills again while not. Run it flat and you're tired until it's a third full */
  if(e.spr&&f.energy<=0){e.st-=dt/(ZT.drain*(e.stK||1));if(e.st<=0){e.st=0;e.tired=1}}
  else if(!e.spr){e.st=Math.min(1,e.st+dt*(e.stK||1)/ZT.refill);if(e.tired&&e.st>.33)e.tired=0}if(f.energy>0){e.st=1;e.tired=0}
  const tx=d?d.x*want:0,tz=d?d.z*want:0,k=1-Math.exp(-dt*(Math.hypot(tx,tz)>Math.hypot(e.vx,e.vz)?ZT.acc:ZT.dec));e.vx+=(tx-e.vx)*k;e.vz+=(tz-e.vz)*k;
  const ox=e.x,oz=e.z;e.x+=e.vx*dt;e.z+=e.vz*dt;ztCollide(G.W,e,ZT.r*(e.sc||1));e.vx=(e.x-ox)/dt;e.vz=(e.z-oz)/dt;e.sp=Math.hypot(e.vx,e.vz);
  /* turn smoothly to face the way you're going */if(d)e.ta=d.a;let da=e.ta-e.yaw;da=((da%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;const mt=ZT.turn*dt;e.yaw+=ztCl(da,-mt,mt);
  if(e.role==="z")e.ztime+=dt}

/* ---------------- the bite ---------------- */
function ztTagR(Z,H){return ZT.tagR*((Z.sc+H.sc)/2)+(Z.kid?.22:0)-(H.kid?.15:0)}
function ztTagCheck(G,ev){if(G.mode==="team"){if(G.t<0)return null;for(const Z of ztZombies(G)){if(Z.fx.frozen>0||Z.fx.stun>0||Z.fx.stuck>0)continue;for(const H of G.ents){if(H.role!=="h"||H.fx.immune>0||H.car!=null)continue;if(Math.hypot(Z.x-H.x,Z.z-H.z)<ztTagR(Z,H))return ztTeamHit(G,H,Z,ev)}}return null}
  if(G.cool>0||G.t<0)return null;const Z=ztZombie(G);if(!Z||Z.fx.frozen>0||Z.fx.stun>0)return null;
  for(const H of G.ents){if(H.role!=="h"||H.fx.immune>0||H.fx.frozen>0||H.car!=null)continue;if(Math.hypot(Z.x-H.x,Z.z-H.z)<ztTagR(Z,H))return ztBite(G,Z,H,ev)}return null}
/* Z bites H. A shield stops it once (and knocks the zombie dizzy); otherwise they swap: H turns into the zombie, Z turns back into a human with 1.5 s to get away */
function ztBite(G,Z,H,ev){G.cool=ZT.tagCool;const dx=Z.x-H.x,dz=Z.z-H.z,d=Math.hypot(dx,dz)||1;
  if(H.fx.shield>0){H.fx.shield=0;H.fx.immune=1;Z.fx.stun=ZT.stunShield;Z.vx=dx/d*7;Z.vz=dz/d*7;const e={k:"block",z:Z.id,h:H.id};ev.push(e);return e}
  /* the new zombie has to wait (count to 3) while the one who got away runs off; they can't be bitten back until well clear */const fr=ZT.tagT+ZT.morphT;Z.role="h";H.role="z";Z.fx.frozen=fr;H.fx.frozen=fr+ZT.lead;H.fx.lead=fr+ZT.lead;Z.fx.immune=fr+ZT.lead+ZT.immune;Z.fx.brain=0;H.fx.cloak=0;H.fx.shield=0;Z.tags++;G.nTag++;
  Z.vx=Z.vz=H.vx=H.vz=0;Z.ta=Math.atan2(-dx,-dz);H.ta=Math.atan2(dx,dz);const e={k:"tag",by:Z.id,on:H.id,x:+((Z.x+H.x)/2).toFixed(2),z:+((Z.z+H.z)/2).toFixed(2)};ev.push(e);return e}
/* one step of the whole game (solo: everyone is simulated here). inputs: {id:{mx,mz,sprint,item}} */
function ztStep(G,inputs,dt){const ev=G.ev.length?G.ev.splice(0):[];if(G.over)return ev;G.t+=dt;G.cool=Math.max(0,G.cool-dt);
  for(const e of G.ents){const inp=(inputs&&inputs[e.id])||{};if(inp.item)ztUseItem(G,e,ev);if(inp.drive)ztCarToggle(G,e,ev);ztMove(G,e,inp,dt);if(e.car!=null)ztRam(G,e,ev);ztPickups(G,e,ev);if(e.car==null)ztSlips(G,e,ev);if(!e.bot&&e.car==null)ztBoxes(G,e,ev);if(ztLetters(G,e,ev))return ev}
  ztNpcStep(G,dt,ev,{convert:true,grab:G.ents,gum:true});ztHordeStep(G,dt,ev,{bite:G.ents});ztTagCheck(G,ev);ztRespawn(G);
  if(G.mode==="team"&&ztHearts(G)<=0&&!G.over){G.over=1;ev.push({k:"end",team:1,lost:1});return ev}
  if(G.t>=G.dur){G.over=1;if(G.mode==="team")ev.push({k:"end",team:1,survived:1});else{const Z=ztZombie(G);ev.push({k:"end",loser:Z&&Z.id})}}return ev}

/* ---------------- computer players ---------------- */
function ztBotInput(G,e,dt){const B=e.B||(e.B={t:0,wp:null,path:null,pi:0,goal:null,stuck:0,lx:e.x,lz:e.z,R:ztRng(ztHash(G.seed,e.id.length,e.id.charCodeAt(0),5))}),W=G.W;B.t-=dt;
  if(e.fx.frozen>0||e.fx.stun>0)return{};
  /* stuck against something? pick a new plan */B.stuck=Math.hypot(e.x-B.lx,e.z-B.lz)<dt*.6?B.stuck+dt:0;B.lx=e.x;B.lz=e.z;if(B.stuck>.7){B.t=0;B.goal=null;B.stuck=0;B.jig=.5}
  const go=(tx,tz,spr)=>{const dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz)||1;return{mx:dx/l,mz:dz/l,sprint:!!spr}};
  if(B.jig>0){B.jig-=dt;return{mx:Math.sin(B.R()*6.28),mz:Math.cos(B.R()*6.28)}}
  if(e.role==="z"){/* chase the nearest human it can see */let T=null,td=1e9;for(const h of G.ents){if(h.role!=="h"||h.car!=null)continue;let d=Math.hypot(h.x-e.x,h.z-e.z);if(h.fx.cloak>0&&d>3)continue;if(h.fx.immune>0)d+=25;if(!h.bot)d-=7;/* likes chasing real people */if(d<td){td=d;T=h}}
    /* team mode: if a person in the street is a lot nearer than any human, go and turn them */if(G.mode==="team"){let w=null,wd=Math.min(22,td*.55);for(const n of G.npcs){if(n.zt!=null)continue;const d=Math.hypot(n.x-e.x,n.z-e.z);if(d<wd){wd=d;w=n}}if(w){T=w;td=wd}}
    if(!T){/* nobody visible: wander to a pickup */return ztBotWander(G,e,B,dt,go)}
    const tx=T.x+T.vx*.25,tz=T.z+T.vz*.25,spr=(td<12&&e.st>.2)||(e.st>.97&&td<35);
    if(td<9&&ztLos(W,e.x,e.z,tx,tz))return go(tx,tz,spr);
    if(B.t<=0||!B.D||B.tgt!==T.id){B.t=e.react||.3;B.tgt=T.id;B.D=ztBfs(W,ztNi(W,T.x,T.z),260)}
    const wp=ztDescend(W,B.D,e.x,e.z,12);if(!wp)return go(tx,tz,spr);return go(wp[0],wp[1],spr)}
  /* human: run away from the zombie, the further the better, through open streets */
  const Z=ztZombie(G);if(!Z)return{};const zd=Math.hypot(Z.x-e.x,Z.z-e.z),out={};
  if(e.item&&zd<6&&Z.fx.stun<=0&&Z.fx.stuck<=0)out.item=1;
  if(zd>34&&Z.fx.frozen<=0||(Z.fx.frozen>2))return{...ztBotWander(G,e,B,dt,go),...out};
  if(B.t<=0||!B.path||B.pi>=B.path.length){B.t=e.react?e.react+.25:.55;const ZD=ztBfs(W,ztNi(W,Z.x,Z.z),90),me=ztNi(W,e.x,e.z),OD=ztBfs(W,me,24),n=W.nav.n;let best=-1,bs=-1e9;
    for(let k=0;k<OD.length;k+=2){const o=OD[k];if(o===65535||o<4)continue;const zz=Math.min(ZD[k],90);if(zz<=o)continue;/* the zombie would get there first */const s=zz-o*.45+B.R()*3;if(s>bs){bs=s;best=k}}
    if(best>=0){/* walk back from the goal to me along the distance map */const path=[];let c=best;for(let g=0;g<60&&OD[c]>0;g++){path.push(c);const cx=c%n,cz=(c/n)|0;let nb=c,nd=OD[c];
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const X=cx+dx,Z2=cz+dz;if(X<0||Z2<0||X>=n||Z2>=n)continue;const k2=Z2*n+X;if(OD[k2]<nd){nd=OD[k2];nb=k2}}if(nb===c)break;c=nb}
      B.path=path.reverse().map(c=>[c%n+.5,((c/n)|0)+.5]);B.pi=0}else B.path=null}
  out.sprint=zd<7&&e.st>.05;
  if(B.path){/* skip ahead to the furthest point I can run straight to */let j=B.pi;for(let k=Math.min(B.path.length-1,B.pi+10);k>B.pi;k--)if(ztLos(W,e.x,e.z,B.path[k][0],B.path[k][1])){j=k;break}B.pi=j;const p=B.path[j];
    if(Math.hypot(p[0]-e.x,p[1]-e.z)<.8)B.pi++;return{...go(p[0],p[1],out.sprint),item:out.item}}
  const dx=e.x-Z.x,dz=e.z-Z.z,l=Math.hypot(dx,dz)||1;return{mx:dx/l,mz:dz/l,sprint:out.sprint,item:out.item}}
function ztBotWander(G,e,B,dt,go){if(B.goal&&B.goalL!=null&&G.letters[B.goalL].by)B.goal=null;
  if(!B.goal||Math.hypot(B.goal[0]-e.x,B.goal[1]-e.z)<1.2||B.t<-8){let best=null,bd=40;B.goalL=null;for(const p of G.picks)if(p.on&&ztCanGet(e,p.type)){const d=Math.hypot(p.x-e.x,p.z-e.z);if(d<bd){bd=d;best=[p.x,p.z]}}
    if(!best){for(let n=0;n<50;n++){const x=e.x+(B.R()-.5)*50,z=e.z+(B.R()-.5)*50;if(x>2&&z>2&&x<G.W.S-2&&z<G.W.S-2&&!ztHit(G.W,x,z,1)&&G.W.reach[ztNi(G.W,x,z)]<65535){best=[x,z];break}}}
    B.goal=best;B.t=0;B.WD=best?ztBfs(G.W,ztNi(G.W,best[0],best[1]),200):null}
  if(!B.goal||!B.WD)return{};const wp=ztDescend(G.W,B.WD,e.x,e.z,12)||B.goal,r=go(wp[0],wp[1],false);if(e.role==="h"){r.mx*=.55;r.mz*=.55}return r}
if(typeof module!=="undefined")module.exports={ztZombies,ztTeamGame,ztHearts,ztTeamHit,ZT_HORDE,ztHordeCall,ztHordeStep,ZT_CAR,ztCarSetup,ztCarNear,ztCarToggle,ztCarExit,ztDrive,ztRam,ZT_WORD,ztLetterSpots,ztLetters,ztLetterCount,ztBoxSpots,ztBoxes,ztNpcSetup,ztNpcLoopAt,ztNpcStep,ZT,ZT_LOOKS,ZT_PK,ZT_PKI,ZT_PKN,ztRng,ztHash,ztWorld,ztHit,ztCollide,ztNav,ztNi,ztBfs,ztLos,ztDescend,ztPerson,ztGame,ztZombie,ztPickAt,ztCanGet,ztGive,ztPickups,ztRespawn,ztUseItem,ztSlips,ztSnap,ztMove,ztTagR,ztTagCheck,ztBite,ztStep,ztBotInput};
