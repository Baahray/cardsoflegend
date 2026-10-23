/* ===== Basketball physics (pure, no drawing). Reused by the game, the replays, the Shadow Knight and the tests. =====
   World: metres, y up. Rim centre at (hx, 3.05+hy, 0). The backboard face is the plane z = -0.38. The shooter stands at +z.
   Fixed time step, so the same shot always gives the same result (good for replays and tests). */
const HP={g:9.81,dt:1/240,br:.12,mass:.6,rimR:.236,tube:.009,rimY:3.05,nRim:48,boardZ:-.38,boardW:1.83,boardBot:2.90,boardTop:3.97,
  eRim:.58,y0:1.0,aimZ:-.04,cal:1,eBoard:.62,eGround:.74,mu:.45,netDepth:.45,netBot:.55,poleZ:-1.5,poleR:.1,fence:[-7.8,7.8,-4.6,13]};
HP.I=2/3*HP.mass*HP.br*HP.br;   /* hollow sphere */
/* rounds: distance, launch angle, hoop movement */
/* rounds: where you shoot from (D = metres from the hoop, a = angle: 0 straight in front, minus = left side, plus = right side) and whether the hoop moves */
const HP_ROUNDS=[{n:"CLOSE UP",s:"right in front",D:2.6,a:0,tol:1.3},{n:"LEFT SIDE",s:"from the side",D:3.8,a:-55,tol:1},{n:"FAR AWAY",s:"long shot",D:5.6,a:0,tol:.8},
  {n:"RIGHT CORNER",s:"from the corner",D:4.2,a:72,tol:.9},{n:"MOVING HOOP",s:"it slides side to side",D:4,a:-25,tol:.9,mx:.65,mT:4.4}];
/* sudden death: a new spot every pair of shots */
const HP_SUDDEN=[{n:"UP & DOWN",s:"the hoop bobs up and down",D:4.4,a:30,tol:.85,my:.32,mT:3.6},{n:"LEFT CORNER",s:"from the corner",D:4.2,a:-72,tol:.85},
  {n:"DEEP RIGHT",s:"far, from the right",D:5.4,a:38,tol:.8},{n:"MIDDLE",s:"straight in front",D:5,a:0,tol:.85}];
/* a match of "to" shots each (3, 5, 7 or 10): the spots in order, then sudden death */
const HP_ALL=[...HP_ROUNDS,...HP_SUDDEN];
const hpRound=(n,to=5)=>n>=2*to?HP_SUDDEN[Math.floor((n-2*to)/2)%HP_SUDDEN.length]:HP_ALL[Math.floor(n/2)%HP_ALL.length];
/* HOOP ALONE: k = baskets made in a row so far. Every basket moves you further out and round the side, gives you less help,
   and later the hoop starts sliding, then bobbing, then both. Same seed = same spots (so a replay matches). */
const HP_FT=3.28084;
function hpStreak(k,seed,kid){let x=(Math.imul((seed|0)^0x9e3779b9,2654435761)+Math.imul(k+1,40503))>>>0;const rnd=()=>{x=Math.imul(x^(x>>>15),2246822519)>>>0;x=Math.imul(x^(x>>>13),3266489917)>>>0;x^=x>>>16;return (x>>>0)/4294967296};rnd();
  const D=+Math.min(10.4,2.5+(kid?.5:.55)*k).toFixed(2),wide=Math.min(76,8+k*7),side=Math.asin(Math.min(1,6.6/D))*180/Math.PI;
  const a=+Math.max(-side,Math.min(side,(rnd()*2-1)*wide)).toFixed(1),tol=+Math.max(kid?.55:.5,1.3-k*(kid?.05:.055)).toFixed(3),c={D,a,tol,k};
  if(k>=6){const m=k-6,kind=k>=14?3:k>=9?(k%3===0?2:1):1;
    if(kind&1){c.mx=+Math.min(.85,.3+m*.06).toFixed(2);c.mT=+Math.max(2.6,4.6-m*.15).toFixed(2)}
    if(kind&2){c.my=+Math.min(.4,.2+m*.02).toFixed(2);c.mT=c.mT||+Math.max(2.8,4-m*.1).toFixed(2)}}
  c.n=D<4.2?"CLOSE RANGE":D<5.2?"FREE THROW LINE":D<6.7?"MID RANGE":D<8?"THREE POINTER":D<9.6?"DEEP THREE":"HALF COURT!";
  const ft=Math.round(D*HP_FT),mv=c.mx&&c.my?" · hoop moving all over!":c.my?" · hoop bobbing":c.mx?" · hoop sliding":"",sd=Math.abs(a)>50?" · from the side":"";
  c.s=ft+" ft"+sd+mv;return c}
