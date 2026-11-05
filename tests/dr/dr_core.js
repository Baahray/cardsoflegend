/* ================= DRAW IT, RIDE IT: the rules (rides, tracks, physics) =================
   A ride is whatever Cass draws: body lines, wheels (circles), wings, rockets and googly eyes.
   The drawing becomes a real physics vehicle (planck.js): every body line is solid, every wheel spins on a springy axle,
   and a hard enough landing snaps a wheel clean off. Units: metres, y up. */
const DR_U=.02,DR_GW=200,DR_GH=120,DR_TH=.09;
const DR_COL=["#2b2b2b","#e53935","#fb8c00","#fdd835","#43a047","#1e88e5","#8e24aa","#ec407a","#8d5a3b","#ffffff"];
/* ---- rides: strokes <-> a short string (so it fits in the shared record) ---- */
function drEnc(st){return st.map(s=>s.k+s.c+":"+s.p.map(v=>Math.round(v)).join(",")).join("|")}
function drDec(t){if(!t||typeof t!=="string")return[];return t.split("|").map(x=>{const i=x.indexOf(":");if(i<2)return null;const k=x[0],c=+x.slice(1,i)||0,p=x.slice(i+1).split(",").map(Number);
  if(p.some(v=>!isFinite(v)))return null;return{k,c:Math.max(0,Math.min(DR_COL.length-1,c)),p}}).filter(s=>s&&"bgwre".includes(s.k)&&s.p.length>=2&&(s.k!=="w"||s.p.length>=3))}
/* Ramer-Douglas-Peucker on a flat [x,y,x,y...] list */
function drSimp(p,eps){const n=p.length/2|0;if(n<=2)return p.slice(0,n*2);const keep=new Uint8Array(n);keep[0]=keep[n-1]=1;const st=[[0,n-1]];
  while(st.length){const[a,b]=st.pop();let mi=-1,md=0;const ax=p[2*a],ay=p[2*a+1],dx=p[2*b]-ax,dy=p[2*b+1]-ay,L=Math.hypot(dx,dy);
    for(let i=a+1;i<b;i++){const d=L<1e-6?Math.hypot(p[2*i]-ax,p[2*i+1]-ay):Math.abs((p[2*i]-ax)*dy-(p[2*i+1]-ay)*dx)/L;if(d>md){md=d;mi=i}}
    if(md>eps&&mi>0){keep[mi]=1;st.push([a,mi],[mi,b])}}
  const o=[];for(let i=0;i<n;i++)if(keep[i])o.push(p[2*i],p[2*i+1]);return o}
/* a finger-drawn circle -> centre and radius */
function drFitCircle(p){const n=p.length/2|0;if(!n)return null;let sx=0,sy=0;for(let i=0;i<n;i++){sx+=p[2*i];sy+=p[2*i+1]}const cx=sx/n,cy=sy/n;let r=0;for(let i=0;i<n;i++)r+=Math.hypot(p[2*i]-cx,p[2*i+1]-cy);r/=n;
  if(r<4)r=14;return[cx,cy,Math.max(6,Math.min(42,r))]}
/* drawing -> local geometry in metres, centred on the drawing */
function drGeo(st){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const B=(x,y,r=0)=>{x0=Math.min(x0,x-r);y0=Math.min(y0,y-r);x1=Math.max(x1,x+r);y1=Math.max(y1,y+r)};
  for(const s of st){if(s.k==="w")B(s.p[0],s.p[1],s.p[2]);else if(s.k==="e")B(s.p[0],s.p[1],s.p[2]||7);else for(let i=0;i+1<s.p.length;i+=2)B(s.p[i],s.p[i+1])}
  if(x0>x1){x0=y0=0;x1=y1=1}
  const cx=(x0+x1)/2,cy=(y0+y1)/2,X=x=>(x-cx)*DR_U,Y=y=>-(y-cy)*DR_U;
  const G={segs:[],dots:[],wheels:[],rockets:[],eyes:[],lines:[],wingL:0,minY:-(y1-cy)*DR_U,w:(x1-x0)*DR_U,h:(y1-y0)*DR_U};
  let eps=1.2,lines=st.filter(s=>s.k==="b"||s.k==="g");
  for(let tries=0;tries<6;tries++){G.segs=[];G.dots=[];G.lines=[];
    for(const s of lines){const q=drSimp(s.p,eps),pts=[];for(let i=0;i+1<q.length;i+=2)pts.push([X(q[i]),Y(q[i+1])]);
      G.lines.push({k:s.k,c:s.c,pts:s.p.length>=4?(()=>{const a=[];for(let i=0;i+1<s.p.length;i+=2)a.push([X(s.p[i]),Y(s.p[i+1])]);return a})():pts});
      if(pts.length===1||pts.length===2&&Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1])<.04){G.dots.push({x:pts[0][0],y:pts[0][1],k:s.k,c:s.c});continue}
      for(let i=0;i+1<pts.length;i++)G.segs.push({x0:pts[i][0],y0:pts[i][1],x1:pts[i+1][0],y1:pts[i+1][1],k:s.k,c:s.c})}
    if(G.segs.length<=150)break;eps*=1.7}
  G.wingL=G.segs.filter(s=>s.k==="g").reduce((a,s)=>a+Math.hypot(s.x1-s.x0,s.y1-s.y0),0);
  for(const s of st){if(s.k==="w"&&G.wheels.length<6)G.wheels.push({x:X(s.p[0]),y:Y(s.p[1]),r:Math.max(.1,s.p[2]*DR_U),c:s.c});
    if(s.k==="r"&&G.rockets.length<4)G.rockets.push({x:X(s.p[0]),y:Y(s.p[1])});if(s.k==="e"&&G.eyes.length<10)G.eyes.push({x:X(s.p[0]),y:Y(s.p[1]),r:(s.p[2]||7)*DR_U})}
  /* every wheel sits on the same ground line, just under the lowest part of the body, so they all touch the ground */
  if(G.wheels.length){let bodyLo=1e9;for(const sg of G.segs)bodyLo=Math.min(bodyLo,sg.y0-DR_TH/2,sg.y1-DR_TH/2);for(const d of G.dots)bodyLo=Math.min(bodyLo,d.y-DR_TH/2);for(const r of G.rockets)bodyLo=Math.min(bodyLo,r.y-.09);
    let gl=Math.min(...G.wheels.map(w=>w.y-w.r));if(bodyLo<1e8)gl=Math.min(gl,bodyLo-.04);for(const w of G.wheels){w.dy=w.y-(gl+w.r);w.y=gl+w.r}G.minY=Math.min(G.minY,gl)}
  /* a little strut from a far-away wheel to the nearest bit of body, so it looks attached */
  for(const w of G.wheels){let bd=1e9,bp=null;for(const s of G.segs){const dx=s.x1-s.x0,dy=s.y1-s.y0,L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((w.x-s.x0)*dx+(w.y-s.y0)*dy)/L2)),px=s.x0+dx*t,py=s.y0+dy*t,d=Math.hypot(w.x-px,w.y-py);if(d<bd){bd=d;bp=[px,py]}}
    w.strut=bp&&bd>w.r*.9?bp:null}
  return G}
