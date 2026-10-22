/* ===== Penalty physics (pure, no drawing). Used by the game, the replays, the Shadow Knight and the tests. =====
   World in metres, y up. The goal line is z = 0, the goal mouth is x from -3.66 to 3.66 and y from 0 to 2.44.
   The penalty spot is 11 m out at z = 11. Fixed time step, so the same kick and the same dive always give the same result. */
const PN={g:9.81,dt:1/240,br:.11,mass:.43,kd:.0135,mag:.02,spot:11,gw:3.66,gh:2.44,postR:.062,netD:1.9,eGround:.58,ePost:.62,eNet:.12,eBody:.3,eHand:.45,kz:.42};
PN.I=2/3*PN.mass*PN.br*PN.br;
/* keeper: Cass gets a slightly quicker, longer dive (his hidden advantage) */
/* when the keeper picked the right save area he goes early and gets there in time; otherwise the ball goes past him */
const PN_KSAVE={pre:.3,T:.48,travel:3.3,catchV:40};
const PN_KP={kid:{pre:.1,T:.56,travel:2.1,catchV:21},adult:{pre:.09,T:.57,travel:1.8,catchV:19}};
const PV={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len:a=>Math.hypot(a[0],a[1],a[2]),lerp:(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k]};
const pnEase=s=>s<=0?0:s>=1?1:s*s*(3-2*s);
/* The keeper's body at time t (t = 0 is the kick). dv = where he dives to on the goal {x,y}. Returns spheres for the physics and joints for drawing. */
function pnKeeper(dv,t,kid){const P=typeof kid==='object'?kid:kid?PN_KP.kid:PN_KP.adult,s=pnEase((t+P.pre)/P.T),z=PN.kz,H0=[0,.98],T=[dv.x,Math.max(.15,Math.min(2.6,dv.y))];
  let hip,u,hands,mid=Math.abs(T[0])<.75;
  if(mid){/* stays in the middle: steps, crouches or jumps, and brings the gloves to the ball */
    const hy=.98+(T[1]>1.75?(T[1]-1.75)*.75:T[1]<.55?-.5:T[1]<.9?-.25:0)*s;hip=[T[0]*.45*s,hy];u=[0,1];
    const sh=[hip[0],hip[1]+.55],ready=[[sh[0]-.32,hip[1]+.25],[sh[0]+.32,hip[1]+.25]],tg=(()=>{const d=[T[0]-sh[0],T[1]-sh[1]],l=Math.hypot(d[0],d[1]),m=Math.min(l,.86);return l>1e-6?[sh[0]+d[0]/l*m,sh[1]+d[1]/l*m]:sh})();
    hands=ready.map((r,i)=>[r[0]+(tg[0]+(i?.1:-.1)-r[0])*s,r[1]+(tg[1]-r[1])*s])}
  else{/* full dive: the body flies along the line from his hips towards the target, arms stretched out in front */
    const d=[T[0]-H0[0],T[1]-H0[1]],L=Math.hypot(d[0],d[1]),n=[d[0]/L,d[1]/L],go=Math.max(0,Math.min(P.travel,L-1.22)),hf=[H0[0]+n[0]*go,Math.max(.32,H0[1]+n[1]*go)],
      uf=(()=>{const e=[T[0]-hf[0],T[1]-hf[1]],l=Math.hypot(e[0],e[1]);return[e[0]/l,e[1]/l]})(),a0=Math.PI/2,a1=Math.atan2(uf[1],uf[0]),a=a0+(((a1-a0+3*Math.PI)%(2*Math.PI))-Math.PI)*s;
    hip=[H0[0]+(hf[0]-H0[0])*s,H0[1]+(hf[1]-H0[1])*s+Math.sin(Math.PI*s)*.22*(T[1]>.8?1:.4)];u=[Math.cos(a),Math.sin(a)];
    const hc=[hip[0]+u[0]*1.2,hip[1]+u[1]*1.2],k=Math.min(1,s*1.7);hands=[[hip[0]-.32,hip[1]+.25],[hip[0]+.32,hip[1]+.25]].map(r=>[r[0]+(hc[0]-r[0])*k,r[1]+(hc[1]-r[1])*k])}
  hip[1]=Math.max(.3,hip[1]);const at=k=>[hip[0]+u[0]*k,hip[1]+u[1]*k],J={hip:[hip[0],hip[1],z],u,head:[...at(.76),z],chest:[...at(.5),z],torso:[...at(.26),z],
    kneeL:[...at(-.45),z-.1],kneeR:[...at(-.45),z+.1],footL:[...at(-.9),z-.12],footR:[...at(-.9),z+.12],sh:[...at(.58),z],handL:[hands[0][0],hands[0][1],z+.06],handR:[hands[1][0],hands[1][1],z-.06]};
  if(!mid){const sd=[-u[1],u[0]];J.footL=[hip[0]-u[0]*.9+sd[0]*.12,hip[1]-u[1]*.9+sd[1]*.12,z];J.footR=[hip[0]-u[0]*.88-sd[0]*.12,hip[1]-u[1]*.88-sd[1]*.12,z];J.kneeL=PV.lerp(J.hip,J.footL,.5);J.kneeR=PV.lerp(J.hip,J.footR,.5)}
  else{J.footL=[hip[0]-.18,Math.max(.08,hip[1]-.9),z];J.footR=[hip[0]+.18,Math.max(.08,hip[1]-.9),z];J.kneeL=PV.lerp(J.hip,J.footL,.5);J.kneeR=PV.lerp(J.hip,J.footR,.5)}
  const elL=PV.lerp(J.sh,J.handL,.5),elR=PV.lerp(J.sh,J.handR,.5);J.elL=elL;J.elR=elR;
  const parts=[{c:J.handL,r:.11,k:"hand"},{c:J.handR,r:.11,k:"hand"},{c:elL,r:.08,k:"arm"},{c:elR,r:.08,k:"arm"},{c:J.head,r:.12,k:"body"},{c:J.chest,r:.18,k:"body"},{c:J.torso,r:.17,k:"body"},{c:J.hip,r:.16,k:"body"},
    {c:J.kneeL,r:.1,k:"leg"},{c:J.kneeR,r:.1,k:"leg"},{c:J.footL,r:.09,k:"leg"},{c:J.footR,r:.09,k:"leg"}];
  parts.forEach(p=>{p.c[1]=Math.max(p.r,p.c[1])});return{J,parts,s}}
