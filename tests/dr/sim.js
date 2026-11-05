/* run a test car (holding GO) over every pre-made track to check they can be finished and set medal times */
global.planck=require("planck");const D=require("./dr_core.js");
const car0=process.argv[2]||"b0:40,60,160,60,160,40,120,30,60,30,40,60|w0:60,70,18|w0:140,70,18";
function run(T,ride,cass,verbose){const W=D.drWorld(T),G=D.drGeo(D.drDec(ride));const dt=1/60;
  let car=null,cp=0;const fails={};const spawn=(x,f)=>{if(car)D.drCarKill(W,car);D.drPlanksReset(W,T,x);if(f)fails[x]=(fails[x]||0)+1;const gy=D.drGroundAt(T,x)??0;car=D.drCar(W,G,x,gy-G.minY+.15,{cass,help:Math.max(0,Math.min(3,(fails[x]||0)-1))});car.fuel=car.fuel0};
  spawn(0);let t=0,stuck=0,falls=0,resp=0,snaps=0,maxx=0;
  while(t<150){const p=car.ch.getPosition(),a=car.ch.getAngle(),air=car.air>.1;
    const an=car.an||0;let inp={go:1,back:0,rk:0};if(air){inp=an<-.3?{back:1}:an>.3?{go:1}:{}}
    inp.rk=car.fuel>0&&(air||t%4<1)?1:0;
    D.drDrive(car,inp,dt);W.step(dt,8,3);const sn=D.drSnapCheck(W,car,dt);snaps+=sn.length;D.drPlanks(W,T,t);
    const ev=D.drZones(T,car,dt,t);t+=dt;maxx=Math.max(maxx,p.x);
    if(p.x>(car.px??-1e9)+1){car.px=p.x;stuck=0}else stuck+=dt;
    const allBroken=car.wheels.length&&car.wheels.every(w=>w.broken);
    if(Math.abs(car.an||0)>1.6&&car.gr)car.flipT=(car.flipT||0)+dt;else car.flipT=0;if(car.flipT>1.2){resp++;spawn(p.x);continue}
    if(ev==="fall"||stuck>3||allBroken&&stuck>1){if(ev==="fall")falls++;else resp++;spawn(D.drCpAt(T,p.x),1);stuck=0;car.px=-1e9}
    if(p.x>=T.fin)return{t:+t.toFixed(1),falls,resp,snaps,mdv:+(car.mdv||0).toFixed(1)};}
  return{t:null,falls,resp,snaps,maxx:+maxx.toFixed(1)}}
const which=process.argv[3]!=null?[+process.argv[3]]:D.DR_TRACKS.map((_,i)=>i);
for(const i of which){const T=D.drMake(D.DR_TRACKS[i].ops);const r=run(T,car0,0),r2=run(D.drMake(D.DR_TRACKS[i].ops),car0,1);console.log(i,D.DR_TRACKS[i].nm.padEnd(18),"fin",T.fin.toFixed(0),"dad",JSON.stringify(r),"cass",JSON.stringify(r2))}
