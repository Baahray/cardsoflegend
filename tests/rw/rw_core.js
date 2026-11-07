/* ================= ROBOT RUMBLE: the rules (parts, weights, the drawn shape -> 3D) =================
   A robot's body is drawn from the side, from above and from the front. The body is the block "cut out" to match all three
   drawings (like cutting a robot out of a block of foam), then smoothed. Units: X = forward (front is +X), Y = up, Z = across. */
const RW_B={x0:-1.25,x1:1.25,y0:0,y1:1.1,z0:-.95,z1:.95};
const RW_VIEWS={side:{u:"x",v:"y",nm:"SIDE"},top:{u:"x",v:"z",nm:"TOP"},front:{u:"z",v:"y",nm:"FRONT"}};
const RW_LIMIT=100;
/* materials you can really build a robot from. kg = weight per unit of skin, arm = armour stars */
const RW_MAT=[
  {k:"ply",nm:"Plywood",ic:"🪵",kg:3,arm:1,say:"Wooden boards. Super light, but breaks easily."},
  {k:"hdpe",nm:"Plastic",ic:"🧴",kg:3.8,arm:2,say:"Tough bendy plastic. Light, and soaks up bumps."},
  {k:"poly",nm:"Clear plastic",ic:"🔍",kg:3.4,arm:3,say:"See-through plastic. Light, and you can see inside!"},
  {k:"alu",nm:"Aluminium",ic:"⚙️",kg:5.5,arm:3,say:"Light metal. A good all-rounder."},
  {k:"steel",nm:"Steel",ic:"🔩",kg:11,arm:5,say:"Super strong metal — but very heavy!"},
  {k:"ti",nm:"Titanium",ic:"💠",kg:6.5,arm:5,say:"Strong AND light. The best metal there is!"}];
const RW_WEP=[
  {k:"wedge",nm:"Wedge",ic:"📐",kg:6,pow:2,say:"A ramp on the front. Get under them and shove them around."},
  {k:"flip",nm:"Flipper",ic:"🦘",kg:16,pow:4,say:"Flicks robots into the air and onto their backs!"},
  {k:"spin",nm:"Spinner",ic:"🌀",kg:20,pow:5,say:"A heavy spinning bar that smashes bits off."},
  {k:"drum",nm:"Drum",ic:"🥁",kg:18,pow:4.5,say:"A spinning drum that bounces robots up in the air."},
  {k:"axe",nm:"Axe",ic:"🪓",kg:14,pow:4,say:"Swings down hard from the top."},
  {k:"crush",nm:"Crusher",ic:"🦀",kg:18,pow:3.5,say:"Big jaws that grab and squeeze."}];
const RW_DRIVE=[
  {k:"w2",nm:"2 big wheels",ic:"⚫⚫",kg:8,spd:.5,push:0,say:"Fast, and turns on the spot."},
  {k:"w4",nm:"4 wheels",ic:"⚫⚫⚫⚫",kg:12,spd:0,push:.5,say:"Grippy and steady."},
  {k:"trk",nm:"Tank tracks",ic:"🛞",kg:18,spd:-1,push:1.2,say:"Really hard to push around — but slower."}];
const RW_MOT=[
  {k:"fast",nm:"Fast",ic:"⚡",kg:8,spd:5,push:2.5,say:"Zooms around."},
  {k:"mid",nm:"Balanced",ic:"⚖️",kg:10,spd:4,push:3.5,say:"A bit of both."},
  {k:"push",nm:"Pushy",ic:"💪",kg:14,spd:3,push:5,say:"Slower, but a strong shover."}];
const RW_COLS=["#e53935","#fb8c00","#fdd835","#43a047","#1e88e5","#8e24aa","#ec407a","#263238","#eceff1","#795548"];
const rwFind=(L,k)=>L.find(x=>x.k===k)||L[0];
/* ---------- the drawings: closed shapes, smoothed ---------- */
function rwChaikin(p,n=2){let a=p;for(let it=0;it<n;it++){const o=[];for(let i=0;i<a.length;i++){const P=a[i],Q=a[(i+1)%a.length];o.push([P[0]*.75+Q[0]*.25,P[1]*.75+Q[1]*.25],[P[0]*.25+Q[0]*.75,P[1]*.25+Q[1]*.75])}a=o}return a}
function rwResample(p,step){if(p.length<2)return p.slice();const o=[p[0]];let acc=0;for(let i=1;i<=p.length;i++){const A=p[i-1],B=p[i%p.length];let L=Math.hypot(B[0]-A[0],B[1]-A[1]),t0=0;
    while(acc+L-t0>=step){const t=t0+(step-acc);o.push([A[0]+(B[0]-A[0])*t/L,A[1]+(B[1]-A[1])*t/L]);t0=t;acc=0;if(o.length>600)return o}acc+=L-t0}return o}