/* a kick: tx,ty = where on the goal you aimed, pw = power (1 = just right), cu = curl (-1 bends left, 1 bends right) */
function pnAssist(sh,kid){const soft=(v,lim,k)=>Math.sign(v)*(Math.abs(v)<lim?Math.abs(v):lim+(Math.abs(v)-lim)*k);
  return{tx:+soft(sh.tx,kid?3.3:3.5,kid?.4:.7).toFixed(3),ty:+Math.max(.12,soft(sh.ty,kid?2.05:2.25,kid?.35:.7)).toFixed(3),pw:+Math.max(.45,Math.min(1.5,sh.pw)).toFixed(3),cu:+Math.max(-1,Math.min(1,sh.cu||0)).toFixed(3)}}
function pnFree(v,w,stopZ){/* flight with no obstacles, to aim the kick */const S={p:[0,PN.br,PN.spot],v:v.slice(),w:w.slice()};for(let i=0;i<4*240;i++){pnStep(S);if(S.p[2]<=stopZ)return S.p}return S.p}
function pnStep(S){const sp=PV.len(S.v),dt=PN.dt,a=PV.add(PV.mul(S.v,-PN.kd*sp),PV.mul(PV.cross(S.w,S.v),PN.mag));a[1]-=PN.g;S.v=PV.add(S.v,PV.mul(a,dt));S.p=PV.add(S.p,PV.mul(S.v,dt));S.w=PV.mul(S.w,1-.25*dt)}
/* turn the kick into a starting velocity and spin. Hitting it too hard makes it rise (and maybe fly over). */
function pnLaunch(sh,kid){if(sh.roll){/* far too soft: it just rolls along the grass */const V=sh.rv||5,L=Math.hypot(sh.tx,PN.spot);return{v:[+(sh.tx/L*V).toFixed(4),0,+(-PN.spot/L*V).toFixed(4)],w:[-V/PN.br,0,0]}}
  const sg=sh.tx>=0?1:-1,out=sh.out||0,cu=out?sg*Math.min(1,.35+out*.5):(sh.cu||0);
  const V=Math.max(9,Math.min(34,25*sh.pw)),lift=sh.lift!=null?sh.lift:Math.max(0,sh.pw-(kid?1.15:1.08))*(kid?3.5:5),T=[sh.tx+sg*out,sh.ty+lift],w=[-12*Math.min(1,Math.max(0,sh.pw-.5)),-cu*34,0];
  const P0=[0,PN.br,PN.spot],dz=-PN.spot,tf=PN.spot/V;let v=[(T[0]-P0[0])/tf,(T[1]-P0[1])/tf+PN.g*tf/2,dz/tf];
  for(let it=0;it<6;it++){const p=pnFree(v,w,0),tt=PN.spot/Math.max(5,-v[2]);v=[v[0]+(T[0]-p[0])/tt,v[1]+(T[1]-p[1])/tt,v[2]]}
  return{v:v.map(x=>+x.toFixed(4)),w}}
