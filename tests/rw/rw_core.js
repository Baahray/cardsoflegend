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
/* ---------- the 3D body as clay: a grid of numbers (below 0 = clay). Draw the side to start, then mould it ---------- */
const RW_RES=.04;
function rwField(S,opt={}){const B=RW_B,res=RW_RES,round=opt.round||.09;
  const has=v=>S&&S[v]&&S[v].length;if(!has("side")&&!has("top")&&!has("front"))return null;
  const r2=.025,F2={};if(has("side"))F2.side=rwSDF2(S.side,B.x0-.1,B.x1+.1,B.y0-.1,B.y1+.1,r2);if(has("top"))F2.top=rwSDF2(S.top,B.x0-.1,B.x1+.1,B.z0-.1,B.z1+.1,r2);if(has("front"))F2.front=rwSDF2(S.front,B.z0-.1,B.z1+.1,B.y0-.1,B.y1+.1,r2);
  const hw=opt.halfWidth||.42;
  const field=(x,y,z)=>{let d=Math.max(x-B.x1,B.x0-x,y-B.y1,B.y0-y,z-B.z1,B.z0-z);
    if(F2.side)d=rwSmax(d,F2.side.at(x,y),round);else d=rwSmax(d,Math.max(Math.abs(x)-1,y-.6,-y),round);
    if(F2.top)d=rwSmax(d,F2.top.at(x,z),round);else if(!F2.front)d=rwSmax(d,Math.abs(z)-hw,round);
    if(F2.front)d=rwSmax(d,F2.front.at(z,y),round);return d};
  const x0=B.x0-.12,y0=B.y0-.12,z0=B.z0-.12,nx=Math.ceil((B.x1-B.x0+.24)/res)+1,ny=Math.ceil((B.y1-B.y0+.24)/res)+1,nz=Math.ceil((B.z1-B.z0+.24)/res)+1;
  const F=new Float32Array(nx*ny*nz);let n=0;for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)F[n++]=field(x0+i*res,y0+j*res,z0+k*res);
  return{F,nx,ny,nz,x0,y0,z0,res}}
const rwFieldCopy=f=>f&&{...f,F:new Float32Array(f.F)};
const rwSmin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25};
/* one touch of a clay tool at (px,py,pz). t: "a" add/pull out, "p" push in, "s" smooth */
function rwBrush(f,t,px,py,pz,r){const{F,nx,ny,nz,x0,y0,z0,res}=f,B=RW_B,R=r+2*res;
  const i0=Math.max(1,Math.floor((px-R-x0)/res)),i1=Math.min(nx-2,Math.ceil((px+R-x0)/res)),j0=Math.max(1,Math.floor((py-R-y0)/res)),j1=Math.min(ny-2,Math.ceil((py+R-y0)/res)),k0=Math.max(1,Math.floor((pz-R-z0)/res)),k1=Math.min(nz-2,Math.ceil((pz+R-z0)/res));
  if(i0>i1||j0>j1||k0>k1)return;const sx=nx,sxy=nx*ny;
  if(t==="s"){const tmp=[];for(let k=k0;k<=k1;k++)for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=x0+i*res,y=y0+j*res,z=z0+k*res,d=Math.hypot(x-px,y-py,z-pz);if(d>r)continue;const q=i+j*sx+k*sxy;
      const av=(F[q-1]+F[q+1]+F[q-sx]+F[q+sx]+F[q-sxy]+F[q+sxy])/6;tmp.push(q,F[q]+(av-F[q])*.7*(1-d/r))}for(let n=0;n<tmp.length;n+=2)F[tmp[n]]=tmp[n+1];return}
  const k=Math.max(.03,r*.4);
  for(let kk=k0;kk<=k1;kk++)for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=x0+i*res,y=y0+j*res,z=z0+kk*res,d=Math.hypot(x-px,y-py,z-pz)-r;if(d>2*res+k)continue;const q=i+j*sx+kk*sxy;
    let v=t==="a"?rwSmin(F[q],d,k):rwSmax(F[q],-d,k);
    /* clay can't leave the workbench box */v=Math.max(v,x-B.x1,B.x0-x,y-B.y1,B.y0-y,z-B.z1,B.z0-z);F[q]=v}}