/* longer shots need a harder throw: how much longer the perfect swipe is than at a normal spot */
const hpPowK=cfg=>{const s=Math.hypot(...hpIdeal({D:cfg.D,a:0},0)),s0=Math.hypot(...hpIdeal({D:4.2,a:0},0));return Math.max(.8,Math.min(1.65,Math.pow(s/s0,1.5)))};
/* where the ball starts for this round */
const hpP0=cfg=>{const a=(cfg.a||0)*Math.PI/180;return[cfg.D*Math.sin(a),HP.y0,cfg.D*Math.cos(a)]};
function hpHoop(cfg,t){const w=cfg.mT?2*Math.PI*t/cfg.mT:0;return{x:cfg.mx?cfg.mx*Math.sin(w):0,y:cfg.my?cfg.my*Math.sin(w):0}}
/* the "ideal" throw from the ball to just behind the middle of the rim, at the round's launch angle */
function hpIdeal(cfg,ph){const P0=hpP0(cfg);let tA=1.1,v=null;
  for(let it=0;it<8;it++){const h0=hpHoop(cfg,ph),h1=hpHoop(cfg,ph+tA),lead=cfg.lead??1,hx=h0.x+(h1.x-h0.x)*lead,hy=h0.y+(h1.y-h0.y)*lead;
    const T=[hx,HP.rimY+hy+.02,HP.aimZ],dx=T[0]-P0[0],dz=T[2]-P0[2],L=Math.hypot(dx,dz),H=T[1]-P0[1],th=Math.atan(2*H/L+Math.tan((cfg.entry||44)*Math.PI/180));
    const sp=Math.sqrt(HP.g*L*L/(2*Math.cos(th)**2*(L*Math.tan(th)-H)));v=[dx/L*sp*Math.cos(th),sp*Math.sin(th),dz/L*sp*Math.cos(th)];tA=L/(sp*Math.cos(th))}
  return v}
/* turn a swipe into a throw. pw = power (1 = perfect), an = aim in degrees (0 = straight). A dead zone around perfect makes it forgiving. */
function hpAssist(pw,an,kid,cfg){const tl=(cfg&&cfg.tol)||1,dz=(kid?.22:.14)*tl,k=kid?.35:.45,ad=(kid?7:4.5)*tl,ak=kid?.3:.4,e=pw-1,soft=(x,d,s)=>Math.sign(x)*Math.max(0,Math.abs(x)-d)*s;
  return{pw:+(1+soft(e,dz,k)).toFixed(4),an:+soft(an,ad,ak).toFixed(3)}}
function hpLaunch(cfg,ph,pw,an){const v=hpIdeal(cfg,ph),a=an*Math.PI/180,c=Math.cos(a),s=Math.sin(a);pw*=HP.cal;
  return{v:[(v[0]*c-v[2]*s)*pw,v[1]*pw,(v[0]*s+v[2]*c)*pw],w:[12,-an*.6,0]}}
const HV={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len:a=>Math.hypot(a[0],a[1],a[2])};
/* bounce the ball off a contact with outward normal n: restitution e, friction mu, spin taken into account */
function hpBounce(S,n,e,mu){const r=HV.mul(n,-HP.br),vc=HV.add(S.v,HV.cross(S.w,r)),vn=HV.dot(vc,n);if(vn>=0)return 0;
  S.v=HV.add(S.v,HV.mul(n,-(1+e)*vn));const vt=HV.sub(vc,HV.mul(n,vn)),vtl=HV.len(vt);
  if(vtl>1e-6){const t=HV.mul(vt,1/vtl),jt=Math.min(vtl*HP.mass/2.5,mu*(1+e)*Math.abs(vn)*HP.mass),J=HV.mul(t,-jt);
    S.v=HV.add(S.v,HV.mul(J,1/HP.mass));S.w=HV.add(S.w,HV.mul(HV.cross(r,J),1/HP.I))}
  return -vn}