/* ---- building the vehicle in a physics world ---- */
function drCar(W,G,x,y,o){const pl=planck,grp=-(o.grp||1),cass=!!o.cass;
  const ch=W.createBody({type:"dynamic",position:pl.Vec2(x,y),angularDamping:.4,allowSleep:false,bullet:true});let n=0;
  const fx=(sh,d,f=.7)=>{ch.createFixture({shape:sh,density:d,friction:f,restitution:.08,filterGroupIndex:grp});n++};
  for(const s of G.segs){const dx=s.x1-s.x0,dy=s.y1-s.y0,L=Math.hypot(dx,dy);if(L<.004)continue;fx(pl.Box(L/2+DR_TH/2,DR_TH/2,pl.Vec2((s.x0+s.x1)/2,(s.y0+s.y1)/2),Math.atan2(dy,dx)),s.k==="g"?.3:1)}
  for(const d of G.dots)fx(pl.Circle(pl.Vec2(d.x,d.y),DR_TH*.7),1);
  for(const r of G.rockets)fx(pl.Box(.17,.075,pl.Vec2(r.x,r.y),0),.8,.5);
  if(!n){const w=G.wheels;if(w.length>=2){const a=w[0],b=w[w.length-1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||.3;fx(pl.Box(L/2,.05,pl.Vec2((a.x+b.x)/2,(a.y+b.y)/2),Math.atan2(dy,dx)),1.5)}else fx(pl.Box(.3,.06),1.5)}
  if(ch.getMass()<.3){/* a tiny scribble still needs some weight to drive */ch.setMassData({mass:.3,center:ch.getLocalCenter(),I:Math.max(ch.getInertia(),.02)})}
  const car={ch,wheels:[],G,cass,grp,help:o.help||0,fuel:0,fuel0:0,brk:0,M:0,air:0,snaps:0};
  for(const w of G.wheels){const b=W.createBody({type:"dynamic",position:pl.Vec2(x+w.x,y+w.y),angularDamping:.15,allowSleep:false,bullet:true});
    b.createFixture({shape:pl.Circle(w.r),density:1.1,friction:cass?2:1.6,restitution:.12,filterGroupIndex:grp});
    const j=W.createJoint(pl.WheelJoint({enableMotor:true,maxMotorTorque:0,motorSpeed:0,frequencyHz:4.8,dampingRatio:.75},ch,b,b.getPosition(),pl.Vec2(0,1)));
    car.wheels.push({b,j,r:w.r,lx:w.x,ly:w.y,broken:0})}
  car.M=ch.getMass()+car.wheels.reduce((a,w)=>a+w.b.getMass(),0);
  {const c=ch.getWorldCenter();car.Ie=ch.getInertia()+car.wheels.reduce((a,w)=>{const q=w.b.getPosition();return a+w.b.getMass()*((q.x-c.x)**2+(q.y-c.y)**2)+w.b.getInertia()},0)}/* how hard the whole ride is to turn */
  const nw=Math.max(1,car.wheels.length);for(const w of car.wheels)w.tq=car.M*9.8*w.r*(cass?1.75:1.5)/Math.max(1,nw*.7);
  car.brk=cass?19:15;car.fuel=car.fuel0=G.rockets.length?(cass?3.2:2.3):0;return car}
function drCarKill(W,car){if(!car)return;for(const w of car.wheels){if(!w.broken)try{W.destroyJoint(w.j)}catch(e){}W.destroyBody(w.b)}W.destroyBody(car.ch)}
const drTouching=b=>{for(let e=b.getContactList();e;e=e.next)if(e.contact.isTouching())return true;return false};
/* one physics tick of driving. inp: {go,back,rk}. returns events (snaps, boosts...) */
function drDrive(car,inp,dt){const pl=planck,ch=car.ch,vmax=car.cass?14.5:13,ev=[];let gr=0;
  for(const w of car.wheels)if(!w.broken&&drTouching(w.b))gr=1;
  const airK=gr?1:.12;/* spinning wheels in the air would twist the whole ride, so the motor goes soft off the ground */
  for(const w of car.wheels){if(w.broken)continue;
    if(inp.go){w.j.setMaxMotorTorque(w.tq*airK);w.j.setMotorSpeed(-vmax/w.r)}else if(inp.back){w.j.setMaxMotorTorque(w.tq*airK);w.j.setMotorSpeed(vmax*.45/w.r)}else{w.j.setMaxMotorTorque(w.tq*.06);w.j.setMotorSpeed(0)}}
  if(!gr&&drTouching(ch))gr=2;car.air=gr?0:car.air+dt;car.gr=gr;
  const I=car.Ie||ch.getInertia(),av=ch.getAngularVelocity(),dir=inp.go&&!inp.back?-1:inp.back&&!inp.go?1:0;
  const an=Math.atan2(Math.sin(ch.getAngle()),Math.cos(ch.getAngle()));car.an=an;
  /* in the air: GO tips the nose down a bit, BACK tips it up a bit, nothing levels it out. It never spins right round. */
  if(!gr&&car.air>.08){const tg=dir<0?-.2:dir>0?.6:0,k=dir?7:(car.cass?5:4);ch.applyTorque(I*(k*(tg-an)-av*2.4))}
  else if(dir&&gr===1){if(Math.abs(av)<2||Math.sign(av)!==dir)ch.applyTorque(dir*I*1.6)}
  /* the wheels push back on the body when they drive; cancel most of that so rides don't flip over in wheelies */
  {let mt=0;for(const w of car.wheels)if(!w.broken)mt+=w.j.getMotorTorque(1/dt);ch.applyTorque(mt*(gr?(car.cass?.9:.8):1))}
  if(gr&&inp.go&&an>.55)ch.applyTorque(-I*(an-.55)*(car.cass?26:20));

  /* no wheels touching (none drawn, or they snapped off): it scoots along on its belly */
  if(gr===2&&inp.go){const d=ch.getWorldVector(pl.Vec2(1,0));ch.applyForceToCenter(pl.Vec2(Math.max(.3,d.x)*car.M*9.8*.75,0))}
  const v=ch.getLinearVelocity();
  /* wings: in the air they hold you up, so you float much further and land softly. Bigger wings (and more speed) = more float */
  car.glide=0;if(car.G.wingL>0&&!gr&&car.air>.12){const wk=Math.min(1,car.G.wingL/1.6)*(car.cass?1.15:1),sp=Math.min(1,Math.abs(v.x)/8);
    let up=car.M*9.8*.78*wk*sp;if(v.y<-1.5)up+=car.M*Math.min(9.8*.9,(-v.y-1.5)*4*wk);if(v.y>2)up*=.3;
    ch.applyForceToCenter(pl.Vec2(car.M*1.2*wk*sp,up));car.glide=up>car.M*2?1:0}
  /* helping wind: after a few tries at the same jump, a magic breeze carries you further */
  if(car.help&&inp.go){if(!gr)ch.applyForceToCenter(pl.Vec2(car.M*9.8*.22*car.help,v.y<0?car.M*9.8*.18*car.help:0));else if(Math.abs(v.x)<vmax)ch.applyForceToCenter(pl.Vec2(car.M*9.8*.25*car.help,0))}
  car.burn=0;if(inp.rk&&car.fuel>0&&car.G.rockets.length){car.fuel=Math.max(0,car.fuel-dt);const f=car.M*9.8*Math.min(1.8,.7+.35*car.G.rockets.length),d=ch.getWorldVector(pl.Vec2(1,0));ch.applyForceToCenter(pl.Vec2(d.x*f,d.y*f));car.burn=1}
  return ev}
/* after the world steps: a hard knock snaps a wheel off */
function drSnapCheck(W,car,dt){const ev=[];if(car.safe>0){car.safe-=dt;for(const w of car.wheels)w.pv=null;return ev}for(const w of car.wheels){if(w.broken)continue;const v=w.b.getLinearVelocity(),p=w.pv;w.pv={x:v.x,y:v.y};if(!p)continue;
  const dv=Math.hypot(v.x-p.x,v.y-p.y);car.mdv=Math.max(car.mdv||0,dv);if(dv>car.brk){W.destroyJoint(w.j);w.broken=1;car.snaps++;const q=w.b.getPosition();w.b.setAngularVelocity(w.b.getAngularVelocity()*.5);ev.push({k:"snap",x:q.x,y:q.y})}}return ev}

/* ---- tracks ---- */
/* pre-made tracks are a list of pieces laid end to end */
function drRand(s){let a=s>>>0||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function drMake(ops,seed=7){const r=drRand(seed),T={chains:[],boosts:[],mush:[],lava:[],planks:[],cps:[],deco:[],gaps:[],seesaws:[],crates:[],barrels:[],gems:[],loops:[],cannons:[],winds:[],dominoes:[]};let x=-8,y=0,cur=[[x,y]];
  const pt=(a,b)=>{x=a;y=b;cur.push([+a.toFixed(3),+b.toFixed(3)])},end=cliff=>{if(cur&&cur.length>1){if(cliff){cur.push([x-.02,y-7]);cur.c1=1}T.chains.push(cur)}cur=null},start=cliff=>{cur=cliff?[[x+.02,y-7],[x,y]]:[[x,y]];if(cliff)cur.c0=1;T.cps.push(x+.8)};
  T.cps.push(0);
  for(const o of ops){const[k,a=0,b=0,c]=o,x0=x,y0=y;
    if(k==="flat")pt(x+a,y);
    else if(k==="hill"){const n=Math.max(4,Math.ceil(a/.8));for(let i=1;i<=n;i++){const t=i/n;pt(x0+a*t,y0+b*(1-Math.cos(2*Math.PI*t))/2)}}
    else if(k==="slope"){const n=Math.max(4,Math.ceil(a/.8));for(let i=1;i<=n;i++){const t=i/n;pt(x0+a*t,y0+b*(1-Math.cos(Math.PI*t))/2)}}
    else if(k==="ramp"){const n=Math.max(4,Math.ceil(a/.6));for(let i=1;i<=n;i++){const t=i/n;pt(x0+a*t,y0+b*Math.pow(t,1.7))}}
    else if(k==="gap"){end(1);x+=a;y+=b;T.gaps.push({x0,x1:x,y:Math.min(y0,y),kind:c||"pit"});if(c==="lava")T.lava.push({x0:x0-.2,x1:x+.2,y:Math.min(y0,y)-2.2});start(1)}
    else if(k==="steps"){for(let i=0;i<a;i++){pt(x+.06,y+c);pt(x+b,y)}}
    else if(k==="bumps"){const n=Math.ceil(a/.7);for(let i=1;i<=n;i++)pt(x0+a*i/n,y0+(i<n?(r()-.3)*b:0))}
    else if(k==="bridge"){end();const n=Math.round(a/.85),w=a/n;for(let i=0;i<n;i++)T.planks.push({x:x0+w*(i+.5),y:y0-.12,w:w-.06});x+=a;T.gaps.push({x0,x1:x,y:y0,kind:"bridge"});start()}
    else if(k==="boost"){T.boosts.push({x0:x,x1:x+a,y});pt(x+a,y)}
    else if(k==="mush"){T.mush.push({x:x+1.6,y});pt(x+3.2,y)}
    else if(k==="cp")T.cps.push(x);
    else if(k==="deco")T.deco.push({k:a,x:x+(b||0),y})
    else if(k==="dip"){const n=Math.max(6,Math.ceil(a/.8));for(let i=1;i<=n;i++){const t=i/n;pt(x0+a*t,y0-b*(1-Math.cos(2*Math.PI*t))/2)}T.gems.push({x:x0+a/2,y:y0-b+1.1},{x:x0+a/2-1.6,y:y0-b+1.3},{x:x0+a/2+1.6,y:y0-b+1.3})}
    else if(k==="seesaw"){T.seesaws.push({x:x+1.5+a/2,y:y+.62,w:a});pt(x+a+3,y)}
    else if(k==="crates"){let n=a,row=0,cx=x+3;while(n>0){const m=Math.max(1,a-row);for(let i=0;i<m&&n>0;i++,n--)T.crates.push({x:cx+row*.36+i*.74,y:y+.37+row*.74});row++;if(row>3)break}pt(x+a*.75+6,y)}
    else if(k==="barrels"){for(let i=0;i<a;i++)T.barrels.push({x:x+3+i*1.3,y:y+.48});pt(x+a*1.3+5,y)}
    else if(k==="gems"){for(let i=0;i<a;i++)T.gems.push({x:x+1+i*1.6,y:y+1.15+Math.sin(i/(a-1||1)*Math.PI)*.6});pt(x+a*1.6+1,y)}
    else if(k==="loop"){const R=a||5,bx=x+3;T.loops.push({cx:bx,cy:y+R,r:R,ph:0});for(let i=0;i<7;i++){const q=-Math.PI/2+.5+i*.85;T.gems.push({x:bx+Math.cos(q)*(R-1.3),y:y+R+Math.sin(q)*(R-1.3)})}pt(bx+R+7,y)}
    else if(k==="cannon"){const an=a||.7,v=b||15;T.cannons.push({x:x+3,y,a:an,v});for(let i=1;i<=8;i++){const t=i*.24;T.gems.push({x:x+3+v*Math.cos(an)*t,y:y+1.2+v*Math.sin(an)*t-4.9*t*t})}pt(x+5,y)}
    else if(k==="windgap"){end(1);x+=a;y+=b;T.gaps.push({x0,x1:x,y:Math.min(y0,y),kind:"wind"});T.winds.push({x0:x0+.3,x1:x-.3,y:Math.min(y0,y)});for(let i=1;i<=4;i++)T.gems.push({x:x0+(x-x0)*i/5,y:Math.max(y0,y)+3.2+Math.sin(i)*.6});start(1)}
    else if(k==="dominoes"){for(let i=0;i<a;i++)T.dominoes.push({x:x+3+i*.95,y:y+.82});pt(x+3+a*.95+4,y)}
    if(k==="gap"&&c!=="nogem"){/* gems in an arc over every jump */const top=Math.max(y0,y)+2.6;for(let i=1;i<=5;i++){const t=i/6;T.gems.push({x:x0+(x-x0)*t,y:y0+(y-y0)*t+(top-Math.max(y0,y))*4*t*(1-t)+.8})}}}
  pt(x+14,y);end();T.fin=x-8;T.len=T.fin;return T}
const DR_TRACKS=[
  {nm:"GREEN HILLS",th:0,ops:[["flat",10],["gems",5],["deco","tree",-4],["hill",14,1.2],["flat",4],["hill",16,2.2],["deco","tree",-6],["crates",3],["slope",10,1.5],["bumps",10,.3],["deco","house",-3],["hill",18,2.5],["deco","castle",-9],["slope",12,-1.5],["ramp",7,1.2],["gap",5,-.6],["flat",6],["seesaw",8],["flat",4],["dip",16,2.5],["gems",6],["deco","tree",-3],["hill",14,1.6],["barrels",3],["bumps",12,.35],["slope",10,2],["hill",16,2.4],["deco","tree",-8],["slope",14,-2.4],["boost",5],["ramp",7,1.4],["gap",7,-1],["flat",5],["crates",6],["dip",18,3],["deco","house",-2],["hill",12,1.4],["seesaw",8],["flat",4],["boost",5],["ramp",7,1.5],["gap",8,-1],["gems",6],["flat",4],["dominoes",8],["hill",14,1.8],["flat",6],["boost",6],["flat",4],["loop",5],["gems",5],["deco","tree",-2],["hill",16,2],["cannon",.7,15],["flat",2],["gap",16,-1,"nogem"],["flat",10],["deco","house",-4],["dip",16,3],["crates",5],["hill",12,1.5],["windgap",10,0],["flat",6],["seesaw",8],["bumps",12,.35],["deco","tree",-3],["boost",5],["ramp",7,1.4],["gap",8,-1],["flat",8],["dominoes",10],["hill",14,2],["deco","castle",-6],["slope",12,-2],["flat",6],["boost",6],["flat",4],["loop",5.5],["gems",6],["flat",6]]},
  {nm:"CASTLE BRIDGES",th:1,ops:[["flat",10],["gems",4],["slope",10,2],["deco","castle",-5],["flat",4],["bridge",12],["flat",6],["deco","flag",-3],["steps",3,2.6,-.6],["crates",4],["bridge",15],["flat",3],["slope",10,2.5],["deco","castle",-4],["flat",3],["ramp",6,1],["gap",5,-1.2],["flat",6],["bridge",10],["flat",4],["seesaw",9],["deco","flag",-2],["hill",12,1.6],["bridge",14],["flat",4],["barrels",4],["slope",8,-1.5],["deco","castle",-3],["bridge",9],["dip",14,2.2],["crates",6],["slope",10,2],["deco","castle",-4],["boost",5],["ramp",7,1.4],["gap",8,-1.5],["flat",5],["bridge",16],["gems",5],["flat",4],["flat",4],["deco","castle",-2],["dominoes",10],["bridge",12],["flat",4],["flat",6],["boost",6],["flat",4],["loop",5],["flat",4],["bridge",14],["cannon",.72,15],["flat",2],["gap",17,-1,"nogem"],["flat",8],["deco","flag",-3],["crates",6],["dip",16,2.6],["bridge",12],["windgap",10,.5],["flat",6],["deco","castle",-3],["seesaw",9],["barrels",4],["slope",10,2],["bridge",16],["flat",6],["boost",6],["flat",4],["loop",5.5],["gems",5],["flat",6]]},
  {nm:"RAINBOW RAMPS",th:2,ops:[["flat",8],["gems",4],["boost",6],["ramp",8,2.2],["gap",8,-1.5],["flat",8],["hill",12,1.5],["boost",6],["ramp",8,2.6],["gap",9,-1.8],["flat",6],["deco","rainbow",-2],["bumps",8,.35],["crates",3],["boost",6],["ramp",7,2],["gap",7,0],["flat",4],["dip",16,3],["slope",12,-2],["boost",8],["ramp",9,3],["gap",12,-2.5],["flat",8],["deco","rainbow",-4],["seesaw",8],["hill",10,1.2],["boost",6],["ramp",7,1.8],["gap",8,-1],["flat",6],["dip",18,3.5],["gems",5],["boost",8],["ramp",10,3.4],["gap",15,-3],["flat",6],["barrels",4],["boost",6],["ramp",8,2],["gap",9,-1],["flat",8],["flat",6],["boost",6],["flat",4],["loop",5],["deco","rainbow",-2],["boost",6],["ramp",8,2.4],["gap",11,-1.5],["flat",6],["cannon",.75,16],["flat",2],["gap",19,-1,"nogem"],["flat",8],["dominoes",10],["dip",18,3.5],["windgap",12,0],["flat",6],["boost",6],["ramp",9,3],["gap",13,-2],["flat",6],["deco","rainbow",-3],["crates",5],["flat",6],["boost",6],["flat",4],["loop",6],["gems",6],["boost",8],["ramp",10,3.4],["gap",15,-3],["flat",10]]},
  {nm:"MUSHROOM FOREST",th:3,ops:[["flat",10],["deco","shroom",-4],["mush"],["gap",7,1.5],["flat",6],["hill",10,1.2],["deco","shroom",-2],["mush"],["gap",8,2],["flat",5],["deco","shroom",-3],["gems",4],["slope",10,-2.5],["bumps",8,.3],["mush"],["gap",8,1.2],["flat",6],["deco","shroom",-1],["crates",4],["mush"],["gap",6,-1],["flat",8],["hill",10,1.4],["deco","shroom",-5],["mush"],["gap",7,1.6],["flat",5],["slope",12,-3],["seesaw",8],["bumps",10,.35],["deco","shroom",-3],["mush"],["mush"],["gap",9,2.4],["flat",5],["dip",14,2.5],["deco","shroom",-2],["mush"],["gap",8,0],["flat",4],["gems",5],["flat",6],["hill",12,1.6],["mush"],["gap",8,1.8],["flat",5],["crates",5],["slope",12,-2.5],["barrels",3],["deco","shroom",-3],["mush"],["gap",7,0],["flat",4],["dip",14,2.5],["boost",5],["ramp",6,1.2],["gap",6,0],["flat",8],["deco","shroom",-3],["dominoes",8],["mush"],["gap",8,1.6],["flat",5],["flat",6],["boost",6],["flat",4],["loop",5],["deco","shroom",-2],["cannon",.75,15],["flat",2],["gap",17,0,"nogem"],["flat",8],["windgap",10,1],["flat",5],["mush"],["mush"],["gap",9,2.2],["flat",5],["crates",5],["slope",14,-3],["deco","shroom",-4],["seesaw",8],["mush"],["gap",8,1.2],["flat",6],["gems",5],["flat",6]]},
  {nm:"GIANT'S STAIRCASE",th:4,ops:[["flat",10],["steps",4,3.4,.3],["flat",3],["deco","boot",-2],["steps",4,3.4,.3],["crates",3],["flat",4],["deco","castle",-2],["steps",5,2.4,-.6],["flat",5],["hill",12,1.8],["steps",3,4,.3],["flat",3],["ramp",6,.8],["gap",5,-2],["flat",6],["deco","boot",-3],["steps",4,3,.28],["flat",3],["steps",4,3,-.5],["barrels",3],["flat",3],["seesaw",9],["flat",5],["steps",5,3,.27],["deco","boot",-2],["gems",4],["dip",12,2],["steps",6,2.6,-.45],["flat",4],["boost",5],["ramp",7,1.4],["gap",8,-1.5],["flat",6],["steps",4,3.2,.28],["crates",5],["flat",6],["dip",14,2.4],["hill",12,2],["deco","boot",-2],["flat",3],["seesaw",8],["slope",12,-2.5],["gems",4],["flat",8],["dominoes",8],["steps",4,3,.28],["flat",3],["flat",6],["boost",6],["flat",4],["loop",5],["deco","boot",-2],["cannon",.75,15],["flat",2],["gap",16,1,"nogem"],["flat",8],["steps",5,2.8,-.5],["windgap",10,1],["flat",6],["deco","castle",-3],["crates",6],["steps",4,3,.28],["flat",4],["flat",6],["boost",6],["flat",4],["loop",5],["gems",5],["flat",6]]},
  {nm:"CRUMBLY CLIFFS",th:5,ops:[["flat",10],["slope",14,-3],["bridge",10],["flat",4],["deco","rock",-2],["steps",4,3,-.8],["flat",4],["ramp",5,.8],["gap",6,-2],["flat",5],["bridge",14],["slope",12,-2.5],["bumps",10,.4],["deco","rock",-4],["barrels",4],["slope",10,2],["bridge",10],["flat",4],["slope",10,-2],["bridge",12],["flat",3],["ramp",5,1],["gap",6,-1.5],["flat",5],["dip",16,3],["crates",5],["deco","rock",-3],["slope",14,-3],["bridge",18],["flat",4],["seesaw",8],["boost",5],["ramp",7,1.6],["gap",9,-2],["gems",5],["flat",6],["deco","rock",-2],["dominoes",9],["slope",12,-2.5],["flat",6],["boost",6],["flat",4],["loop",5],["bridge",12],["cannon",.72,15],["flat",2],["gap",17,-2,"nogem"],["flat",6],["deco","rock",-3],["windgap",11,-1],["flat",5],["bridge",14],["dip",16,3],["crates",5],["slope",14,-3],["bridge",16],["barrels",4],["flat",6],["boost",6],["flat",4],["loop",5.5],["gems",5],["flat",6]]},
  {nm:"LAVA JUMP",th:6,ops:[["flat",10],["boost",5],["ramp",6,1.4],["gap",6,0,"lava"],["flat",8],["hill",12,1.6],["boost",5],["ramp",7,1.8],["gap",8,-.5,"lava"],["flat",6],["crates",4],["slope",10,2],["deco","volcano",-6],["flat",3],["ramp",5,1],["gap",7,-2,"lava"],["flat",5],["boost",6],["ramp",7,1.6],["gap",9,0,"lava"],["flat",8],["bumps",8,.3],["barrels",3],["boost",5],["ramp",6,1.5],["gap",7,-1,"lava"],["flat",6],["dip",14,2.4],["deco","volcano",-4],["seesaw",8],["boost",6],["ramp",8,2.2],["gap",11,-1.5,"lava"],["flat",6],["gems",4],["boost",5],["ramp",6,1.5],["gap",8,0,"lava"],["flat",8],["hill",10,1.4],["crates",5],["boost",5],["ramp",7,1.8],["gap",9,-1,"lava"],["flat",5],["dip",12,2],["deco","volcano",-3],["boost",5],["ramp",6,1.4],["gap",7,0,"lava"],["gems",4],["flat",8],["deco","volcano",-4],["flat",6],["boost",6],["flat",4],["loop",5],["cannon",.72,16],["flat",2],["gap",19,-1,"nogem"],["flat",8],["dominoes",10],["windgap",11,0],["flat",6],["boost",5],["ramp",7,1.8],["gap",10,-1,"lava"],["flat",6],["crates",5],["dip",14,2.5],["deco","volcano",-3],["flat",6],["boost",6],["flat",4],["loop",5.5],["boost",6],["ramp",8,2.2],["gap",12,0,"lava"],["gems",5],["flat",6]]},
  {nm:"SKY ISLANDS",th:7,ops:[["flat",10],["boost",5],["ramp",6,1.4],["gap",7,-1,"sky"],["flat",7],["hill",8,1],["ramp",5,1.2],["gap",7,-1.5,"sky"],["flat",6],["boost",5],["ramp",6,1.8],["gap",9,-2,"sky"],["flat",6],["mush"],["gap",6,2.5,"sky"],["flat",7],["crates",3],["boost",6],["ramp",6,1.5],["gap",8,-1,"sky"],["flat",6],["hill",8,1.2],["boost",5],["ramp",6,1.4],["gap",7,-1,"sky"],["flat",6],["seesaw",8],["boost",6],["ramp",7,2],["gap",11,-2,"sky"],["flat",5],["mush"],["gap",7,3,"sky"],["flat",6],["gems",4],["boost",8],["ramp",9,2.6],["gap",14,-3,"sky"],["flat",8],["hill",8,1],["barrels",3],["boost",6],["ramp",7,1.8],["gap",10,-1.5,"sky"],["flat",5],["mush"],["gap",6,2,"sky"],["flat",6],["boost",6],["ramp",7,1.6],["gap",9,-1,"sky"],["flat",8],["flat",6],["boost",6],["flat",4],["loop",5],["flat",4],["cannon",.75,16],["flat",2],["gap",20,-2,"nogem"],["flat",7],["windgap",12,0],["flat",6],["dominoes",8],["boost",6],["ramp",7,1.8],["gap",10,-1.5,"sky"],["flat",6],["windgap",11,1],["flat",6],["mush"],["gap",7,2.5,"sky"],["flat",6],["crates",4],["flat",6],["boost",6],["flat",4],["loop",5.5],["gems",5],["boost",8],["ramp",9,2.6],["gap",14,-3,"sky"],["flat",10]]}];
/* medal times (seconds) — set from a test car holding GO the whole way */
const DR_MEDAL=[80,64,73,87,96,72,61,92];
/* tracks drawn by a player: ground lines + boost pads + bouncy mushrooms, as a string */
function drTEnc(t){const L=t.lines.map(l=>"L"+l.map(p=>Math.round(p[0]*10)+","+Math.round(p[1]*10)).join(",")),B=t.boosts.map(b=>"B"+Math.round(b.x*10)+","+Math.round(b.y*10)),M=t.mush.map(m=>"M"+Math.round(m.x*10)+","+Math.round(m.y*10)),G=(t.gems||[]).map(m=>"G"+Math.round(m.x*10)+","+Math.round(m.y*10)),C=(t.crates||[]).map(m=>"C"+Math.round(m.x*10)+","+Math.round(m.y*10));return[...L,...B,...M,...G,...C].join(";")}
function drTDec(s){const t={lines:[],boosts:[],mush:[],gems:[],crates:[]};if(!s||typeof s!=="string")return t;for(const part of s.split(";")){const k=part[0],v=part.slice(1).split(",").map(n=>+n/10);if(v.some(n=>!isFinite(n)))continue;
    if(k==="L"&&v.length>=4){const l=[];for(let i=0;i+1<v.length;i+=2)l.push([v[i],v[i+1]]);t.lines.push(l)}else if(k==="B"&&v.length>=2)t.boosts.push({x:v[0],y:v[1]});else if(k==="M"&&v.length>=2)t.mush.push({x:v[0],y:v[1]});else if(k==="G"&&v.length>=2)t.gems.push({x:v[0],y:v[1]});else if(k==="C"&&v.length>=2)t.crates.push({x:v[0],y:v[1]})}return t}
/* a drawn track -> the same shape as a pre-made one. There's always a start pad; the finish is the far end of the furthest line. */
const DR_PAD=[[-8,0],[6,0]];
function drFromDrawn(t){const T={chains:[],boosts:[],mush:[],lava:[],planks:[],cps:[0],deco:[],gaps:[],drawn:1,seesaws:[],crates:[],barrels:[],gems:[]};T.chains.push(DR_PAD.map(p=>p.slice()));
  for(const l of t.lines)if(l.length>=2)T.chains.push(l.map(p=>p.slice()));
  for(const l of t.lines)if(l.length>=2){const a=l[0][0]<l[l.length-1][0]?l[0]:l[l.length-1];if(a[0]>6)T.cps.push(a[0]+.6)}
  T.cps.sort((a,b)=>a-b);let fx=6;for(const c of T.chains)for(const p of c)fx=Math.max(fx,p[0]);T.fin=Math.max(10,fx-1.5);T.len=T.fin;
  for(const b of t.boosts)T.boosts.push({x0:b.x-1.6,x1:b.x+1.6,y:b.y});for(const m of t.mush)T.mush.push({x:m.x,y:m.y});for(const g of t.gems||[])T.gems.push({x:g.x,y:g.y});for(const c of t.crates||[])for(let i=0;i<3;i++)T.crates.push({x:c.x+(i===2?.36:i*.74),y:c.y+.37+(i===2?.74:0)});return T}
/* the height of the ground under x (the highest line there), or null over a gap */
function drGroundAt(T,x,below=1e9){let best=null;for(const c of T.chains)for(let i=0;i+1<c.length;i++){const a=c[i],b=c[i+1],lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);if(x<lo||x>hi||hi-lo<1e-6)continue;
    const y=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);if(y<=below&&(best==null||y>best))best=y}
  for(const p of T.planks)if(Math.abs(x-p.x)<=p.w/2&&!p.gone&&p.y+.12<=below&&(best==null||p.y+.12>best))best=p.y+.12;return best}