/* a finger-drawn loop -> a smooth closed outline (or null if it's just a dot) */
function rwSmoothShape(raw){if(!raw||raw.length<4)return null;let p=raw.map(q=>[q[0],q[1]]);
  const per=p.reduce((a,q,i)=>i?a+Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]):0,0);if(per<.15)return null;
  p=rwResample(p,Math.max(.02,per/120));p=rwChaikin(p,3);p=rwResample(p,Math.max(.015,per/160));
  /* area check: a squiggle with no area isn't a shape */
  let A=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];A+=a[0]*b[1]-b[0]*a[1]}if(Math.abs(A/2)<.004)return null;return p}
function rwEncShapes(S){const o={};for(const v in RW_VIEWS)o[v]=(S[v]||[]).map(sh=>sh.map(q=>Math.round(q[0]*100)+","+Math.round(q[1]*100)).join(" ")).join("|");return o}
function rwDecShapes(o){const S={side:[],top:[],front:[]};if(!o)return S;for(const v in RW_VIEWS){const t=o[v];if(!t||typeof t!=="string")continue;
    for(const sh of t.split("|")){const pts=sh.split(" ").map(q=>q.split(",").map(n=>+n/100)).filter(q=>q.length===2&&isFinite(q[0])&&isFinite(q[1]));if(pts.length>=3)S[v].push(pts)}}return S}
/* ---------- 2D signed distance for one view (negative = inside one of the shapes) ---------- */
function rwSDF2(shapes,u0,u1,v0,v1,res){const nu=Math.ceil((u1-u0)/res)+1,nv=Math.ceil((v1-v0)/res)+1,D=new Float32Array(nu*nv);
  const segs=[];for(const sh of shapes)for(let i=0;i<sh.length;i++){const a=sh[i],b=sh[(i+1)%sh.length];segs.push(a[0],a[1],b[0],b[1])}
  for(let j=0;j<nv;j++){const v=v0+j*res;for(let i=0;i<nu;i++){const u=u0+i*res;let md=1e9,ins=false;
    for(let s=0;s<segs.length;s+=4){const ax=segs[s],ay=segs[s+1],bx=segs[s+2],by=segs[s+3],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1e-12,t=Math.max(0,Math.min(1,((u-ax)*dx+(v-ay)*dy)/L2)),ex=ax+dx*t-u,ey=ay+dy*t-v,d=ex*ex+ey*ey;if(d<md)md=d;
      if((ay>v)!==(by>v)&&u<ax+(v-ay)*dx/(dy||1e-12))ins=!ins}
    D[j*nu+i]=ins?-Math.sqrt(md):Math.sqrt(md)}}
  return{D,nu,nv,u0,v0,res,at(u,v){let fi=(u-u0)/res,fj=(v-v0)/res;if(fi<0||fj<0||fi>nu-1||fj>nv-1)return Math.max(-fi*res,-fj*res,(fi-(nu-1))*res,(fj-(nv-1))*res,0)+.2;
    const i=Math.min(nu-2,Math.floor(fi)),j=Math.min(nv-2,Math.floor(fj)),a=fi-i,b=fj-j,q=j*nu+i;return D[q]*(1-a)*(1-b)+D[q+1]*a*(1-b)+D[q+nu]*(1-a)*b+D[q+nu+1]*a*b}}}