function pnBounce(S,n,e,mu,vel){const rv=PV.sub(S.v,vel||[0,0,0]),r=PV.mul(n,-PN.br),vc=PV.add(rv,PV.cross(S.w,r)),vn=PV.dot(vc,n);if(vn>=0)return 0;
  S.v=PV.add(S.v,PV.mul(n,-(1+e)*vn));const vt=PV.sub(vc,PV.mul(n,vn)),l=PV.len(vt);
  if(l>1e-6){const jt=Math.min(l*PN.mass/2.5,mu*(1+e)*Math.abs(vn)*PN.mass),J=PV.mul(vt,-jt/l);S.v=PV.add(S.v,PV.mul(J,1/PN.mass));S.w=PV.add(S.w,PV.mul(PV.cross(r,J),1/PN.I))}return -vn}
function pnSeg(p,a,b){const ab=PV.sub(b,a),k=Math.max(0,Math.min(1,PV.dot(PV.sub(p,a),ab)/PV.dot(ab,ab)));return PV.add(a,PV.mul(ab,k))}
/* run the whole kick. kick = launch from pnLaunch, dv = keeper's dive target, kidK = is the keeper Cass */
function pnSim(kick,dv,kidK,rec,opt){opt=opt||{};const S={p:[0,PN.br,PN.spot],v:kick.v.slice(),w:kick.w.slice()},ev=[],fr=[],G=PN,KP=opt.save?PN_KSAVE:kidK?PN_KP.kid:PN_KP.adult;
  let t=0,goal=false,goalT=-1,caught=null,rest=0,cross=null,prevK=null,touched=false;
  const add=(k,sp,x)=>{const e=ev[ev.length-1];if(e&&e.k===k&&t-e.t2<.08){e.t2=t;return}ev.push({k,t,t2:t,sp:+sp.toFixed(2),...(x||{})})};
  const posts=[[[-G.gw-G.postR,0,0],[-G.gw-G.postR,G.gh+G.postR,0],"post"],[[G.gw+G.postR,0,0],[G.gw+G.postR,G.gh+G.postR,0],"post"],[[-G.gw-G.postR,G.gh+G.postR,0],[G.gw+G.postR,G.gh+G.postR,0],"bar"]];
  for(let i=0;i<240*5;i++){t=i*G.dt;const pp=S.p.slice();
    const K=pnKeeper(dv,t,KP);if(!prevK)prevK=K;
    if(caught){/* held in the keeper's gloves */const c=K.J[caught.at];S.p=PV.add(c,caught.off);S.v=PV.mul(PV.sub(S.p,pp),1/G.dt)}
    else{pnStep(S);
      /* posts and crossbar: round bars */
      for(const [a,b,k] of posts){const q=pnSeg(S.p,a,b),d=PV.sub(S.p,q),l=PV.len(d);if(l<G.br+G.postR){const n=PV.mul(d,1/l);S.p=PV.add(q,PV.mul(n,G.br+G.postR+1e-4));const sp=pnBounce(S,n,G.ePost,.25);if(sp>.3)add(k,sp,{x:+q[0].toFixed(2),y:+q[1].toFixed(2)})}}
      /* keeper: every body part is a moving ball shape */
      for(let j=0;j<(opt.ghost?0:K.parts.length);j++){const P=K.parts[j],d=PV.sub(S.p,P.c),l=PV.len(d);if(l<G.br+P.r&&l>1e-6){const n=PV.mul(d,1/l),vel=PV.mul(PV.sub(P.c,prevK.parts[j].c),1/G.dt),rel=PV.len(PV.sub(S.v,vel));
        S.p=PV.add(P.c,PV.mul(n,G.br+P.r+1e-4));
        const at=P.k==="hand"?(j===0?"handL":"handR"):P.k==="body"&&j>=4&&j<=6?"chest":null;
        if(!goal&&at&&rel<KP.catchV*(P.k==="hand"?.8:1)&&S.p[2]>-.05){caught={at,off:PV.sub(S.p,K.J[at])};S.v=vel;S.w=PV.mul(S.w,.1);add("catch",rel);touched=true;break}
        const sp=pnBounce(S,n,P.k==="hand"?G.eHand:G.eBody,.35,vel);if(sp>.2){add("keeper",sp,{part:P.k});touched=true}}}
      /* the net: soft, catches the ball. Planes behind the goal: back, roof and two sides */
      const inX=Math.abs(S.p[0])<G.gw,inY=S.p[1]<G.gh,behind=S.p[2]<0,wasIn=Math.abs(pp[0])<G.gw&&pp[1]<G.gh&&pp[2]<0;
      const net=(n,axis,val,from)=>{S.p[axis]=val;const sp=pnBounce(S,n,G.eNet,.9);S.v=PV.mul(S.v,.55);if(sp>.3)add("net",sp)};
      if(behind&&S.p[2]>-G.netD-1){
        if(S.p[2]<-G.netD+G.br&&pp[2]>=-G.netD+G.br&&Math.abs(S.p[0])<G.gw+.2&&S.p[1]<G.gh+.2)net([0,0,1],2,-G.netD+G.br);
        if(Math.abs(S.p[0])<G.gw+.2&&S.p[2]>-G.netD-.05){if(pp[1]<=G.gh-G.br&&S.p[1]>G.gh-G.br&&wasIn)net([0,-1,0],1,G.gh-G.br);else if(pp[1]>=G.gh+G.br&&S.p[1]<G.gh+G.br&&pp[2]<0)net([0,1,0],1,G.gh+G.br)}
        for(const sg of [-1,1]){const xi=sg*(G.gw-G.br),xo=sg*(G.gw+G.br);if(S.p[1]<G.gh+.1&&S.p[2]>-G.netD-.05){
          if(sg*pp[0]<=sg*xi&&sg*S.p[0]>sg*xi&&pp[2]<0)net([-sg,0,0],0,xi);else if(sg*pp[0]>=sg*xo&&sg*S.p[0]<sg*xo&&pp[2]<0)net([sg,0,0],0,xo)}}}
      /* advertising boards and the stand stop the ball far away */
      if(S.p[2]<-4.2+G.br){S.p[2]=-4.2+G.br;if(pnBounce(S,[0,0,1],.35,.4)>.3)add("boards",1)}
      /* the grass */
      if(S.p[1]<G.br){S.p[1]=G.br;const sp=pnBounce(S,[0,1,0],G.eGround,.5);if(sp>.6)add("ground",sp);else{S.v[1]=Math.max(0,S.v[1]);const f=1-.9*G.dt;S.v[0]*=f;S.v[2]*=f;S.w=[S.v[2]/G.br,S.w[1]*.97,-S.v[0]/G.br]}}}
    /* where it crossed the goal line (for wide / over) */
    if(!cross&&pp[2]>0&&S.p[2]<=0){const k=pp[2]/(pp[2]-S.p[2]);cross={x:+(pp[0]+(S.p[0]-pp[0])*k).toFixed(3),y:+(pp[1]+(S.p[1]-pp[1])*k).toFixed(3),t}}
    /* goal: the WHOLE ball over the line, between the posts and under the bar. Counted once. */
    if(!goal&&!caught&&pp[2]>-G.br&&S.p[2]<=-G.br&&Math.abs(S.p[0])<G.gw&&S.p[1]<G.gh){goal=true;goalT=t}
    prevK=K;if(rec&&i%4===0)fr.push({t,p:S.p.slice(),w:S.w.slice()});
    if(PV.len(S.v)<.12&&S.p[1]<G.br+.01)rest+=G.dt;else rest=0;
    if(rest>.35||S.p[2]>24||Math.abs(S.p[0])>24||(caught&&t>KP.T+.9)||(goal&&t>goalT+2.2))break}
  return{goal,goalT,ev,frames:fr,end:t,cross,caught:!!caught,touched}}
