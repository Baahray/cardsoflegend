/* ===================== ZOMBIE TAG: the rules, the city, moving about and the computer players (no drawing) =====================
   Shared by the game, the bots and the tests.  World: x to the right (east), z down the screen (south), y up.
   Characters are about 2 units tall.  Walking 2 units/s, running 4, sprinting 6. */
const ZT={S:202,P:32,RD:10,dt:1/60,r:.45,walk:2,run:4,sprint:6,acc:12,dec:9,turn:14,drain:3.6,refill:5,
  tagR:1.15,zfast:1.08,tagCool:.8,tagT:.25,morphT:.4,immune:1.5,lead:3,stunShield:1.2,stunBanana:1.4,pickR:1.25,nPick:22,respawn:10,wake:2};
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
    else if(t==="lot"){W.lot.push([bx,bz,bx+B,bz+B]);for(const row of [bz+2.5,bz+9,bz+15.5])for(let x=bx+1.5;x+2.1<bx+B-1;x+=2.9){if(R()<.68)rect(x,row,x+2.1,row+4.4,{k:"car",h:1.45,col:Math.floor(R()*8),dir:0})}
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
  st:1,tired:0,spr:false,item:null,fx:{shield:0,energy:0,shoes:0,brain:0,cloak:0,stun:0,immune:0,frozen:0,lead:0},ztime:0,tags:0}}
const ZT_STARTS=[[2,2],[4,4],[4,2],[2,4]];
/* a new game. players: [{id,name,look,kid,bot,mul,stK}], z = id of the first zombie */
function ztGame(o){const W=o.W||ztWorld(o.seed),G={seed:o.seed,W,t:-3,dur:o.dur||120,cool:0,nTag:0,over:0,ents:[],picks:[],bananas:[],bn:0,ev:[]};
  const mid=3*ZT.P+5;let k=0;for(const p of o.players){const e=ztPerson(p);if(e.id===o.z){e.role="z";e.x=mid;e.z=mid;e.fx.frozen=3+ZT.wake}else{const s=ZT_STARTS[(k++)%4];e.x=s[0]*ZT.P+5;e.z=s[1]*ZT.P+5;e.fx.frozen=3}
    e.yaw=e.ta=Math.atan2(mid-e.x,mid-e.z)+(e.role==="z"?0:Math.PI);G.ents.push(e)}
  for(let i=0;i<ZT.nPick;i++)G.picks.push(ztPickAt(G,i,0));return G}
const ztZombie=G=>G.ents.find(e=>e.role==="z");

/* ---------------- pickups ---------------- */
const ZT_PK=[["shield",23],["energy",20],["shoes",15],["banana",15],["brain",10],["cloak",9],["mystery",8]];
const ZT_PKI={shield:"🛡️",energy:"⚡",shoes:"👟",banana:"🍌",brain:"🧠",cloak:"👻",mystery:"❓"};
const ZT_PKN={shield:"SHIELD! blocks one bite",energy:"ENERGY! sprint all you like",shoes:"ROCKET SHOES!",banana:"BANANA! tap 🍌 to drop it",brain:"BRAINS! zombie speed",cloak:"GHOST! the zombie can't see you",mystery:"MYSTERY BOX!"};
/* where slot i appears the s-th time: the same on both phones */
function ztPickAt(G,i,s){const R=ztRng(ztHash(G.seed,i,s,77)),W=G.W;let x=0,z=0;for(let n=0;n<400;n++){x=4+R()*(W.S-8);z=4+R()*(W.S-8);if(!ztHit(W,x,z,1.1)&&W.reach[ztNi(W,x,z)]<65535)break}
  let u=R()*100,type="shield";for(const [k,w] of ZT_PK){if(u<w){type=k;break}u-=w}return{i,s,x:+x.toFixed(2),z:+z.toFixed(2),type,on:1,at:0}}