/* after a respawn, crumbled bridges ahead of you are put back */
function drPlanksReset(W,T,x){const pl=planck;for(const p of T.planks){if(p.x<x-1)continue;if(p.gone||!p.b){const b=W.createBody({type:"static",position:pl.Vec2(p.x,p.y)});b.createFixture({shape:pl.Box(p.w/2,.12),density:2,friction:.9});b.drPlank=1;p.b=b}
  else{p.b.setStatic();p.b.setPosition(pl.Vec2(p.x,p.y));p.b.setAngle(0);p.b.setLinearVelocity(pl.Vec2(0,0));p.b.setAngularVelocity(0)}p.t=0;p.gone=0}}
function drLowest(T){let m=1e9;for(const c of T.chains)for(const p of c)m=Math.min(m,p[1]);return m}
function drWorld(T){const pl=planck,W=pl.World({gravity:pl.Vec2(0,-9.8)});
  for(const c of T.chains){const pts=[];for(const p of c){const l=pts[pts.length-1];if(!l||Math.hypot(p[0]-l.x,p[1]-l.y)>.05)pts.push(pl.Vec2(p[0],p[1]))}if(pts.length<2)continue;
    const b=W.createBody({type:"static"});b.createFixture({shape:pl.Chain(pts,false),friction:.9,restitution:.05})}
  for(const p of T.planks){const b=W.createBody({type:"static",position:pl.Vec2(p.x,p.y)});b.createFixture({shape:pl.Box(p.w/2,.12),density:2,friction:.9});b.drPlank=1;p.b=b;p.t=0;p.gone=0}
  const ground=W.createBody({type:"static"});
  for(const q of T.seesaws||[]){const b=W.createBody({type:"dynamic",position:pl.Vec2(q.x,q.y),angle:.3,angularDamping:.8});b.createFixture({shape:pl.Box(q.w/2,.11),density:.8,friction:1});
    W.createJoint(pl.RevoluteJoint({enableLimit:true,lowerAngle:-.3,upperAngle:.3},ground,b,pl.Vec2(q.x,q.y)));q.b=b}
  for(const q of T.crates||[]){const b=W.createBody({type:"dynamic",position:pl.Vec2(q.x,q.y)});b.createFixture({shape:pl.Box(.35,.35),density:.18,friction:.6,restitution:.1});q.b=b}
  for(const q of T.barrels||[]){const b=W.createBody({type:"dynamic",position:pl.Vec2(q.x,q.y),angularDamping:.1});b.createFixture({shape:pl.Circle(.45),density:.25,friction:.5,restitution:.2});q.b=b}
  for(const g of T.gems||[])g.got=0;
  for(const q of T.dominoes||[]){const b=W.createBody({type:"dynamic",position:pl.Vec2(q.x,q.y)});b.createFixture({shape:pl.Box(.11,.8),density:.3,friction:.5});q.b=b}
  /* loop-the-loops: three arcs. Going in, the back arc is switched off; after the top, the front arc is switched off so you can drive out */
  const arc=(L,a0,a1,k)=>{const pts=[];for(let q=a0;q<=a1+1e-6;q+=Math.PI/24)pts.push(pl.Vec2(L.cx+Math.cos(q)*L.r,L.cy+Math.sin(q)*L.r));const b=W.createBody({type:"static"});const f=b.createFixture({shape:pl.Chain(pts,false),friction:.95});f.drLoop={L,k}};
  for(const L of T.loops||[]){L.ph=0;arc(L,-Math.PI/2,0,"in");arc(L,0,Math.PI,"mid");arc(L,Math.PI,Math.PI*1.5,"out")}
  if((T.loops||[]).length)W.on("pre-solve",c=>{const a=c.getFixtureA().drLoop||c.getFixtureB().drLoop;if(a&&(a.k==="out"&&a.L.ph===0||a.k==="in"&&a.L.ph===1))c.setEnabled(false)});
  return W}