/* a whole stroke: {t, r, m (mirror), p:[[x,y,z],...]} */
function rwOp(f,op){if(!f||!op||!op.p)return;for(const q of op.p){rwBrush(f,op.t,q[0],q[1],q[2],op.r);if(op.m&&Math.abs(q[2])>op.r*.25)rwBrush(f,op.t,q[0],q[1],-q[2],op.r)}}
function rwEncOps(L){return(L||[]).map(o=>o.t+(o.m?"m":"")+Math.round(o.r*100)+":"+o.p.map(q=>q.map(v=>Math.round(v*100)).join(",")).join(" "))}
function rwDecOps(L){if(!Array.isArray(L))return[];return L.map(s=>{if(typeof s!=="string")return null;const m=/^([aps])(m?)(\d+):(.*)$/.exec(s);if(!m)return null;
  const p=m[4].split(" ").map(q=>q.split(",").map(n=>+n/100)).filter(q=>q.length===3&&q.every(isFinite));return p.length?{t:m[1],m:!!m[2],r:Math.max(.04,Math.min(.4,+m[3]/100)),p}:null}).filter(Boolean)}
/* clay -> a smooth surface ("surface nets", then smoothing) */
function rwMesh(f,opt={}){if(!f)return null;const{F:V,nx,ny,nz,x0,y0,z0,res}=f,id=(i,j,k)=>(k*ny+j)*nx+i;let any=0;for(let q=0;q<V.length;q++)if(V[q]<0){any=1;break}if(!any)return null;
  const cv=new Int32Array((nx-1)*(ny-1)*(nz-1)).fill(-1),cid=(i,j,k)=>(k*(ny-1)+j)*(nx-1)+i,P=[];
  const E=[[0,0,0,1,0,0],[0,1,0,1,1,0],[0,0,1,1,0,1],[0,1,1,1,1,1],[0,0,0,0,1,0],[1,0,0,1,1,0],[0,0,1,0,1,1],[1,0,1,1,1,1],[0,0,0,0,0,1],[1,0,0,1,0,1],[0,1,0,0,1,1],[1,1,0,1,1,1]];
  for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const q=id(i,j,k);let neg=0;const c=[V[q],V[q+1],V[q+nx],V[q+nx+1],V[q+nx*ny],V[q+nx*ny+1],V[q+nx*ny+nx],V[q+nx*ny+nx+1]];for(const v of c)if(v<0)neg++;if(neg===0||neg===8)continue;
    let sx=0,sy=0,sz=0,n=0;for(const e of E){const a=V[id(i+e[0],j+e[1],k+e[2])],b=V[id(i+e[3],j+e[4],k+e[5])];if((a<0)===(b<0))continue;const t=a/(a-b);sx+=e[0]+(e[3]-e[0])*t;sy+=e[1]+(e[4]-e[1])*t;sz+=e[2]+(e[5]-e[2])*t;n++}
    cv[cid(i,j,k)]=P.length/3;P.push(x0+(i+sx/n)*res,y0+(j+sy/n)*res,z0+(k+sz/n)*res)}
  const I=[],quad=(a,b,c,d,flip)=>{if(a<0||b<0||c<0||d<0)return;if(flip)I.push(a,c,b,a,d,c);else I.push(a,b,c,a,c,d)};
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=V[id(i,j,k)],b=V[id(i+1,j,k)];if((a<0)===(b<0))continue;quad(cv[cid(i,j-1,k-1)],cv[cid(i,j,k-1)],cv[cid(i,j,k)],cv[cid(i,j-1,k)],a<0)}
  for(let k=1;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=1;i<nx-1;i++){const a=V[id(i,j,k)],b=V[id(i,j+1,k)];if((a<0)===(b<0))continue;quad(cv[cid(i-1,j,k-1)],cv[cid(i-1,j,k)],cv[cid(i,j,k)],cv[cid(i,j,k-1)],a<0)}
  for(let k=0;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){const a=V[id(i,j,k)],b=V[id(i,j,k+1)];if((a<0)===(b<0))continue;quad(cv[cid(i-1,j-1,k)],cv[cid(i,j-1,k)],cv[cid(i,j,k)],cv[cid(i-1,j,k)],a<0)}
  const n=P.length/3;if(!n)return null;
  /* smooth it (Taubin: smoothing that doesn't shrink) using a fast neighbour list */
  const deg=new Int32Array(n);for(let t=0;t<I.length;t+=3){deg[I[t]]+=2;deg[I[t+1]]+=2;deg[I[t+2]]+=2}const st=new Int32Array(n+1);for(let v=0;v<n;v++)st[v+1]=st[v]+deg[v];const nb=new Int32Array(st[n]),fill=st.slice(0,n);
  for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2];nb[fill[a]++]=b;nb[fill[a]++]=c;nb[fill[b]++]=a;nb[fill[b]++]=c;nb[fill[c]++]=a;nb[fill[c]++]=b}
  const Pa=new Float32Array(P),Q=new Float32Array(Pa.length);
  const pass=lam=>{for(let v=0;v<n;v++){const s0=st[v],s1=st[v+1];if(s1===s0){Q[3*v]=Pa[3*v];Q[3*v+1]=Pa[3*v+1];Q[3*v+2]=Pa[3*v+2];continue}let ax=0,ay=0,az=0;for(let e=s0;e<s1;e++){const w=nb[e];ax+=Pa[3*w];ay+=Pa[3*w+1];az+=Pa[3*w+2]}const c=s1-s0;
    Q[3*v]=Pa[3*v]+lam*(ax/c-Pa[3*v]);Q[3*v+1]=Pa[3*v+1]+lam*(ay/c-Pa[3*v+1]);Q[3*v+2]=Pa[3*v+2]+lam*(az/c-Pa[3*v+2])}Pa.set(Q)};
  for(let it=0;it<(opt.smooth==null?6:opt.smooth);it++){pass(.5);pass(-.53)}
  /* faces point outwards */
  {let sv=0;for(let t=0;t<I.length;t+=3){const a=3*I[t],c=3*I[t+1],d=3*I[t+2];sv+=Pa[a]*(Pa[c+1]*Pa[d+2]-Pa[c+2]*Pa[d+1])-Pa[a+1]*(Pa[c]*Pa[d+2]-Pa[c+2]*Pa[d])+Pa[a+2]*(Pa[c]*Pa[d+1]-Pa[c+1]*Pa[d])}
    if(sv<0)for(let t=0;t<I.length;t+=3){const q=I[t+1];I[t+1]=I[t+2];I[t+2]=q}}
  let area=0,bx0=1e9,bx1=-1e9,by0=1e9,by1=-1e9,bz0=1e9,bz1=-1e9;for(let t=0;t<I.length;t+=3){const a=3*I[t],b=3*I[t+1],c=3*I[t+2],ux=Pa[b]-Pa[a],uy=Pa[b+1]-Pa[a+1],uz=Pa[b+2]-Pa[a+2],vx=Pa[c]-Pa[a],vy=Pa[c+1]-Pa[a+1],vz=Pa[c+2]-Pa[a+2];
    area+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)/2}
  for(let v=0;v<n;v++){bx0=Math.min(bx0,Pa[3*v]);bx1=Math.max(bx1,Pa[3*v]);by0=Math.min(by0,Pa[3*v+1]);by1=Math.max(by1,Pa[3*v+1]);bz0=Math.min(bz0,Pa[3*v+2]);bz1=Math.max(bz1,Pa[3*v+2])}
  /* the front face, where the weapon goes: the furthest-forward clay near the middle */
  let fx=-1e9,fy=0,fc=0;for(let v=0;v<n;v++)if(Math.abs(Pa[3*v+2])<.15&&Pa[3*v+1]<by0+(by1-by0)*.6){const x=Pa[3*v];if(x>fx+.02){fx=x;fy=0;fc=0}if(x>fx-.02){fy+=Pa[3*v+1];fc++}}
  if(!fc){fx=bx1;fy=(by0+by1)/2;fc=1}
  return{pos:Pa,idx:I.length>65535?new Uint32Array(I):new Uint16Array(I),area,box:{x0:bx0,x1:bx1,y0:by0,y1:by1,z0:bz0,z1:bz1},front:{x:fx,y:fy/fc}}}
