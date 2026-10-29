global.CANNON=global.CANNON||require("cannon");Object.assign(global,require("./wb_town.js"));
global.CANNON=global.CANNON||require("cannon");const C=CANNON;const Z=require("./wb_core.js");
/* a sensible player with the tap-to-aim cannon: aim low on the tallest thing still standing */
function pick(G,s){let st=G.blocks.filter(b=>b.wb.orig&&b.wb.down!==2&&!b.wb.gone);if(!st.length)return null;
  if(G.blds){/* a town: go for the nearest building that's still up */const up=G.blds.map((B,i)=>[B,i]).filter(([B])=>B.n&&!B.down).sort((a,b)=>Math.hypot(a[0].x0||0,a[0].z0||0)-Math.hypot(b[0].x0||0,b[0].z0||0));
    if(up.length){const k=up[0][1],sb=st.filter(b=>b.wb.s.bld===k);if(sb.length)st=sb}}let tb=st[0];for(const b of st)if(b.position.y>tb.position.y)tb=b;
  const col=st.filter(b=>Math.hypot(b.position.x-tb.position.x,b.position.z-tb.position.z)<1.6).sort((a,b)=>a.position.y-b.position.y);const t=G.blds?(s%2?tb:col[Math.floor(col.length/2)]||tb):col[Math.min(col.length-1,s%2?1:0)]||tb;return t}
function play(k,ammo="ball",maxS=20,blocks,o){const L=Z.WB_LEVELS.find(l=>l.k===k)||{};const G=Z.wbWorld(C,blocks||Z.wbHouse(k),o||{boss:L.boss,easy:L.easy});Z.wbSettle(G);let s=0;const prog=[];
  while(!Z.wbFlat(G)&&s<maxS){const t=pick(G,s);if(!t)break;Z.wbFireAt(G,t.position.x,Math.max(.6,t.position.y),t.position.z-.4,ammo);s++;let n=0;while(!Z.wbSettled(G)&&n<420){Z.wbStep(G,Z.WB.step);n++}prog.push(Math.round(G.down*100))}
  return{s,prog,coins:G.coins,flat:Z.wbFlat(G),G}}
module.exports={play,pick};
if(require.main===module){const lvls=process.argv[2]?process.argv[2].split(","):Z.WB_LEVELS.map(l=>l.k),ammo=process.argv[3]||"ball";
  for(const k of lvls){const L=Z.WB_LEVELS.find(l=>l.k===k);const G0=Z.wbWorld(C,Z.wbHouse(k),{boss:L.boss});Z.wbSettle(G0);for(let i=0;i<240;i++)Z.wbStep(G0,Z.WB.step);
    const r=play(k,ammo,L.town?40:20);console.log(k.padEnd(8),"blocks",G0.blocks.length,"idle",Math.round(G0.down*100)+"%","| par",L.par,"|",r.s,"shots",r.flat?"FLAT":"not flat","(",r.prog.join(","),")")}}