function ztCanGet(e,t){return t==="shield"?e.role==="h"&&!e.fx.shield:t==="cloak"?e.role==="h":t==="brain"?e.role==="z":t==="banana"?!e.item:true}
function ztGive(G,e,t,R){if(t==="mystery"){const opts=["energy","shoes","banana",...(e.role==="h"?["shield","cloak"]:["brain"])].filter(k=>ztCanGet(e,k));t=opts[Math.floor((R?R():Math.random())*opts.length)]||"energy"}
  const f=e.fx;if(t==="shield")f.shield=1;else if(t==="energy"){f.energy=4;e.st=1;e.tired=0}else if(t==="shoes")f.shoes=5;else if(t==="banana")e.item="banana";else if(t==="brain")f.brain=5;else if(t==="cloak")f.cloak=6;return t}
function ztPickups(G,e,ev){for(const p of G.picks){if(!p.on||Math.hypot(e.x-p.x,e.z-p.z)>ZT.pickR||!ztCanGet(e,p.type))continue;
    const got=ztGive(G,e,p.type,ztRng(ztHash(G.seed,p.i,p.s,9)));p.on=0;p.at=G.t+ZT.respawn;ev.push({k:"pick",e:e.id,i:p.i,s:p.s,type:p.type,got})}}
function ztRespawn(G){for(let j=0;j<G.picks.length;j++){const p=G.picks[j];if(!p.on&&G.t>=p.at)G.picks[j]=ztPickAt(G,p.i,p.s+1)}}
/* bananas: drop one behind you; whoever else steps on it slips over */
function ztUseItem(G,e,ev){if(e.item!=="banana"||e.fx.frozen>0)return false;const b={id:e.id+"-"+(++G.bn)+"-"+Math.floor(G.t*10),x:e.x-Math.sin(e.yaw)*1.25,z:e.z-Math.cos(e.yaw)*1.25,by:e.id,arm:G.t+.35};
  const q={x:b.x,z:b.z};ztCollide(G.W,q,.3);b.x=+q.x.toFixed(2);b.z=+q.z.toFixed(2);G.bananas.push(b);e.item=null;ev.push({k:"drop",e:e.id,b});return true}
function ztSlips(G,e,ev){for(const b of G.bananas){if(b.by===e.id||G.t<b.arm||e.fx.frozen>0)continue;if(Math.hypot(e.x-b.x,e.z-b.z)<.9){b.gone=1;e.fx.stun=ZT.stunBanana;e.vx*=.3;e.vz*=.3;ev.push({k:"slip",e:e.id,b:b.id})}}
  G.bananas=G.bananas.filter(b=>!b.gone)}