const rwSmax=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.max(a,b)+h*h*k*.25};
/* ---------- the 3D body: carve, then mesh with "surface nets", then smooth ---------- */
function rwBuildBody(S,opt={}){const B=RW_B,res=opt.res||.04,round=opt.round||.09;
  const has=v=>S[v]&&S[v].length;if(!has("side")&&!has("top")&&!has("front"))return null;
  const r2=.025,F={};if(has("side"))F.side=rwSDF2(S.side,B.x0-.1,B.x1+.1,B.y0-.1,B.y1+.1,r2);if(has("top"))F.top=rwSDF2(S.top,B.x0-.1,B.x1+.1,B.z0-.1,B.z1+.1,r2);if(has("front"))F.front=rwSDF2(S.front,B.z0-.1,B.z1+.1,B.y0-.1,B.y1+.1,r2);
  /* not drawn from above or the front: the body is a sensible width */
  const hw=opt.halfWidth||.5;
  const field=(x,y,z)=>{let d=Math.max(x-B.x1,B.x0-x,y-B.y1,B.y0-y,z-B.z1,B.z0-z);
    if(F.side)d=rwSmax(d,F.side.at(x,y),round);else d=rwSmax(d,Math.max(Math.abs(x)-1,y-.6,-y),round);
    if(F.top)d=rwSmax(d,F.top.at(x,z),round);else if(!F.front)d=rwSmax(d,Math.abs(z)-hw,round);
    if(F.front)d=rwSmax(d,F.front.at(z,y),round);return d};
  const x0=B.x0-.12,y0=B.y0-.12,z0=B.z0-.12,nx=Math.ceil((B.x1-B.x0+.24)/res)+1,ny=Math.ceil((B.y1-B.y0+.24)/res)+1,nz=Math.ceil((B.z1-B.z0+.24)/res)+1;
  const V=new Float32Array(nx*ny*nz),id=(i,j,k)=>(k*ny+j)*nx+i;let inside=0;
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const f=field(x0+i*res,y0+j*res,z0+k*res);V[id(i,j,k)]=f;if(f<0)inside++}
  if(!inside)return null;
  /* one vertex per cell the surface passes through, at the average of where it crosses the cell's edges */
  const cv=new Int32Array((nx-1)*(ny-1)*(nz-1)).fill(-1),cid=(i,j,k)=>(k*(ny-1)+j)*(nx-1)+i,P=[];
  const E=[[0,0,0,1,0,0],[0,1,0,1,1,0],[0,0,1,1,0,1],[0,1,1,1,1,1],[0,0,0,0,1,0],[1,0,0,1,1,0],[0,0,1,0,1,1],[1,0,1,1,1,1],[0,0,0,0,0,1],[1,0,0,1,0,1],[0,1,0,0,1,1],[1,1,0,1,1,1]];
  for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){let sx=0,sy=0,sz=0,n=0;
    for(const e of E){const a=V[id(i+e[0],j+e[1],k+e[2])],b=V[id(i+e[3],j+e[4],k+e[5])];if((a<0)===(b<0))continue;const t=a/(a-b);sx+=e[0]+(e[3]-e[0])*t;sy+=e[1]+(e[4]-e[1])*t;sz+=e[2]+(e[5]-e[2])*t;n++}
    if(n){cv[cid(i,j,k)]=P.length/3;P.push(x0+(i+sx/n)*res,y0+(j+sy/n)*res,z0+(k+sz/n)*res)}}
  const I=[],quad=(a,b,c,d,flip)=>{if(a<0||b<0||c<0||d<0)return;if(flip)I.push(a,c,b,a,d,c);else I.push(a,b,c,a,c,d)};
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=V[id(i,j,k)],b=V[id(i+1,j,k)];if((a<0)===(b<0))continue;
    quad(cv[cid(i,j-1,k-1)],cv[cid(i,j,k-1)],cv[cid(i,j,k)],cv[cid(i,j-1,k)],a<0)}
  for(let k=1;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=1;i<nx-1;i++){const a=V[id(i,j,k)],b=V[id(i,j+1,k)];if((a<0)===(b<0))continue;
    quad(cv[cid(i-1,j,k-1)],cv[cid(i-1,j,k)],cv[cid(i,j,k)],cv[cid(i,j,k-1)],a<0)}
  for(let k=0;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){const a=V[id(i,j,k)],b=V[id(i,j,k+1)];if((a<0)===(b<0))continue;
    quad(cv[cid(i-1,j-1,k)],cv[cid(i,j-1,k)],cv[cid(i,j,k)],cv[cid(i-1,j,k)],a<0)}
  /* smooth it (Taubin: shrink-free smoothing) */
  const n=P.length/3,nb=Array.from({length:n},()=>new Set());for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2];nb[a].add(b).add(c);nb[b].add(a).add(c);nb[c].add(a).add(b)}
  const pass=lam=>{const Q=P.slice();for(let v=0;v<n;v++){const s=nb[v];if(!s.size)continue;let ax=0,ay=0,az=0;for(const w of s){ax+=P[3*w];ay+=P[3*w+1];az+=P[3*w+2]}ax/=s.size;ay/=s.size;az/=s.size;
    Q[3*v]+=lam*(ax-P[3*v]);Q[3*v+1]+=lam*(ay-P[3*v+1]);Q[3*v+2]+=lam*(az-P[3*v+2])}for(let q=0;q<P.length;q++)P[q]=Q[q]};
  for(let it=0;it<(opt.smooth||6);it++){pass(.5);pass(-.53)}
  /* make sure the faces point outwards */
  {let sv=0;for(let t=0;t<I.length;t+=3){const a=3*I[t],c=3*I[t+1],d=3*I[t+2];sv+=P[a]*(P[c+1]*P[d+2]-P[c+2]*P[d+1])-P[a+1]*(P[c]*P[d+2]-P[c+2]*P[d])+P[a+2]*(P[c]*P[d+1]-P[c+1]*P[d])}
    if(sv<0)for(let t=0;t<I.length;t+=3){const q=I[t+1];I[t+1]=I[t+2];I[t+2]=q}}
  /* size facts */
  let area=0,bx0=1e9,bx1=-1e9,by0=1e9,by1=-1e9,bz0=1e9,bz1=-1e9;for(let t=0;t<I.length;t+=3){const a=3*I[t],b=3*I[t+1],c=3*I[t+2],ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
    area+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)/2}
  for(let v=0;v<n;v++){bx0=Math.min(bx0,P[3*v]);bx1=Math.max(bx1,P[3*v]);by0=Math.min(by0,P[3*v+1]);by1=Math.max(by1,P[3*v+1]);bz0=Math.min(bz0,P[3*v+2]);bz1=Math.max(bz1,P[3*v+2])}
  /* the front face: where the weapon goes */
  let fx=-1e9,fy=0,fz=0,fc=0;const midY=(by0+by1)/2;for(let v=0;v<n;v++)if(Math.abs(P[3*v+2])<.15&&P[3*v]>fx-.02){if(P[3*v]>fx+.02){fx=P[3*v];fy=0;fz=0;fc=0}fy+=P[3*v+1];fc++}if(fc)fy/=fc;
  return{pos:new Float32Array(P),idx:I.length>65535?new Uint32Array(I):new Uint16Array(I),area,vol:inside*res*res*res,box:{x0:bx0,x1:bx1,y0:by0,y1:by1,z0:bz0,z1:bz1},front:{x:fx,y:fc?fy:midY}}}
