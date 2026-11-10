/* run a test car (holding GO) over every pre-made track to check they can be finished and set medal times */
global.planck=require("planck");const D=require("./dr_core.js");
const car0=process.argv[2]||"b0:40,60,160,60,160,40,120,30,60,30,40,60|w0:60,70,18|w0:140,70,18";
function run(T,ride,cass,verbose){const G=D.drGeo(D.drDec(ride));D.drFitTrack(T,G);const W=D.drWorld(T);const dt=1/60;
  let car=null,cp=0;const fails={};const spawn=(x,f)=>{if(car)D.drCarKill(W,car);D.drPlanksReset(W,T,x);if(f)fails[x]=(fails[x]||0)+1;const gy=D.drGroundAt(T,x)??0;car=D.drCar(W,G,x,gy-G.minY+.15,{cass,help:Math.max(0,Math.min(3,(fails[x]||0)-1))});car.fuel=car.fuel0};
  spawn(0);let t=0,stuck=0,falls=0,resp=0,snaps=0,maxx=0,skips=0;
  while(t<150){const p=car.ch.getPosition(),a=car.ch.getAngle(),air=car.air>.1;
    const an=car.an||0;let inp={go:1,back:0,rk:0};if(air){inp=an<-.3?{back:1}:an>.3?{go:1}:{}}
    inp.rk=car.fuel>0&&(air||t%4<1)?1:0;
    D.drMovers(T,t,dt);D.drDrive(car,inp,dt);W.step(dt,8,3);const sn=D.drSnapCheck(W,car,dt);snaps+=sn.length;D.drPlanks(W,T,t);
    const ev=D.drZones(T,car,dt,t);if(ev==="loop")car.loops=(car.loops||0)+1;t+=dt;maxx=Math.max(maxx,p.x);
    if(car.loop||p.x>(car.px??-1e9)+1){if(!car.loop)car.px=p.x;stuck=0}else stuck+=dt;if(stuck>2.5&&!car.hop){car.hop=1;for(const b of [car.ch,...car.wheels.filter(w=>!w.broken).map(w=>w.b)]){const u=b.getLinearVelocity();b.setLinearVelocity(planck.Vec2(u.x+3,u.y+4.5))}}if(stuck<1)car.hop=0;
    const allBroken=car.wheels.length&&car.wheels.every(w=>w.broken);
    if(Math.abs(car.an||0)>1.6&&car.gr)car.flipT=(car.flipT||0)+dt;else car.flipT=0;if(car.flipT>1.2){resp++;spawn(p.x);continue}
    if((ev==="fall"||stuck>6||allBroken&&stuck>1)&&verbose)verbose.push((ev==="fall"?"F":"S")+Math.round(p.x));if(ev==="fall"||stuck>6||allBroken&&stuck>1){if(ev==="fall")falls++;else resp++;{let cp=D.drCpAt(T,p.x);if((fails[cp]||0)>=4){const nx=T.cps.find(c=>c>cp+1);if(nx!=null){cp=nx;skips++}}spawn(cp,1)}stuck=0;car.px=-1e9}
    if(p.x>=T.fin)return{t:+t.toFixed(1),falls,resp,snaps,skips,loops:car.loops||0};}
  return{t:null,falls,resp,snaps,skips,maxx:+maxx.toFixed(1)}}
const where=(ops,x)=>{let lo=0;for(let i=1;i<=ops.length;i++){const T=D.drMake(ops.slice(0,i));if(T.fin+6>x){return i-1+':'+JSON.stringify(ops[i-1])}}return'end'};
if(process.env.DBG){const i=+process.env.DBG;const ops=D.DR_TRACKS[i].ops;for(const c of [0,1]){const v=[];const r=run(D.drMake(ops),car0,c,v);const m={};for(const e of v){const k=e[0]+' '+where(ops,+e.slice(1));m[k]=(m[k]||0)+1}console.log(i,c?'cass':'dad',JSON.stringify(r),JSON.stringify(m))}process.exit(0)}
const which=process.argv[3]!=null?[+process.argv[3]]:D.DR_TRACKS.map((_,i)=>i);
for(const i of which){const T=D.drMake(D.DR_TRACKS[i].ops);const r=run(T,car0,0),r2=run(D.drMake(D.DR_TRACKS[i].ops),car0,1);console.log(i,D.DR_TRACKS[i].nm.padEnd(18),"fin",T.fin.toFixed(0),"dad",JSON.stringify(r),"cass",JSON.stringify(r2))}