/* ---------------- moving: 8 directions, same speed on the diagonals, a sprint bar that runs out ---------------- */
function ztSnap(mx,mz){const m=Math.hypot(mx,mz);if(m<.18)return null;const a=Math.round(Math.atan2(mx,mz)/(Math.PI/4))*(Math.PI/4);return{x:Math.sin(a),z:Math.cos(a),m:Math.min(1,m),a}}
function ztMove(G,e,inp,dt){const f=e.fx;for(const k of ["energy","shoes","brain","cloak","stun","immune","frozen","lead"])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
  const busy=f.frozen>0||f.stun>0,d=busy?null:ztSnap(inp.mx||0,inp.mz||0);let want=d?(d.m<.62?ZT.walk:ZT.run):0;e.spr=false;
  if(d&&inp.sprint&&!e.tired&&e.st>0&&d.m>=.62){want=ZT.sprint;e.spr=true}
  /* zombies are a little quicker on their feet (they're hungry) */want*=(e.mul||1)*(f.shoes>0?1.35:1)*(e.role==="z"?ZT.zfast*(f.brain>0?1.25:1):1);
  /* sprint bar: empties while sprinting, fills again while not. Run it flat and you're tired until it's a third full */
  if(e.spr&&f.energy<=0){e.st-=dt/(ZT.drain*(e.stK||1));if(e.st<=0){e.st=0;e.tired=1}}
  else if(!e.spr){e.st=Math.min(1,e.st+dt*(e.stK||1)/ZT.refill);if(e.tired&&e.st>.33)e.tired=0}if(f.energy>0){e.st=1;e.tired=0}
  const tx=d?d.x*want:0,tz=d?d.z*want:0,k=1-Math.exp(-dt*(Math.hypot(tx,tz)>Math.hypot(e.vx,e.vz)?ZT.acc:ZT.dec));e.vx+=(tx-e.vx)*k;e.vz+=(tz-e.vz)*k;
  const ox=e.x,oz=e.z;e.x+=e.vx*dt;e.z+=e.vz*dt;ztCollide(G.W,e,ZT.r*(e.sc||1));e.vx=(e.x-ox)/dt;e.vz=(e.z-oz)/dt;e.sp=Math.hypot(e.vx,e.vz);
  /* turn smoothly to face the way you're going */if(d)e.ta=d.a;let da=e.ta-e.yaw;da=((da%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;const mt=ZT.turn*dt;e.yaw+=ztCl(da,-mt,mt);
  if(e.role==="z")e.ztime+=dt}

/* ---------------- the bite ---------------- */
function ztTagR(Z,H){return ZT.tagR*((Z.sc+H.sc)/2)+(Z.kid?.22:0)-(H.kid?.15:0)}
function ztTagCheck(G,ev){if(G.cool>0||G.t<0)return null;const Z=ztZombie(G);if(!Z||Z.fx.frozen>0||Z.fx.stun>0)return null;
  for(const H of G.ents){if(H.role!=="h"||H.fx.immune>0||H.fx.frozen>0)continue;if(Math.hypot(Z.x-H.x,Z.z-H.z)<ztTagR(Z,H))return ztBite(G,Z,H,ev)}return null}
/* Z bites H. A shield stops it once (and knocks the zombie dizzy); otherwise they swap: H turns into the zombie, Z turns back into a human with 1.5 s to get away */
function ztBite(G,Z,H,ev){G.cool=ZT.tagCool;const dx=Z.x-H.x,dz=Z.z-H.z,d=Math.hypot(dx,dz)||1;
  if(H.fx.shield>0){H.fx.shield=0;H.fx.immune=1;Z.fx.stun=ZT.stunShield;Z.vx=dx/d*7;Z.vz=dz/d*7;const e={k:"block",z:Z.id,h:H.id};ev.push(e);return e}
  /* the new zombie has to wait (count to 3) while the one who got away runs off; they can't be bitten back until well clear */const fr=ZT.tagT+ZT.morphT;Z.role="h";H.role="z";Z.fx.frozen=fr;H.fx.frozen=fr+ZT.lead;H.fx.lead=fr+ZT.lead;Z.fx.immune=fr+ZT.lead+ZT.immune;Z.fx.brain=0;H.fx.cloak=0;H.fx.shield=0;Z.tags++;G.nTag++;
  Z.vx=Z.vz=H.vx=H.vz=0;Z.ta=Math.atan2(-dx,-dz);H.ta=Math.atan2(dx,dz);const e={k:"tag",by:Z.id,on:H.id,x:+((Z.x+H.x)/2).toFixed(2),z:+((Z.z+H.z)/2).toFixed(2)};ev.push(e);return e}
/* one step of the whole game (solo: everyone is simulated here). inputs: {id:{mx,mz,sprint,item}} */
function ztStep(G,inputs,dt){const ev=[];if(G.over)return ev;G.t+=dt;G.cool=Math.max(0,G.cool-dt);
  for(const e of G.ents){const inp=(inputs&&inputs[e.id])||{};if(inp.item)ztUseItem(G,e,ev);ztMove(G,e,inp,dt);ztPickups(G,e,ev);ztSlips(G,e,ev)}
  ztTagCheck(G,ev);ztRespawn(G);if(G.t>=G.dur){G.over=1;const Z=ztZombie(G);ev.push({k:"end",loser:Z&&Z.id})}return ev}

/* ---------------- computer players ---------------- */
function ztBotInput(G,e,dt){const B=e.B||(e.B={t:0,wp:null,path:null,pi:0,goal:null,stuck:0,lx:e.x,lz:e.z,R:ztRng(ztHash(G.seed,e.id.length,e.id.charCodeAt(0),5))}),W=G.W;B.t-=dt;
  if(e.fx.frozen>0||e.fx.stun>0)return{};
  /* stuck against something? pick a new plan */B.stuck=Math.hypot(e.x-B.lx,e.z-B.lz)<dt*.6?B.stuck+dt:0;B.lx=e.x;B.lz=e.z;if(B.stuck>.7){B.t=0;B.goal=null;B.stuck=0;B.jig=.5}
  const go=(tx,tz,spr)=>{const dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz)||1;return{mx:dx/l,mz:dz/l,sprint:!!spr}};
  if(B.jig>0){B.jig-=dt;return{mx:Math.sin(B.R()*6.28),mz:Math.cos(B.R()*6.28)}}
  if(e.role==="z"){/* chase the nearest human it can see */let T=null,td=1e9;for(const h of G.ents){if(h.role!=="h")continue;let d=Math.hypot(h.x-e.x,h.z-e.z);if(h.fx.cloak>0&&d>3)continue;if(h.fx.immune>0)d+=25;if(!h.bot)d-=7;/* likes chasing real people */if(d<td){td=d;T=h}}
    if(!T){/* nobody visible: wander to a pickup */return ztBotWander(G,e,B,dt,go)}
    const tx=T.x+T.vx*.25,tz=T.z+T.vz*.25,spr=(td<12&&e.st>.2)||(e.st>.97&&td<35);
    if(td<9&&ztLos(W,e.x,e.z,tx,tz))return go(tx,tz,spr);
    if(B.t<=0||!B.D||B.tgt!==T.id){B.t=e.react||.3;B.tgt=T.id;B.D=ztBfs(W,ztNi(W,T.x,T.z),260)}
    const wp=ztDescend(W,B.D,e.x,e.z,12);if(!wp)return go(tx,tz,spr);return go(wp[0],wp[1],spr)}
  /* human: run away from the zombie, the further the better, through open streets */
  const Z=ztZombie(G);if(!Z)return{};const zd=Math.hypot(Z.x-e.x,Z.z-e.z),out={};
  if(e.item==="banana"&&zd<6&&Z.fx.stun<=0)out.item=1;
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
function ztBotWander(G,e,B,dt,go){if(!B.goal||Math.hypot(B.goal[0]-e.x,B.goal[1]-e.z)<1.2||B.t<-8){let best=null,bd=40;for(const p of G.picks)if(p.on&&ztCanGet(e,p.type)){const d=Math.hypot(p.x-e.x,p.z-e.z);if(d<bd){bd=d;best=[p.x,p.z]}}
    if(!best){for(let n=0;n<50;n++){const x=e.x+(B.R()-.5)*50,z=e.z+(B.R()-.5)*50;if(x>2&&z>2&&x<G.W.S-2&&z<G.W.S-2&&!ztHit(G.W,x,z,1)&&G.W.reach[ztNi(G.W,x,z)]<65535){best=[x,z];break}}}
    B.goal=best;B.t=0;B.WD=best?ztBfs(G.W,ztNi(G.W,best[0],best[1]),200):null}
  if(!B.goal||!B.WD)return{};const wp=ztDescend(G.W,B.WD,e.x,e.z,12)||B.goal,r=go(wp[0],wp[1],false);if(e.role==="h"){r.mx*=.55;r.mz*=.55}return r}
if(typeof module!=="undefined")module.exports={ZT,ZT_LOOKS,ZT_PK,ZT_PKI,ZT_PKN,ztRng,ztHash,ztWorld,ztHit,ztCollide,ztNav,ztNi,ztBfs,ztLos,ztDescend,ztPerson,ztGame,ztZombie,ztPickAt,ztCanGet,ztGive,ztPickups,ztRespawn,ztUseItem,ztSlips,ztSnap,ztMove,ztTagR,ztTagCheck,ztBite,ztStep,ztBotInput};