/* a saved robot -> its body: start from the drawing, then replay every clay stroke */
function rwBody(R,opt){const f=rwField(R.shapes);if(!f)return null;for(const o of R.ops||[])rwOp(f,o);return rwMesh(f,opt)}
function rwBuildBody(S,opt){return rwMesh(rwField(S),opt)}
/* ready-made starting shapes (side outlines) */
const RW_STARTS={box:[[-.95,.08],[.95,.08],[.95,.55],[-.95,.55]],wedge:[[-.95,.08],[1.05,.08],[-.1,.6],[-.95,.6]],round:Array.from({length:24},(_,i)=>[Math.cos(i/24*6.283)*.95,.34+Math.sin(i/24*6.283)*.28])};
function rwStartShape(k){const P=RW_STARTS[k]||RW_STARTS.box;return rwSmoothShape(P.flatMap((a,i)=>{const b=P[(i+1)%P.length];return[0,.25,.5,.75].map(t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}))}
/* ---------- weight and stars ---------- */
function rwStats(R,body,cass){const m=rwFind(RW_MAT,R.mat),w=rwFind(RW_WEP,R.wep),d=rwFind(RW_DRIVE,R.drive),mo=rwFind(RW_MOT,R.mot);
  const skin=body?body.area*m.kg:0,kg=Math.round(skin+w.kg+d.kg+mo.kg+6),lim=RW_LIMIT+(cass?10:0);
  const cl=v=>Math.max(1,Math.min(5,Math.round(v*2)/2));
  return{kg,lim,over:kg>lim,parts:{body:Math.round(skin),weapon:w.kg,drive:d.kg,motors:mo.kg,battery:6},
    arm:m.arm,spd:cl(mo.spd+d.spd-Math.max(0,(kg-60)/25)),push:cl(mo.push+d.push+(kg-60)/30),pow:w.pow}}
function rwNew(){return{id:"b"+Date.now().toString(36),nm:"",shapes:{side:[],top:[],front:[]},ops:[],mat:"alu",wep:"flip",drive:"w4",mot:"mid",col:"#e53935",col2:"#fdd835",t:Date.now()}}
const RW_N1=["Mega","Turbo","Iron","Thunder","Steel","Rapid","Crusher","Atomic","Rusty","Dynamo","Hyper","Nitro","Spike","Volt","Big","Little"],RW_N2=["Bob","Smasher","Wedge","Basher","Bulldog","Tornado","Destroyer","Beetle","Biter","Thumper","Ripper","Rocket","Bruiser","Hammer","Chomper","Dozer"];
const rwFun=()=>RW_N1[Math.random()*RW_N1.length|0]+" "+RW_N2[Math.random()*RW_N2.length|0];
if(typeof module!=="undefined")module.exports={RW_B,RW_VIEWS,RW_MAT,RW_WEP,RW_DRIVE,RW_MOT,RW_LIMIT,rwFind,rwSmoothShape,rwEncShapes,rwDecShapes,rwSDF2,rwBuildBody,rwStats,rwNew,rwFun,rwField,rwFieldCopy,rwBrush,rwOp,rwEncOps,rwDecOps,rwMesh,rwBody,rwStartShape};
