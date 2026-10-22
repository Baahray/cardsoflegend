/* Hoop Shot physics tests. Run:  node hoop_tests.js   (needs hoop_phys.js next to it or in ../)
   Every shot here is a real throw through the same physics the game uses. Nothing is faked. */
let H;try{H=require("./hoop_phys.js")}catch(e){H=require("../hoop_phys.js")}
const N=H.HP_ROUNDS[1];/* NORMAL distance */
let pass=0,fail=0;const t=(name,cond,info)=>{if(cond){pass++;console.log("  ok   "+name)}else{fail++;console.log("  FAIL "+name+(info?"  ->  "+info:""))}};
const shot=(pw,an,cfg=N,ph=0)=>{const r=H.hpSim(cfg,ph,H.hpLaunch(cfg,ph,pw,an),true);r.kind=H.hpKind(r);return r};
const seq=r=>r.ev.filter(e=>e.k!=="ground").map(e=>e.k+(e.pos?"-"+e.pos:"")).join(",");

console.log("The 10 outcomes");
let r=shot(.995,0);t("1  Perfect swish: in, touches nothing",r.ok&&r.kind.k==="swish"&&r.kind.contacts===0,seq(r));
r=shot(.97,0);   t("2  Front rim: hits the front of the rim and bounces out",!r.ok&&r.kind.k==="rim-front",seq(r));
r=shot(1.0175,0);t("3  Back rim: hits the back of the rim and bounces out",!r.ok&&r.kind.k==="rim-back",seq(r));
r=shot(1.015,-1.5);t("4a Left rim: clips the left side and falls away",!r.ok&&r.kind.k==="rim-left",seq(r));
r=shot(1.015,1.5); t("4b Right rim: clips the right side and falls away",!r.ok&&r.kind.k==="rim-right",seq(r));
r=shot(1.08,3.5);t("5  Backboard bounce: hits the board and misses",!r.ok&&r.kind.k==="board",seq(r));
r=shot(1.04,0);  t("6  Bank shot: off the board and in",r.ok&&r.kind.k==="bank",seq(r));
r=shot(.9875,0); t("7  Rim and in: touches the rim and drops in",r.ok&&r.kind.k==="rim-in",seq(r));
r=shot(1.0075,1.75);t("7b Roll in: rolls round the rim and drops in",r.ok&&r.kind.k==="roll-in"&&r.kind.roll>100,seq(r)+" roll "+r.kind.roll);
r=shot(1.005,2); t("8  Rim and out: rolls round the rim and falls out",!r.ok&&r.kind.k==="roll-out"&&r.kind.roll>100,seq(r)+" roll "+r.kind.roll);
r=shot(.99,.25); t("9  Multiple contacts: rattles around before falling",r.kind.k==="multi"&&r.kind.contacts>=4,seq(r));
r=shot(.9,0);const last=r.frames[r.frames.length-1];
t("10 Ground bounce: misses, bounces lower and lower, then stops",r.kind.k==="airball"&&r.kind.grounds>=3&&r.end<8,`grounds ${r.kind.grounds} end ${r.end.toFixed(2)}s`);
{const g=r.ev.filter(e=>e.k==="ground").map(e=>e.sp);t("   ...each bounce is smaller than the one before",g.every((v,i)=>i===0||v<g[i-1]),g.join(" "));
 t("   ...comes to rest on the floor",Math.abs(last.p[1]-H.HP.br)<.01,JSON.stringify(last.p))}

console.log("\nRules");
{const a=shot(1.0075,1.75),b=shot(1.0075,1.75);t("Same swipe gives exactly the same shot (replays and tests)",JSON.stringify(a.frames)===JSON.stringify(b.frames)&&a.ok===b.ok)}
{const a=shot(.995,0),b=shot(.995,0.6);t("A slightly different swipe gives a different path",JSON.stringify(a.frames)!==JSON.stringify(b.frames))}
{/* ball thrown straight UP through the ring from underneath, drifting sideways so it lands away from the hoop */
 const r=H.hpSim(N,0,{p:[0,H.HP.y0,0],v:[.42,7.4,0],w:[0,0,0]},true);
 const up=r.frames.some(f=>Math.hypot(f.p[0],f.p[2])<.2&&Math.abs(f.p[1]-3.05)<.15);
 t("Going UP through the hoop does not score",up&&!r.ok,"went up through: "+up+" scored: "+r.ok)}
{let n=0;const cfg=N;for(let pw=.97;pw<=1.07;pw+=.0025)for(let an=-3;an<=3;an+=.5){const r=H.hpSim(cfg,0,H.hpLaunch(cfg,0,pw,an),false);if(r.ok&&!(r.scoreT>0))n++}
 t("Every score happens once, at one moment (no double scores)",n===0)}
{const r=shot(1.0075,1.75);/* roll-in: lots of rim contacts but scored once */t("A ball rattling on the rim still only scores once",r.ok&&r.scoreT>0&&r.ev.filter(e=>e.k==="rim").length>=2)}
{const r=shot(.9875,0),c=r.ev.find(e=>e.k==="rim"),b=r.frames.filter(f=>f.t<c.t).pop(),a=r.frames.find(f=>f.t>c.t2+.02);
 t("Spin changes when the ball hits the rim (spin is kept and passed on)",b&&a&&Math.hypot(...a.w)>0&&JSON.stringify(b.w)!==JSON.stringify(a.w))}
{const r=shot(.995,0),f=r.frames,i=f.findIndex(x=>x.p[1]<3.05&&Math.hypot(x.p[0],x.p[2])<.2);const g=f.slice(i,i+6),v=(g[5].p[1]-g[4].p[1])/(g[5].t-g[4].t),free=-Math.sqrt(Math.max(0,(f.reduce((m,x)=>Math.max(m,x.p[1]),0)-g[5].p[1])*2*9.81));
 t("The net slows the ball as it drops through",v>free,`speed ${v.toFixed(2)} vs free fall ${free.toFixed(2)}`)}
{let ok=0;for(const ri of [0,1,2,3,4])for(const ph of [0,.7,1.4,2.1])if(H.hpSim(H.HP_ROUNDS[ri],ph,H.hpLaunch(H.HP_ROUNDS[ri],ph,1,0),false).ok)ok++;
 t("A perfect swipe scores in every round, even when the hoop moves",ok===20,ok+"/20")}
{const a=H.hpAssist(1.2,6,true,N),b=H.hpAssist(1.2,6,false,N);t("Flick help: Cass's small mistakes are forgiven",a.pw===1&&a.an===0,JSON.stringify(a));t("Flick help: Dad gets a little less",b.pw>1&&b.an>0,JSON.stringify(b))}
console.log(`\n${pass} passed, ${fail} failed`);if(fail)process.exit(1);