/* name what happened, for the commentary and the tests */
function pnKind(r){const c=r.cross,hit=r.ev.filter(e=>e.k!=="ground"&&e.k!=="net"&&e.k!=="boards"&&(r.goal?e.t<=r.goalT:!c||e.t<=c.t+.03)),f=hit[0];
  if(r.goal){if(hit.some(e=>e.k==="keeper"))return"keeper-in";if(f&&f.k==="post")return"post-in";if(f&&f.k==="bar")return"bar-in";
    if(c&&Math.abs(c.x)>2.3&&c.y>1.5)return"top-corner";if(c&&Math.abs(c.x)>2.3&&c.y<.7)return"low-corner";if(c&&Math.abs(c.x)<1)return"middle";return"goal"}
  if(r.caught)return"caught";if(f&&f.k==="keeper")return"saved";if(f&&f.k==="post")return"post";if(f&&f.k==="bar")return"bar";
  if(c){if(Math.abs(c.x)>=PN.gw)return c.y>=PN.gh?"over":"wide";if(c.y>=PN.gh)return"over"}return"short"}
/* ---- the 7 save areas, as the SHOOTER sees the goal (minus x = shooter's left) ---- */
const PN_Z=[{n:"LEFT TOP",x:-2.4,y:1.85},{n:"LEFT MIDDLE",x:-2.4,y:1.15},{n:"LEFT BOTTOM",x:-2.4,y:.42},{n:"CENTRE",x:0,y:1.05},{n:"RIGHT TOP",x:2.4,y:1.85},{n:"RIGHT MIDDLE",x:2.4,y:1.15},{n:"RIGHT BOTTOM",x:2.4,y:.42}];
const pnZone=(x,y)=>{let b=0,bd=1e9;PN_Z.forEach((z,i)=>{const d=Math.hypot(x-z.x,y-z.y);if(d<bd){bd=d;b=i}});return b};
/* power bar: 0 = empty, 1 = full. The green middle is perfect. Cass's green is a bit wider. */
const PN_BAR={mid:.56,kid:.11,adult:.075};
/* what the power does:
   green  = perfect, goes exactly where you picked
   yellow above = a bit hard: rises and drifts out a little (can clip the post or bar)
   red top = far too hard: high shots fly over the bar, low or side shots curl out past the post
   yellow below = a bit soft: slower, so the keeper can save it from the next area along too
   red bottom = far too soft: it rolls along the grass and doesn't even reach the goal */
