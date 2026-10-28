global.CANNON=require("cannon");const C=CANNON;const Z=require("./wb_core.js");
/* a sensible player: aim at the biggest bit still standing, low down on it */
function aimAt(x,y,z,ammo){const yaw=Math.atan2(x,z),d=Math.hypot(x,z);let best=.5,bd=1e9;for(let p=0;p<=1;p+=.02){const s=Z.wbAim(p,yaw,ammo);const hd=Math.hypot(s.vx,s.vz),t=(d-Math.hypot(s.x,s.z))/hd;if(t<0)continue;const yy=s.y+s.vy*t-4.91*t*t;const e=Math.abs(yy-y);if(e<bd){bd=e;best=p}}return[best,yaw]}
function play(k,ammo="ball",maxS=15){const L=Z.WB_LEVELS.find(l=>l.k===k);const G=Z.wbWorld(C,Z.wbHouse(k),{boss:L.boss,easy:L.easy});Z.wbSettle(G);let s=0;const prog=[];
  while(!Z.wbFlat(G)&&s<maxS){let tb=null,ty=-1;const st=G.blocks.filter(b=>b.wb.orig&&b.wb.down!==2&&!b.wb.gone);for(const b of st){const y=b.position.y;if(y>ty){ty=y;tb=b}}
    if(!tb)break;/* aim at the lower part of the house under the highest block */const tgt=st.filter(b=>Math.hypot(b.position.x-tb.position.x,b.position.z-tb.position.z)<2).sort((a,b)=>a.position.y-b.position.y)[0]||tb;
    const [p,yaw]=aimAt(tgt.position.x,Math.max(.5,tgt.position.y+(s%2?.6:0)),tgt.position.z-1,ammo);Z.wbFire(G,p,yaw,ammo);s++;let n=0;while(!Z.wbSettled(G)&&n<600){Z.wbStep(G,Z.WB.step);n++}prog.push(Math.round(G.down*100))}
  return{s,prog,coins:G.coins,flat:Z.wbFlat(G)}}
module.exports={aimAt,play};
if(require.main===module){const lvls=process.argv[2]?process.argv[2].split(","):Z.WB_LEVELS.map(l=>l.k),ammo=process.argv[3]||"ball";
  for(const k of lvls){const r=play(k,ammo);const L=Z.WB_LEVELS.find(l=>l.k===k);console.log(k.padEnd(7),"par",L.par,"|",r.s,"shots",r.flat?"FLAT":"not flat","(",r.prog.join(","),") coins",r.coins)}}