/* ---------- weight and stars ---------- */
function rwStats(R,body,cass){const m=rwFind(RW_MAT,R.mat),w=rwFind(RW_WEP,R.wep),d=rwFind(RW_DRIVE,R.drive),mo=rwFind(RW_MOT,R.mot);
  const skin=body?body.area*m.kg:0,kg=Math.round(skin+w.kg+d.kg+mo.kg+6),lim=RW_LIMIT+(cass?10:0);
  const cl=v=>Math.max(1,Math.min(5,Math.round(v*2)/2));
  return{kg,lim,over:kg>lim,parts:{body:Math.round(skin),weapon:w.kg,drive:d.kg,motors:mo.kg,battery:6},
    arm:m.arm,spd:cl(mo.spd+d.spd-Math.max(0,(kg-60)/25)),push:cl(mo.push+d.push+(kg-60)/30),pow:w.pow}}
function rwNew(){return{id:"b"+Date.now().toString(36),nm:"",shapes:{side:[],top:[],front:[]},mat:"alu",wep:"flip",drive:"w4",mot:"mid",col:"#e53935",col2:"#fdd835",t:Date.now()}}
const RW_N1=["Mega","Turbo","Iron","Thunder","Steel","Rapid","Crusher","Atomic","Rusty","Dynamo","Hyper","Nitro","Spike","Volt","Big","Little"],RW_N2=["Bob","Smasher","Wedge","Basher","Bulldog","Tornado","Destroyer","Beetle","Biter","Thumper","Ripper","Rocket","Bruiser","Hammer","Chomper","Dozer"];
const rwFun=()=>RW_N1[Math.random()*RW_N1.length|0]+" "+RW_N2[Math.random()*RW_N2.length|0];
if(typeof module!=="undefined")module.exports={RW_B,RW_VIEWS,RW_MAT,RW_WEP,RW_DRIVE,RW_MOT,RW_LIMIT,rwFind,rwSmoothShape,rwEncShapes,rwDecShapes,rwSDF2,rwBuildBody,rwStats,rwNew,rwFun};