function pnPower(p,kid,tg){const h=kid?PN_BAR.kid:PN_BAR.adult,top=PN_BAR.mid+h,bot=PN_BAR.mid-h,tx=tg?tg.tx:0,ty=tg?tg.ty:1,f=v=>+v.toFixed(3);
  if(p>=bot&&p<=top)return{pw:1,lift:0,out:0,slack:0,q:"perfect"};
  if(p>top){const e=p-top;if(e<.1)return{pw:f(1+e*.6),lift:f(e*2.4),out:f(e*2.6),slack:0,q:"hard"};
    return ty>1.25||Math.abs(tx)<1?{pw:f(1.1+e*.4),lift:f(.95+e*3),out:f(e*.8),slack:0,q:"too hard"}:{pw:f(1.1+e*.4),lift:.15,out:f(.75+e*3),slack:0,q:"too hard"}}
  const e=bot-p;if(e<.12)return{pw:f(Math.max(.68,1-e*2.6)),lift:f(-e*.8),out:0,slack:.95,q:"soft"};
  return{pw:.3,lift:0,out:0,slack:0,roll:1,rv:f(Math.max(5.6,7.3-(e-.12)*5)),q:"too soft"}}
/* a whole kick decided: where it would cross the line, and whether the keeper's area was the closest one */
function pnPlan(s,d){if(s.roll){const L=pnLaunch(s,s.kid);return{L,cross:null,zone:-1,save:false,dv:{x:0,y:1},opt:{ghost:1}}}const L=pnLaunch(s,s.kid),c=pnFree(L.v,L.w,0),cross={x:c[0],y:c[1]},inG=Math.abs(c[0])<PN.gw-.03&&c[1]<PN.gh-.03&&c[1]>0,zi=pnZone(c[0],c[1]),kz=PN_Z[d.z];
  const near=zi===d.z||Math.hypot(c[0]-kz.x,c[1]-kz.y)-Math.hypot(c[0]-PN_Z[zi].x,c[1]-PN_Z[zi].y)<(s.slack||0)+(d.kid?.35:0),save=inG&&near;
  return{L,cross,zone:zi,save,dv:save?{x:+c[0].toFixed(3),y:+Math.max(.2,c[1]).toFixed(3)}:{x:kz.x,y:kz.y},opt:save?{save:1}:{ghost:1}}}
function pnRun(s,d,rec){const P=pnPlan(s,d);let r=pnSim(P.L,P.dv,!!d.kid,rec,P.opt);
  /* right area: the keeper must get it. If his first dive misses (rare, e.g. low under him), he goes again slightly differently */
  if(P.save&&r.goal)for(const o of [[0,-.25],[0,.25],[.2,0],[-.2,0],[0,-.5]]){const dv={x:P.dv.x+o[0],y:Math.max(.12,P.dv.y+o[1])},r2=pnSim(P.L,dv,!!d.kid,rec,P.opt);if(!r2.goal){r=r2;P.dv=dv;break}}
  r.plan=P;return r}
if(typeof module!=="undefined")module.exports={PN,PN_KP,PN_KSAVE,PN_Z,PN_BAR,pnZone,pnPower,pnPlan,pnRun,pnFree,pnKeeper,pnAssist,pnLaunch,pnSim,pnKind,pnStep};