/* bridges crumble a moment after a wheel touches them */
function drPlanks(W,T,now){for(const p of T.planks){if(p.gone)continue;if(!p.t){for(let e=p.b.getContactList();e;e=e.next)if(e.contact.isTouching()&&e.other.isDynamic()){p.t=now;break}}
  else if(now-p.t>.4&&!p.b.isDynamic()){p.b.setDynamic();p.b.setAngularVelocity((Math.random()-.5)*2)}
  if(p.b.isDynamic()&&p.b.getPosition().y<p.y-25){W.destroyBody(p.b);p.gone=1}}}
/* boost pads, bouncy mushrooms, falling off or into lava. Returns "boost" / "boing" / "fall" or "" */
function drZones(T,car,dt,now){const pl=planck,ch=car.ch,p=ch.getPosition(),v=ch.getLinearVelocity();let ev="";
  for(const b of T.boosts)if(p.x>b.x0-.5&&p.x<b.x1+.5&&p.y<b.y+2.6&&p.y>b.y-1&&v.x<19){ch.applyForceToCenter(pl.Vec2(car.M*28,0));for(const w of car.wheels)if(!w.broken)w.b.applyForceToCenter(pl.Vec2(w.b.getMass()*28,0));if(!car.bst||now-car.bst>.8)ev="boost";car.bst=now}
  for(const m of T.mush)if(Math.abs(p.x-m.x)<1.7&&p.y<m.y+2.8&&p.y>m.y-.5&&(!car.bng||now-car.bng>.5)){car.bng=now;const up=car.cass?13.5:12.5,all=[ch,...car.wheels.filter(w=>!w.broken).map(w=>w.b)];
    for(const b of all){const u=b.getLinearVelocity();b.setLinearVelocity(pl.Vec2(Math.max(u.x,7),up))}for(const w of car.wheels)w.pv=null;ev="boing"}
  const bodies=[ch,...car.wheels.filter(w=>!w.broken).map(w=>w.b)],push=(fx,fy)=>{for(const b of bodies){const m=b.getMass();b.applyForceToCenter(pl.Vec2(fx*m,fy*m))}};
  for(const L of T.loops||[]){const dx=p.x-L.cx,dy=p.y-L.cy,d=Math.hypot(dx,dy)||1;
    if(L.ph===0&&dy>L.r*.3&&dx<0)L.ph=1;else if(L.ph===1&&(dx>L.r+1.5||dy<-L.r-3||d>L.r+5))L.ph=0;if(dx<-L.r-2&&L.ph===1&&dy<-L.r+1)L.ph=0;
    /* magic loop: holds you onto the track and keeps you moving round */
    if(d<L.r-.25&&d>L.r-3.2&&dy>-L.r+.8&&(L.ph===1||dx>-.5)){push(dx/d*14,dy/d*14);const tx=-dy/d,ty=dx/d,vt=v.x*tx+v.y*ty;if(vt<10)push(tx*24,ty*24);car.safe=.6;if(!car.lp||now-car.lp>2){car.lp=now;ev="loop"}}}
  for(const c of T.cannons||[])if(Math.abs(p.x-c.x)<1.6&&p.y<c.y+3&&p.y>c.y-1&&(!car.cn||now-car.cn>2.5)){car.cn=now;const vx=Math.cos(c.a)*c.v*(car.cass?1.04:1),vy=Math.sin(c.a)*c.v*(car.cass?1.04:1);
    for(const b of bodies){b.setLinearVelocity(pl.Vec2(vx,vy));b.setAngularVelocity(0)}for(const w of car.wheels)w.pv=null;ch.setAngularVelocity(0);car.safe=3.5;ev="cannon"}
  for(const w of T.winds||[])if(p.x>w.x0-.5&&p.x<w.x1+.5&&p.y<w.y+9){push(4,v.y<5?9.8*1.3:9.8*.95);if(!car.wd||now-car.wd>1.5){car.wd=now;ev="wind"}for(const ww of car.wheels)ww.pv=null}
  car.gotGem=0;for(const g of T.gems||[])if(!g.got&&Math.abs(g.x-p.x)<car.G.w/2+.6&&Math.abs(g.y-p.y)<car.G.h/2+.7){g.got=1;car.gems=(car.gems||0)+1;car.gotGem=1}
  const lo=T.low!=null?T.low:(T.low=drLowest(T));
  if(p.y<lo-9)ev="fall";for(const l of T.lava)if(p.x>l.x0&&p.x<l.x1&&p.y<l.y+.9)ev="fall";
  return ev}
function drCpAt(T,x){let c=T.cps[0]||0;for(const k of T.cps)if(k<=x+.01)c=Math.max(c,k);return c}
if(typeof module!=="undefined")module.exports={DR_U,DR_GW,DR_GH,DR_COL,DR_TRACKS,DR_MEDAL,drEnc,drDec,drSimp,drFitCircle,drGeo,drCar,drCarKill,drDrive,drSnapCheck,drMake,drTEnc,drTDec,drFromDrawn,drGroundAt,drLowest,drWorld,drPlanks,drTouching,drZones,drCpAt,drPlanksReset};