/* run a whole shot. Returns whether it scored, every contact, and (if rec) the ball's path at 60 frames a second */
function hpSim(cfg,ph,launch,rec){const S={p:launch.p?launch.p.slice():hpP0(cfg),v:launch.v.slice(),w:launch.w.slice()},ev=[],fr=[];let t=0,inside=false,scored=false,scoreT=-1,rest=0,last=null,grounds=0,roll=0,lastA=null,pcy=null;
  const add=(k,a,sp)=>{const ex=ev[ev.length-1];if(ex&&ex.k===k&&t-ex.t2<.06){ex.t2=t;if(k==="rim"&&lastA!==null){let d=a-lastA;d=(d+540)%360-180;ex.arc+=Math.abs(d)}lastA=a;return}
    ev.push({k,t,t2:t,a,pos:k==="rim"?(Math.abs(a)<45?"front":Math.abs(a)>135?"back":a>0?"right":"left"):"",sp:+sp.toFixed(2),arc:0});lastA=a};
  for(let i=0;i<240*8;i++){t=i*HP.dt;const h=hpHoop(cfg,ph+t),cx=h.x,cy=HP.rimY+h.y,py=S.p[1];
    /* gravity, a little air drag, spin slowly fading */
    S.v[1]-=HP.g*HP.dt;const dr=1-.004*HP.dt;S.v=HV.mul(S.v,dr);S.w=HV.mul(S.w,1-.15*HP.dt);
    S.p=HV.add(S.p,HV.mul(S.v,HP.dt));
    /* net: softly slows the ball while it is inside */
    const hd=Math.hypot(S.p[0]-cx,S.p[2]);if(hd<HP.rimR&&S.p[1]<cy&&S.p[1]>cy-HP.netDepth){const k=1-3.2*HP.dt;S.v[0]*=k;S.v[2]*=k;S.v[1]*=1-1.1*HP.dt}
    /* the net catches a ball that has dropped in, and steers it down instead of letting it fly out the side */
    if(inside&&S.p[1]<cy&&S.p[1]>cy-HP.netDepth){const nr=HP.rimR-(cy-S.p[1])/HP.netDepth*.08-HP.br*.45,dx=S.p[0]-cx,dz=S.p[2],d=Math.hypot(dx,dz);
      if(d>nr){const nx=dx/d,nz=dz/d,vn=S.v[0]*nx+S.v[2]*nz,pen=d-nr;S.p[0]-=nx*pen*.35;S.p[2]-=nz*pen*.35;if(vn>0){S.v[0]-=nx*vn*.9;S.v[2]-=nz*vn*.9;S.v[1]*=1-.6*vn*HP.dt}}}
    /* rim: a ring of small colliders. Check the closest few */
    const ang=Math.atan2(S.p[0]-cx,S.p[2]),base=Math.round(ang/(2*Math.PI)*HP.nRim);let best=null,bd=1e9;
    for(let j=base-2;j<=base+2;j++){const a=j/HP.nRim*2*Math.PI,c=[cx+HP.rimR*Math.sin(a),cy,HP.rimR*Math.cos(a)],d=HV.len(HV.sub(S.p,c));if(d<bd){bd=d;best=c}}
    if(bd<HP.br+HP.tube){const n=HV.mul(HV.sub(S.p,best),1/bd);S.p=HV.add(best,HV.mul(n,HP.br+HP.tube+1e-4));const sp=hpBounce(S,n,HP.eRim,HP.mu);if(sp>.02||1)add("rim",Math.atan2(best[0]-cx,best[2])*180/Math.PI,sp)}
    /* backboard: flat face */
    const bz=HP.boardZ,by0=HP.boardBot+h.y,by1=HP.boardTop+h.y;
    if(S.p[2]-bz<HP.br&&S.p[2]>bz-.05&&Math.abs(S.p[0]-cx)<HP.boardW/2&&S.p[1]>by0&&S.p[1]<by1){S.p[2]=bz+HP.br+1e-4;const sp=hpBounce(S,[0,0,1],HP.eBoard,.3);if(sp>.05)add("board",0,sp)}
    /* the pole holding the hoop up, and the fence round the court */
    {const dx=S.p[0],dz=S.p[2]-HP.poleZ,d=Math.hypot(dx,dz);if(d<HP.br+HP.poleR&&S.p[1]<4.3){const n=[dx/d,0,dz/d];S.p[0]=n[0]*(HP.br+HP.poleR+1e-4);S.p[2]=HP.poleZ+n[2]*(HP.br+HP.poleR+1e-4);const sp=hpBounce(S,n,.5,.3);if(sp>.05)add("pole",0,sp)}}
    {const F=HP.fence;if(S.p[1]<3.4){if(S.p[0]<F[0]+HP.br){S.p[0]=F[0]+HP.br;if(hpBounce(S,[1,0,0],.3,.4)>.05)add("fence",0,1)}if(S.p[0]>F[1]-HP.br){S.p[0]=F[1]-HP.br;if(hpBounce(S,[-1,0,0],.3,.4)>.05)add("fence",0,1)}
      if(S.p[2]<F[2]+HP.br){S.p[2]=F[2]+HP.br;if(hpBounce(S,[0,0,1],.3,.4)>.05)add("fence",0,1)}if(S.p[2]>F[3]-HP.br){S.p[2]=F[3]-HP.br;if(hpBounce(S,[0,0,-1],.3,.4)>.05)add("fence",0,1)}}}
    /* ground */
    if(S.p[1]<HP.br){S.p[1]=HP.br;const sp=hpBounce(S,[0,1,0],HP.eGround,.6);if(sp>.25){add("ground",0,sp);grounds++}else{S.v[1]=Math.max(0,S.v[1]);const f=1-1.2*HP.dt;S.v[0]*=f;S.v[2]*=f;
      /* rolling: spin matches the speed along the ground */S.w=[ -S.v[2]/HP.br*-1,S.w[1]*.98,-S.v[0]/HP.br];}}
    /* scoring: the centre of the ball must come DOWN through the ring, then drop below the net. Only once per shot. */
    if(pcy===null)pcy=cy;if(!scored){if(py>pcy&&S.p[1]<=cy&&S.v[1]<0&&hd<HP.rimR-.03)inside=true;if(inside&&S.p[1]>cy+.06)inside=false;if(inside&&S.p[1]<cy-.3&&hd<HP.rimR+.06){scored=true;scoreT=t}}
    pcy=cy;
    if(rec&&i%4===0)fr.push({t,p:S.p.slice(),w:S.w.slice(),h:[h.x,h.y]});
    const spd=HV.len(S.v);if(S.p[1]<=HP.br+.001&&spd<.15)rest+=HP.dt;else rest=0;
    if(rest>.4||Math.abs(S.p[0])>14||S.p[2]>16||S.p[2]<-6)break}
  return{ok:scored,scoreT,ev,frames:fr,end:t}}
/* what kind of shot was it (for the commentary and for the tests) */
function hpKind(r){const W=e=>e.k==="rim"||e.k==="board",c=r.ev.filter(e=>W(e)&&(!r.ok||e.t<=r.scoreT+.05)),f=c[0],rims=r.ev.filter(e=>e.k==="rim"),hoopHits=r.ev.filter(W),roll=Math.max(0,...rims.map(e=>e.arc));
  const g=r.ev.filter(e=>e.k==="ground").length;let k;
  if(r.ok)k=!c.length?"swish":f.k==="board"?"bank":roll>100?"roll-in":"rim-in";
  else if(!hoopHits.length)k="airball";else if(roll>100)k="roll-out";else if(hoopHits.length>=3)k="multi";else if(hoopHits[0].k==="board")k="board";else k="rim-"+hoopHits[0].pos;
  return{k,contacts:hoopHits.length,roll:Math.round(roll),grounds:g}}
if(typeof module!=="undefined")module.exports={HP,HP_ROUNDS,HP_SUDDEN,HP_ALL,hpStreak,hpPowK,hpRound,hpP0,hpHoop,hpIdeal,hpAssist,hpLaunch,hpSim,hpKind};
