/* ===== Smackerball physics (pure, no drawing). Used by the game, the Shadow Knight and the tests. =====
   A room 6 m long and 3.6 m wide, metres, y up. Dad (X) sits at the +z end, Cass (O) at the -z end, halfway is z = 0.
   Your goal is the whole back wall behind you, up to head height. Two red boxes stand against the side walls at halfway.
   A ball that lands on top of one stays there: still in play if that half's player has a touch left, otherwise dead. */
const SR={g:9.81,dt:1/240,br:.1,L:3,W:1.45,GH:.9,WH:2.4,bx0:.95,bx1:1.45,bz:.9,bh:.45,eFloor:.72,eWall:.78,eBox:.4,eHand:.86,drag:.06,roll:.5,hy:.11};
/* glove size: ex = half width, half height, half depth of the solid glove (it's as big as the picture) */
const SR_HAND={kid:{r:.27,ex:[.34,.27,.16],max:9.6,sp:5.5,reach:.68},adult:{r:.24,ex:[.3,.25,.15],max:8.6,sp:5.5,reach:.6}};
const SV={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len:a=>Math.hypot(a[0],a[1],a[2])};
const srOwner=p=>p[2]>0?"X":"O";            /* whose half the ball is in */
const srWallOf=w=>w==="X"?SR.L:-SR.L;         /* the z of someone's goal wall */
/* seeded random numbers, so a test (or a replay) can repeat exactly */
function srRng(seed){let s=(Math.imul(seed|0,2654435761)^0x9e3779b9)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function srBounce(S,n,e,mu){const vn=SV.dot(S.v,n);if(vn>=0)return 0;S.v=SV.add(S.v,SV.mul(n,-(1+e)*vn));const vt=SV.sub(S.v,SV.mul(n,SV.dot(S.v,n))),l=SV.len(vt);
  /* friction takes off speed along the surface in proportion to how hard it hit */if(l>1e-6){const cut=Math.min(l,mu*(1+e)*-vn);S.v=SV.sub(S.v,SV.mul(vt,cut/l))}return -vn}
/* is the ball trapped: behind a box (in the gap by the wall) or sitting on top of one */
function srTrapped(p){const ax=Math.abs(p[0]),az=Math.abs(p[2]);if(az>SR.bz+.02)return"";if(p[1]>SR.bh&&ax>SR.bx0-.02&&ax<SR.bx1+.02)return"top";if(ax>SR.bx1-.01&&p[1]<SR.bh+.05)return"behind";return""}
/* one small step. hands = [{who,p,v,r,max}], rnd = random 0..1 for a little spin on rebounds. Returns events. */
function srStep(S,hands,rnd){const R=SR,dt=R.dt,ev=[],pp=S.p.slice();
  S.v[1]-=R.g*dt;S.v=SV.mul(S.v,1-R.drag*dt);S.p=SV.add(S.p,SV.mul(S.v,dt));
  /* floor */
  if(S.p[1]<R.br){S.p[1]=R.br;const sp=srBounce(S,[0,1,0],R.eFloor,.04);if(sp>.5)ev.push({k:"floor",sp});else{S.v[1]=Math.max(0,S.v[1]);const f=1-R.roll*dt;S.v[0]*=f;S.v[2]*=f}}
  if(S.p[1]>R.WH-R.br){S.p[1]=R.WH-R.br;srBounce(S,[0,-1,0],.6,.1)}
  /* side walls */
  for(const sg of [-1,1])if(sg*S.p[0]>R.W-R.br){S.p[0]=sg*(R.W-R.br);const sp=srBounce(S,[-sg,0,0],R.eWall,.08);if(sp>.4)ev.push({k:"wall",sp})}
  /* back walls: under head height it's a GOAL for the other player; above, it bounces off */
  for(const w of ["X","O"]){const z=srWallOf(w),sg=Math.sign(z);if(sg*S.p[2]>sg*z-R.br){if(S.p[1]<R.GH&&!S.dead){ev.push({k:"goal",by:w==="X"?"O":"X",at:[S.p[0],S.p[1]]});S.p[2]=z-sg*R.br;S.v=[0,0,0];S.dead=1;return ev}
      S.p[2]=z-sg*R.br;const sp=srBounce(S,[0,0,-sg],R.eWall,.08);if(sp>.4)ev.push({k:"wall",sp,high:1})}}
  /* the two red boxes: soft, not very bouncy, and grippy on top */
  for(const sg of [-1,1]){const lo=[sg>0?R.bx0:-R.bx1,0,-R.bz],hi=[sg>0?R.bx1:-R.bx0,R.bh,R.bz],q=[0,1,2].map(i=>Math.max(lo[i],Math.min(hi[i],S.p[i]))),d=SV.sub(S.p,q),l=SV.len(d);
    if(l<R.br){let n;if(l>1e-6)n=SV.mul(d,1/l);else{/* inside: push out the nearest way */const dz=[S.p[0]-lo[0],hi[0]-S.p[0],hi[1]-S.p[1],S.p[2]-lo[2],hi[2]-S.p[2]],m=Math.min(...dz),k=dz.indexOf(m);n=[[-1,0,0],[1,0,0],[0,1,0],[0,0,-1],[0,0,1]][k]}
      S.p=SV.add(q,SV.mul(n,R.br+1e-4));const top=n[1]>.7,sp=srBounce(S,n,top?.25:R.eBox,top?.5:.15);if(sp>.3)ev.push({k:"box",sp,top})}}
  /* hands touching the ball: a still hand stops it softly (so you can stop it, then slap it); a moving hand pushes it along, low */
  /* gloves are solid, the size of the picture (an egg shape: wide, half a metre tall, fairly deep). A still or slow glove SAVES the ball softly;
     a glove moving fast into the ball SLAPS it the way the glove is going, with some air. */
  for(const H of hands||[]){const ex=H.ex||[H.r,H.r,H.r],c=[H.p[0],H.p[1]-SR.hy+ex[1],H.p[2]],d=SV.sub(S.p,c),A=[ex[0]+R.br,ex[1]+R.br,ex[2]+R.br],q=Math.hypot(d[0]/A[0],d[1]/A[1],d[2]/A[2]);
    if(q<1&&q>1e-6){let n=[d[0]/(A[0]*A[0]),Math.max(0,d[1]/(A[1]*A[1])),d[2]/(A[2]*A[2])];let nl=SV.len(n)||1;n=SV.mul(n,1/nl);
      /* the glove's flat side faces the other player: balls coming at it bounce back their way, not off sideways */const fz=H.who==="X"?-1:1;if(n[2]*fz>-.2){n=[n[0]*.45,n[1]*.45,n[2]+fz*1.2];nl=SV.len(n);n=SV.mul(n,1/nl)}S.p=SV.add(c,SV.mul(d,1/q*1.002));S.p[1]=Math.max(S.p[1],R.br);
      const hs=Math.hypot(H.v[0],H.v[2]),rel=SV.sub(S.v,H.v),vn=SV.dot(rel,n);if(vn<0||hs>1.5){
        if(hs>1.5&&SV.dot(H.v,n)>0){/* SLAP */const P=Math.min(H.max,Math.max(3.5,2.4+hs*1.0)),dir=[H.v[0]/hs,H.v[2]/hs];S.v=[dir[0]*P,srLift(P),dir[1]*P];ev.push({k:"touch",who:H.who,sp:+P.toFixed(2),smack:true,slap:1,dir})}
        else if(vn<0){/* SAVE: soak it up */S.v=SV.add(S.v,SV.mul(n,-1.3*vn));S.v[1]=Math.min(S.v[1],.3);const a=((rnd?rnd():.5)-.5)*.2,cs=Math.cos(a),sn=Math.sin(a),vx=S.v[0],vz=S.v[2];S.v[0]=vx*cs-vz*sn;S.v[2]=vx*sn+vz*cs;
          const sp=SV.len(S.v);if(sp>H.max)S.v=SV.mul(S.v,H.max/sp);ev.push({k:"touch",who:H.who,sp:+sp.toFixed(2),smack:false})}}}}
  /* stuck behind or on a box: dead ball after a moment */
  const tr=srTrapped(S.p);if(tr&&SV.len(S.v)<.6){S.st=(S.st||0)+dt;if(tr==="behind"&&S.st>.5&&!S.dead){S.dead=1;ev.push({k:"stuck",where:tr})}}else S.st=0;S.top=tr==="top"&&SV.len(S.v)<.6;
  if(!S.dead&&srOwner(pp)!==srOwner(S.p))ev.push({k:"cross",to:srOwner(S.p)});
  return ev}
/* ---- a SLAP: you tap (straight at their wall) or flick (the way you flicked). The hand winds up and swings; 0.08 s later,
   if the ball is within reach, it flies off low along the floor in that direction. Easy to hit with purpose. ---- */
const SR_SLAP_T=.08;
function srSlap(G,who,dir,power){const l=Math.hypot(dir[0],dir[1])||1;G.slaps=G.slaps||[];G.slaps.push({who,at:(G.t||0)+SR_SLAP_T,dir:[dir[0]/l,dir[1]/l],power})}
function srSlapHit(G,s){const H=G.hands[s.who],B=G.ball,dx=B.p[0]-H.p[0],dz=B.p[2]-H.p[2],reach=H.reach||.5;
  if(Math.hypot(dx,dz)>reach||B.p[1]>Math.max(.75,H.p[1]+.45)||B.dead)return null;
  if(srOwner(B.p)!==s.who&&srOwner(H.p)!==s.who)return null;
  const P=Math.min(H.max,s.power);B.v=[s.dir[0]*P,srLift(P),s.dir[1]*P];B.dead=0;B.st=0;H.lastT=G.t;return{k:"touch",who:s.who,sp:+P.toFixed(2),smack:true,slap:1,res:srTouch(G,s.who)}}
/* every slap lifts the ball into a low arc: it flies and bounces, but mostly stays under head height */
const srLift=P=>1.0+P*.22;
/* a SWIPE through the ball: your finger's path on the floor (a -> b). If it passes near the ball (in your half), the ball goes
   along that line at a speed set by how fast you swiped. This is the flick. */
function srSwipeHit(G,who,a,b,power){const B=G.ball,H=G.hands[who];if(B.dead||G.pen)return null;if(srOwner(B.p)!==who)return null;
  const ab=[b[0]-a[0],b[2]-a[2]],l=Math.hypot(ab[0],ab[1]);if(l<.05)return null;const ap=[B.p[0]-a[0],B.p[2]-a[2]],k=Math.max(0,Math.min(1,(ap[0]*ab[0]+ap[1]*ab[1])/(l*l))),
    cx=a[0]+ab[0]*k-B.p[0],cz=a[2]+ab[1]*k-B.p[2],near=Math.hypot(cx,cz);if(near>(H.reach||.6)*.75||B.p[1]>.8)return null;
  const P=Math.min(H.max,Math.max(3.5,power)),d=[ab[0]/l,ab[1]/l];B.v=[d[0]*P,srLift(P),d[1]*P];B.dead=0;B.st=0;H.lastT=G.t;return{k:"touch",who,sp:+P.toFixed(2),smack:true,slap:1,dir:d,res:srTouch(G,who)}}
/* a hand over a red box rests on top of it (so it can reach a ball sitting up there) */
function srHandY(p,r){const ax=Math.abs(p[0]),az=Math.abs(p[2]);return ax>SR.bx0-r*.5&&ax<SR.bx1+r*.5&&az<SR.bz+r*.5?SR.bh+SR.hy*.7:SR.hy}
/* run the ball on its own (no hands moving) for a while; used by tests and to look ahead */
function srRun(S,secs,hands,rnd){const out=[];for(let i=0;i<secs*240;i++){const e=srStep(S,hands,rnd);e.forEach(x=>{x.t=+(i*SR.dt).toFixed(4);out.push(x)});if(S.dead)break}return out}

/* ---- one game tick for the whole table: moves the ball in small steps against both hands.
   Touches only count in the toucher's own half; a 3rd touch gives the other player a penalty. ---- */
function srTick(G,dt,rnd){const out=[],n=Math.max(1,Math.round(dt/SR.dt)),hs=[G.hands.X,G.hands.O].filter(h=>h&&!h.ghost);if(G.ball.dead||G.pen)return out;
  const ends=hs.map(h=>h.p.slice()),starts=hs.map(h=>h.pp||h.p);
  /* how fast each glove is moving this tick (from where it was to where it is now) */hs.forEach((h,j)=>{if(h.pp){const T=n*SR.dt;h.v=[(ends[j][0]-starts[j][0])/T,0,(ends[j][2]-starts[j][2])/T]}});
  for(let i=0;i<n;i++){/* slaps whose moment of impact has come */if(G.slaps&&G.slaps.length){const due=G.slaps.filter(q=>q.at<=(G.t||0));G.slaps=G.slaps.filter(q=>q.at>(G.t||0));for(const q of due){const h=srSlapHit(G,q);if(h){out.push(h);if(G.pen)break}}if(G.pen)break}
    /* move the hands a bit each small step too, so a fast swipe can't jump over the ball */hs.forEach((h,j)=>{const k=(i+1)/n,q=[starts[j][0]+(ends[j][0]-starts[j][0])*k,0,starts[j][2]+(ends[j][2]-starts[j][2])*k];q[1]=srHandY(q,h.r);h.p=q});
    const e=srStep(G.ball,hs,rnd);for(const x of e){if(x.k==="touch"){const now=G.t||0,H=G.hands[x.who];if(srOwner(G.ball.p)!==x.who&&srOwner(H.p)!==x.who)continue;
        if(now-(H.lastT||-1)<.35)continue;H.lastT=now;x.res=srTouch(G,x.who)}else if(x.k==="cross")srCross(G,x.to);out.push(x)}
    /* a ball sitting on top of a box: still playable if that half's player has a touch left; otherwise (or if nobody plays it for 6 s) it's dead */
    const B=G.ball;if(B.top&&!B.dead){B.topT=(B.topT||0)+SR.dt;const own=srOwner(B.p),used=(G.touch&&G.touch[own])||0;if((used>=2&&B.topT>.6)||B.topT>6){B.dead=1;out.push({k:"stuck",where:"top"})}}else B.topT=0;
    G.t=(G.t||0)+SR.dt;if(G.ball.dead||G.pen)break}hs.forEach((h,j)=>{h.p=ends[j];h.p[1]=srHandY(h.p,h.r);h.pp=h.p.slice()});return out}
/* ---- the 2-touch rule: count touches in your own half; the count resets when the ball crosses to the other half ---- */
function srTouch(G,who){if(G.pen)return null;G.touch=G.touch||{X:0,O:0};G.touch[who]++;if(G.touch[who]>2){G.touch={X:0,O:0};G.pen=who==="X"?"O":"X";return"pen"}return"ok"}
function srCross(G,to){G.touch=G.touch||{X:0,O:0};G.touch[to]=0;G.touch[to==="X"?"O":"X"]=0}

/* ---- the Shadow Knight's hand. It never just gives up: with 2 touches used, if the ball sits in its half it has to hit it, and that's a penalty ---- */
function srAI(G,dt,kidOpp,rnd){const A=G.ai=G.ai||{wait:0,slow:0,aim:0,cool:0},H=G.hands.O,b=G.ball.p,v=G.ball.v,P=kidOpp?{sp:2.7,pw:5.4}:{sp:3.4,pw:6.6},home=[b[0]*.55,SR.hy,-2.3];
  const inMine=b[2]<0,used=(G.touch&&G.touch.O)||0,sp=Math.hypot(v[0],v[2]);let tgt=home;A.wait=Math.max(0,A.wait-dt);A.cool=Math.max(0,A.cool-dt);
  if(inMine&&!G.pen&&A.wait<=0){A.slow=sp<.45&&b[1]<.2?A.slow+dt:0;
    const may=used<2||A.slow>.9;   /* the fix: after 0.9 s of a dead ball it must play it (3rd touch = penalty to you) */
    if(may){if(!A.aimSet){A.aim=((rnd?rnd():.5)-.5)*2.6;A.aimSet=1}const to=[A.aim,0,SR.L],dx=to[0]-b[0],dz=to[2]-b[2],dl=Math.hypot(dx,dz);
      /* stand just behind the ball, then slap it towards your wall */
      const behind=[b[0]-dx/dl*.28,SR.hy,b[2]-dz/dl*.28];tgt=behind;
      if(A.cool<=0&&Math.hypot(H.p[0]-b[0],H.p[2]-b[2])<(H.reach||.5)*.85&&sp<3){srSlap(G,"O",[dx,dz],P.pw*(.85+(rnd?rnd():.5)*.3));A.cool=.6;A.aimSet=0;A.slapped=1}}}
  else{A.slow=0;A.aimSet=0}
  const mx=P.sp*dt;tgt=[Math.max(-SR.W+H.r,Math.min(SR.W-H.r,tgt[0])),SR.hy,Math.max(-2.7,Math.min(-H.r,tgt[2]))];
  const d=[tgt[0]-H.p[0],0,tgt[2]-H.p[2]],l=Math.hypot(d[0],d[2]),st=Math.min(l,mx),np=l>1e-6?[H.p[0]+d[0]/l*st,SR.hy,H.p[2]+d[2]/l*st]:H.p.slice();
  H.v=[(np[0]-H.p[0])/dt,0,(np[2]-H.p[2])/dt];H.p=np}

/* ---- penalties: taken from the halfway line, same controls as Penalties (tap a spot, flick on the power bar; keeper picks an area) ----
   Worked out as if the shooter is at halfway shooting at the wall at z = -L; the game mirrors it for the other end. */
const SR_Z=[{n:"LEFT TOP",x:-.95,y:.68},{n:"LEFT MIDDLE",x:-.95,y:.4},{n:"LEFT BOTTOM",x:-.95,y:.12},{n:"CENTRE",x:0,y:.35},{n:"RIGHT TOP",x:.95,y:.68},{n:"RIGHT MIDDLE",x:.95,y:.4},{n:"RIGHT BOTTOM",x:.95,y:.12}];
const srZone=(x,y)=>{let b=0,bd=1e9;SR_Z.forEach((z,i)=>{const d=Math.hypot(x-z.x,(y-z.y)*1.6);if(d<bd){bd=d;b=i}});return b};
const srZd=(x,y,z)=>Math.hypot(x-z.x,(y-z.y)*1.6);
/* power bar (same bar as Penalties): green perfect; too hard flies above head height; a bit soft is slower and easier to save; far too soft rolls and stops short */
function srPower(p,kid){const h=kid?.11:.075,mid=.56,top=mid+h,bot=mid-h,f=v=>+v.toFixed(3);if(p>=bot&&p<=top)return{pw:1,lift:0,slack:0,q:"perfect"};
  if(p>top){const e=p-top;return e<.1?{pw:f(1+e*.5),lift:f(e*1.4),slack:0,q:"hard"}:{pw:f(1.08+e*.3),lift:f(.55+e*1.6),slack:0,q:"too hard"}}
  const e=bot-p;return e<.12?{pw:f(Math.max(.62,1-e*2.8)),lift:f(-e*.4),slack:.5,q:"soft"}:{pw:.2,lift:0,slack:0,roll:1,rv:f(Math.max(1.5,2.1-(e-.12)*2)),q:"too soft"}}
function srFree(v,stopZ){const S={p:[0,SR.br,0],v:v.slice()};for(let i=0;i<3*240;i++){S.v[1]-=SR.g*SR.dt;S.v=SV.mul(S.v,1-SR.drag*SR.dt);S.p=SV.add(S.p,SV.mul(S.v,SR.dt));if(S.p[2]<=stopZ)return S.p}return S.p}
function srPenLaunch(s){if(s.roll){const V=s.rv||1.8,L=Math.hypot(s.tx,SR.L);return[s.tx/L*V,0,-SR.L/L*V]}
  const V=Math.max(3,Math.min(13,8.5*s.pw)),T=[s.tx,Math.max(SR.br,s.ty+(s.lift||0))],zf=-SR.L+SR.br,tf=-zf/V;let v=[T[0]/tf,(T[1]-SR.br)/tf+SR.g*tf/2,-V];
  for(let i=0;i<6;i++){const p=srFree(v,zf);v=[v[0]+(T[0]-p[0])/tf,v[1]+(T[1]-p[1])/tf,v[2]]}return v.map(x=>+x.toFixed(4))}
/* the keeper's hand: slides from its spot to the area it picked */
const SR_KZ=-SR.L+.38;
function srKeeperHand(dv,t,save){const pre=save?.25:.1,T=save?.28:.38,k=Math.max(0,Math.min(1,(t+pre)/T)),e=k*k*(3-2*k);return[dv.x*e,SR.hy+(Math.max(SR.hy,dv.y)-SR.hy)*e,SR_KZ]}
function srPenRun(s,d,rec){const v=srPenLaunch(s),cross=s.roll?null:srFree(v,SR_KZ),inG=cross&&Math.abs(cross[0])<SR.W-SR.br&&cross[1]<SR.GH-.02;
  const zi=cross?srZone(cross[0],cross[1]):-1,kz=SR_Z[d.z],near=cross&&(zi===d.z||srZd(cross[0],cross[1],kz)-srZd(cross[0],cross[1],SR_Z[zi])<(s.slack||0)+(d.kid?.25:0)),save=!!(inG&&near);
  const tries=save?[[0,0],[0,-.08],[0,.08],[.1,0],[-.1,0]]:[[0,0]];let best=null;
  for(const o of tries){const dv=save?{x:cross[0]+o[0],y:cross[1]+o[1]}:{x:kz.x,y:kz.y},S={p:[0,SR.br,0],v:v.slice()},ev=[],fr=[];let goal=false,t=0,touched=false,hp=srKeeperHand(dv,-1,save);
    for(let i=0;i<5*240;i++){t=i*SR.dt;const np=srKeeperHand(dv,t,save),H={who:"K",p:np,v:SV.mul(SV.sub(np,hp),1/SR.dt),r:.19,max:9};hp=np;
      const e=srStep(S,save?[H]:[],null);e.forEach(x=>{x.t=t;ev.push(x)});if(rec&&i%4===0)fr.push({t,p:S.p.slice(),h:np});if(e.some(x=>x.k==="touch")&&!touched)touched=t;/* once the keeper has stopped it, the penalty is over: a rebound that rolls in later does not count */
      if(e.some(x=>x.k==="goal")&&touched===false){goal=true}if(touched!==false&&t>touched+1.1)break;if(e.some(x=>x.k==="wall"&&x.high)&&!goal){S.dead=1;S.high=1}
      if(S.dead&&(goal||S.high||t>2)){if(S.high){for(let j=0;j<120;j++){const e2=srStep({...S,dead:0,p:S.p,v:S.v},[],null);if(rec&&j%4===0)fr.push({t:t+j*SR.dt,p:S.p.slice(),h:np})}}break}if(!goal&&t>1.2&&SV.len(S.v)<.08)break;if(t>3.2)break}
    best={goal,save,ev,frames:fr,end:t,cross,zone:zi,dv,kind:goal?"goal":s.roll?"short":save?"saved":S.high?"over":"miss"};if(!save||!goal)break}
  return best}
if(typeof module!=="undefined")module.exports={srSwipeHit,srLift,srSlap,srSlapHit,srHandY,srTick,SR,SR_HAND,SR_Z,srOwner,srWallOf,srRng,srStep,srRun,srTrapped,srTouch,srCross,srAI,srZone,srPower,srPenLaunch,srPenRun,srKeeperHand,srFree};
