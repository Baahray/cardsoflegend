/* ================= BATTLE CARS: battlegrounds =================
   Each battleground has a shape (square or round), walls or open edges, holes you fall into (pit / lava / water),
   things in the way (rocks, scrap), slippery bits, fire vents, and hammer guards or crushers.
   The 3D for each is built the first time it's needed. */
const RW_MAPS={
  arena:{nm:"THE ARENA",ic:"🏟️",say:"Walls all round, a pit, fire vents and two hammer guards.",shape:"sq",A:11,walls:1,grip:1,bg:0x1d2433,
    holes:[{x:6.5,z:0,w:1,d:1,k:"pit"}],vents:[[-6.5,0],[0,0]],guards:[[9.4,9.4,2.5,"hammer"],[-9.4,-9.4,2.5,"hammer"]],obs:[],slick:[],
    spawn:{X:[0,7,Math.PI/2],O:[0,-7,-Math.PI/2]},drive:[-3,3,-Math.PI/4],barrels:[[1,-2],[4,3],[-3,-4],[0,-7],[7,5],[-6,4],[5,-4]]},
  volcano:{nm:"VOLCANO",ic:"🌋",say:"A river of lava with two stone bridges. Fall in and you're out!",shape:"circ",R:11,walls:1,grip:1,bg:0x2a120c,
    holes:[{x:-8.9,z:0,w:2.3,d:1.3,k:"lava"},{x:0,z:0,w:3.4,d:1.3,k:"lava"},{x:8.9,z:0,w:2.3,d:1.3,k:"lava"}],vents:[[-6.5,6],[6.5,-6]],guards:[],
    obs:[{x:-7.5,z:-5.5,r:.9},{x:7.5,z:5.5,r:.9},{x:3,z:8.3,r:.7},{x:-3,z:-8.3,r:.7}],slick:[],
    spawn:{X:[0,7.5,Math.PI/2],O:[0,-7.5,-Math.PI/2]},drive:[0,6.5,Math.PI/2],barrels:[[2.5,4],[-3,4.5],[-5,-3.5],[4,-4],[0,-6],[5,2.5]]},
  ice:{nm:"ICE LAKE",ic:"❄️",say:"Slippery ice, no walls, holes in the ice. Slide in and it's a splash!",shape:"circ",R:10.5,walls:0,grip:.22,bg:0x9cc7e4,
    holes:[{x:-4.6,z:0,r:1.3,k:"water"},{x:4.6,z:0,r:1.3,k:"water"}],vents:[],guards:[],obs:[{x:0,z:0,r:1.1}],slick:[],
    spawn:{X:[0,6.5,Math.PI/2],O:[0,-6.5,-Math.PI/2]},drive:[0,6,Math.PI/2],barrels:[[2.5,3],[-2.5,-3],[-6,3.5],[6,-3.5],[0,-6],[6.5,3]]},
  junk:{nm:"JUNKYARD",ic:"🔩",say:"Scrap piles to hide behind, oil slicks, and two crushers.",shape:"sq",A:11,walls:1,grip:1,bg:0x2f3029,
    holes:[],vents:[[0,0]],guards:[[-8.6,0,1.5,"press"],[8.6,0,1.5,"press"]],
    obs:[{x:-4,z:4,w:.75,d:.75},{x:4,z:-4,w:.75,d:.75},{x:-8.2,z:-8,w:1.7,d:1.1},{x:8.2,z:8,w:1.7,d:1.1},{x:4,z:5,r:.55},{x:-4,z:-5,r:.55},{x:-8.8,z:5,r:.55},{x:8.8,z:-5,r:.55}],
    slick:[{x:-3,z:.5,r:1.6},{x:3.5,z:1.8,r:1.3},{x:.5,z:-3.8,r:1.2}],
    spawn:{X:[0,7.5,Math.PI/2],O:[0,-7.5,-Math.PI/2]},drive:[0,7,Math.PI/2],barrels:[[1.5,3],[-1.5,-2.5],[-6,2],[6,-2],[0,-7],[6,4]]},
  sky:{nm:"SKY SUMO",ic:"☁️",say:"A floating island with no walls. Push them off the edge!",shape:"sq",A:7.5,walls:0,grip:1,bg:0x86c5f5,
    holes:[],vents:[[0,0]],guards:[],obs:[],slick:[],
    spawn:{X:[0,5,Math.PI/2],O:[0,-5,-Math.PI/2]},drive:[0,4.5,Math.PI/2],barrels:[[2,2],[-2,-2],[4,-3],[-4,3],[0,-4]]}};
const RW_MAP_IDS=Object.keys(RW_MAPS);
const rwMapOk=id=>RW_MAPS[id]?id:"arena";
const rwMapCur=()=>RW_MAPS[rwMapOk(RWG&&RWG.map)];
const RW_FALL={pit:"INTO THE PIT! 🕳️",lava:"INTO THE LAVA! 🌋",water:"SPLASH! 🌊",edge:"OFF THE EDGE! ☁️"};
const RW_FALLSAY={pit:"fell in the pit",lava:"fell in the lava",water:"fell through the ice",edge:"went off the edge"};

/* ---------- building the 3D ---------- */
function rwHzTex(){return RWR.hzT||(RWR.hzT=rwTex(128,32,(x,w,h)=>{for(let i=-2;i<12;i++){x.fillStyle=i%2?"#111":"#ffc400";x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16+16,0);x.lineTo(i*16,h);x.lineTo(i*16-16,h);x.fill()}}))}
function rwVentMesh(g,x,z,rock){const T=THREE,gr=rwTex(128,128,(c,w,h)=>{c.fillStyle="#1a1a1a";c.fillRect(0,0,w,h);c.fillStyle="#555";for(let i=8;i<w;i+=16)c.fillRect(i,0,6,h)});
  const m=new T.MeshStandardMaterial({map:gr,roughness:.7,metalness:.6,emissive:new T.Color(0xff4400),emissiveIntensity:0}),d=new T.Mesh(new T.CircleGeometry(.95,32),m);d.rotation.x=-Math.PI/2;d.position.set(x,.012,z);g.add(d);
  const r=new T.Mesh(new T.RingGeometry(.95,1.12,32),rock?new T.MeshStandardMaterial({color:0x3b2a24,roughness:.9}):new T.MeshStandardMaterial({map:rwHzTex()}));r.rotation.x=-Math.PI/2;r.position.set(x,.013,z);g.add(r);return{m,x,z}}
function rwGuardMesh(g,gx,gz,zh,kind){const T=THREE,hz=rwHzTex(),iron=new T.MeshStandardMaterial({color:0x2c3038,metalness:.8,roughness:.35}),dark=new T.MeshStandardMaterial({color:0x15171b,roughness:.8});
  if(kind==="press"){/* a crusher: two posts, a beam, and a heavy block that slams down */
    const zone=new T.Mesh(new T.PlaneGeometry(zh*2,zh*2),new T.MeshStandardMaterial({map:hz,transparent:true,opacity:.85}));zone.rotation.x=-Math.PI/2;zone.position.set(gx,.008,gz);g.add(zone);
    const inner=new T.Mesh(new T.PlaneGeometry(zh*2-.4,zh*2-.4),new T.MeshStandardMaterial({color:0x2a2b2e,roughness:.9}));inner.rotation.x=-Math.PI/2;inner.position.set(gx,.01,gz);g.add(inner);
    for(const s of[-1,1]){const p=new T.Mesh(new T.BoxGeometry(.35,3.4,.35),iron);p.position.set(gx,1.7,gz+s*(zh+.25));p.castShadow=true;g.add(p)}
    const beam=new T.Mesh(new T.BoxGeometry(.5,.45,zh*2+.9),iron);beam.position.set(gx,3.35,gz);g.add(beam);
    const arm=new T.Group();arm.position.set(gx,2.6,gz);const blk=new T.Mesh(new T.BoxGeometry(zh*1.8,.7,zh*1.8),new T.MeshStandardMaterial({color:0x6b7078,metalness:.85,roughness:.35}));blk.castShadow=true;arm.add(blk);
    const st=new T.Mesh(new T.BoxGeometry(zh*1.82,.2,zh*1.82),new T.MeshStandardMaterial({map:hz}));st.position.y=.2;arm.add(st);const rod=new T.Mesh(new T.CylinderGeometry(.12,.12,1.6,10),iron);rod.position.y=1;arm.add(rod);g.add(arm);
    return{arm,gx,gz,zh,kind}}
  /* hammer guard — our own design: a squat iron block on tracks with one glowing eye and a big hammer */
  const zone=new T.Mesh(new T.RingGeometry(3.3,3.54,4,1),new T.MeshStandardMaterial({map:hz}));zone.rotation.set(-Math.PI/2,0,Math.PI/4);zone.position.set(gx,.014,gz);g.add(zone);
  const gg=new T.Group(),bx=new T.Mesh(new T.BoxGeometry(1.5,.9,1.3),iron);bx.position.y=.6;bx.castShadow=true;gg.add(bx);
  for(const s of[-1,1]){const t=new T.Mesh(new T.BoxGeometry(1.7,.42,.3),dark);t.position.set(0,.21,s*.72);gg.add(t)}
  const band=new T.Mesh(new T.BoxGeometry(1.52,.16,1.32),new T.MeshStandardMaterial({map:hz}));band.position.y=.86;gg.add(band);
  const eye=new T.Mesh(new T.SphereGeometry(.17,16,12),new T.MeshStandardMaterial({color:0xff3b1f,emissive:new T.Color(0xff2a00),emissiveIntensity:1.6}));eye.position.set(.72,.62,0);gg.add(eye);
  const arm=new T.Group();arm.position.set(.2,1.08,0);const bar=new T.Mesh(new T.BoxGeometry(1.9,.16,.18),iron);bar.position.x=.95;arm.add(bar);
  const head=new T.Mesh(new T.BoxGeometry(.42,.55,.55),new T.MeshStandardMaterial({color:0x8a8f99,metalness:.9,roughness:.3}));head.position.set(1.85,-.12,0);head.castShadow=true;arm.add(head);arm.rotation.z=1.1;gg.add(arm);
  gg.position.set(gx*1.1,0,gz*1.1);gg.rotation.y=Math.atan2(gz,-gx);g.add(gg);return{arm,gx,gz,zh,kind}}
const rwRock=(g,x,z,r,col,y=0)=>{const T=THREE,m=new T.Mesh(new T.DodecahedronGeometry(r,0),new T.MeshStandardMaterial({color:col,roughness:.95,flatShading:true}));m.position.set(x,y+r*.55,z);m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);m.scale.y=.75;m.castShadow=m.receiveShadow=true;g.add(m);return m};
function rwMapBuild(id){RWR.mg=RWR.mg||{};if(RWR.mg[id])return RWR.mg[id];const T=THREE,m=RW_MAPS[id],g=new T.Group();g.visible=false;RWR.arena.add(g);RWR.mg[id]=g;g.userData.vents=[];g.userData.guards=[];
  if(id==="arena"&&RWR.arenaBase)g.add(RWR.arenaBase);
  if(id==="volcano"){
    const ft=rwTex(256,256,(x,w,h)=>{x.fillStyle="#2b2422";x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=`rgba(${Math.random()<.5?0:80},${Math.random()*30|0},0,${Math.random()*.25})`;x.fillRect(Math.random()*w,Math.random()*h,6,6)}
      x.strokeStyle="rgba(255,90,20,.35)";x.lineWidth=2;for(let i=0;i<9;i++){x.beginPath();let px=Math.random()*w,py=Math.random()*h;x.moveTo(px,py);for(let k=0;k<5;k++){px+=(Math.random()-.5)*60;py+=(Math.random()-.5)*60;x.lineTo(px,py)}x.stroke()}},5);
    const fl=new T.Mesh(new T.CircleGeometry(m.R+1.2,64),new T.MeshStandardMaterial({map:ft,roughness:.95}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
    const lt=rwTex(256,64,(x,w,h)=>{const gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#ff8a1f");gr.addColorStop(.5,"#ffd23f");gr.addColorStop(1,"#ff5a12");x.fillStyle=gr;x.fillRect(0,0,w,h);
      for(let i=0;i<40;i++){x.fillStyle=`rgba(${120+Math.random()*60|0},20,0,${.3+Math.random()*.4})`;x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*24,4+Math.random()*6,0,0,7);x.fill()}});
    lt.wrapS=lt.wrapT=T.RepeatWrapping;lt.repeat.set(6,1);const lava=new T.Mesh(new T.PlaneGeometry(m.R*2+2,2.6),new T.MeshStandardMaterial({map:lt,emissive:new T.Color(0xff5a12),emissiveMap:lt,emissiveIntensity:1.1,roughness:.5}));
    lava.rotation.x=-Math.PI/2;lava.position.y=.015;g.add(lava);g.userData.lava=lt;
    for(const s of[-1,1])for(const e of[-1,1]){const lip=new T.Mesh(new T.BoxGeometry(m.R*2+2,.12,.18),new T.MeshStandardMaterial({color:0x1a1210,roughness:.9}));lip.position.set(0,.06,e*1.38);if(s>0)g.add(lip)}
    const st=rwTex(128,128,(x,w,h)=>{x.fillStyle="#6d655f";x.fillRect(0,0,w,h);x.strokeStyle="#4a433e";x.lineWidth=3;for(let i=0;i<4;i++){x.strokeRect(2,i*32+2,w-4,28)}});
    for(const bx of[-5,5]){const br=new T.Mesh(new T.BoxGeometry(3.2,.1,3.1),new T.MeshStandardMaterial({map:st,roughness:.9}));br.position.set(bx,.05,0);br.receiveShadow=true;g.add(br);
      for(const s of[-1,1]){const rl=new T.Mesh(new T.BoxGeometry(.18,.28,3.1),new T.MeshStandardMaterial({color:0x4a433e,roughness:.9}));rl.position.set(bx+s*1.62,.14,0);g.add(rl)}}
    for(let i=0;i<34;i++){const a=i/34*Math.PI*2;rwRock(g,Math.cos(a)*(m.R+.9),Math.sin(a)*(m.R+.9),.9+Math.random()*.7,0x3a2a24)}
    for(const o of m.obs)rwRock(g,o.x,o.z,o.r*1.05,0x4a3a32);
    const pl=new T.PointLight(0xff6a1f,1.1,16);pl.position.set(0,1.6,0);g.add(pl)}
  if(id==="ice"){
    const wt=rwTex(128,128,(x,w,h)=>{x.fillStyle="#123d5c";x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.strokeStyle=`rgba(160,210,255,${Math.random()*.2})`;x.beginPath();const y=Math.random()*h;x.moveTo(0,y);x.quadraticCurveTo(w/2,y+(Math.random()-.5)*20,w,y);x.stroke()}},8);
    const water=new T.Mesh(new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({map:wt,roughness:.15,metalness:.2}));water.rotation.x=-Math.PI/2;water.position.y=-.4;g.add(water);g.userData.water=wt;
    const it=rwTex(256,256,(x,w,h)=>{x.fillStyle="#cfe6f7";x.fillRect(0,0,w,h);for(let i=0;i<300;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.35})`;x.fillRect(Math.random()*w,Math.random()*h,10,2)}
      x.strokeStyle="rgba(120,170,210,.5)";x.lineWidth=1.5;for(let i=0;i<14;i++){x.beginPath();let px=Math.random()*w,py=Math.random()*h;x.moveTo(px,py);for(let k=0;k<4;k++){px+=(Math.random()-.5)*70;py+=(Math.random()-.5)*70;x.lineTo(px,py)}x.stroke()}},4);
    const ice=new T.Mesh(new T.CylinderGeometry(m.R,m.R-.15,.4,72),new T.MeshStandardMaterial({map:it,roughness:.38,metalness:0,color:0xc4def2,envMapIntensity:.45}));ice.position.y=-.2;ice.receiveShadow=true;g.add(ice);
    const rim=new T.Mesh(new T.TorusGeometry(m.R,.09,8,96),new T.MeshStandardMaterial({color:0xffffff,roughness:.6}));rim.rotation.x=Math.PI/2;rim.position.y=.01;g.add(rim);
    for(const h of m.holes){const d=new T.Mesh(new T.CircleGeometry(h.r,40),new T.MeshStandardMaterial({color:0x0e3654,roughness:.1,metalness:.2}));d.rotation.x=-Math.PI/2;d.position.set(h.x,.006,h.z);g.add(d);
      const e=new T.Mesh(new T.RingGeometry(h.r,h.r+.22,40),new T.MeshStandardMaterial({color:0xffffff,roughness:.5}));e.rotation.x=-Math.PI/2;e.position.set(h.x,.008,h.z);g.add(e)}
    const pil=new T.Mesh(new T.CylinderGeometry(.85,1.1,1.8,7),new T.MeshStandardMaterial({color:0xaee0ff,roughness:.08,metalness:.1,transparent:true,opacity:.9,flatShading:true}));pil.position.y=.9;pil.castShadow=true;g.add(pil);
    const cap=new T.Mesh(new T.SphereGeometry(.88,12,8,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:0xffffff,roughness:.9}));cap.position.y=1.78;cap.scale.y=.45;g.add(cap);
    for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,r=m.R+2+Math.random()*9,f=new T.Mesh(new T.BoxGeometry(1+Math.random()*1.6,.18,1+Math.random()*1.2),new T.MeshStandardMaterial({color:0xe6f4ff,roughness:.3}));f.position.set(Math.cos(a)*r,-.32,Math.sin(a)*r);f.rotation.y=Math.random()*3;g.add(f)}}
  if(id==="junk"){
    const ft=rwTex(256,256,(x,w,h)=>{x.fillStyle="#5b5446";x.fillRect(0,0,w,h);for(let i=0;i<900;i++){const c=60+Math.random()*60|0;x.fillStyle=`rgb(${c+10},${c},${c-12})`;x.fillRect(Math.random()*w,Math.random()*h,3,3)}},6);
    const fl=new T.Mesh(new T.PlaneGeometry(m.A*2,m.A*2),new T.MeshStandardMaterial({map:ft,roughness:.95}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
    const fz=rwTex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle="#b9c0c7";x.lineWidth=2.5;x.beginPath();x.moveTo(0,0);x.lineTo(w,h);x.moveTo(w,0);x.lineTo(0,h);x.stroke()});fz.wrapS=fz.wrapT=T.RepeatWrapping;fz.repeat.set(22,2);
    const A=m.A;for(const[sx,sz,ry]of[[0,-A,0],[0,A,0],[-A,0,Math.PI/2],[A,0,Math.PI/2]]){const f=new T.Mesh(new T.PlaneGeometry(A*2,1.6),new T.MeshStandardMaterial({map:fz,transparent:true,alphaTest:.3,side:T.DoubleSide,metalness:.6,roughness:.4}));f.position.set(sx,.8,sz);f.rotation.y=ry;g.add(f)}
    for(let i=0;i<=16;i++)for(const s of[-1,1]){const t=-A+i*A/8;for(const[px,pz]of[[t,s*A],[s*A,t]]){const p=new T.Mesh(new T.CylinderGeometry(.06,.06,1.8,6),new T.MeshStandardMaterial({color:0x7d858c,metalness:.7}));p.position.set(px,.9,pz);g.add(p)}}
    const cols=[0xc0392b,0x2e86c1,0x27ae60,0xf1c40f,0x8e44ad,0xd35400],rust=c=>rwTex(64,64,(x,w,h)=>{x.fillStyle="#"+c.toString(16).padStart(6,"0");x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.fillStyle=`rgba(${110+Math.random()*50|0},${50+Math.random()*30|0},20,${Math.random()*.6})`;x.beginPath();x.arc(Math.random()*w,Math.random()*h,2+Math.random()*7,0,7);x.fill()}});
    for(const o of m.obs){if(o.r){for(let k=0;k<3;k++){const t=new T.Mesh(new T.TorusGeometry(o.r*.78,o.r*.26,10,20),new T.MeshStandardMaterial({color:0x1b1b1b,roughness:.9}));t.rotation.x=Math.PI/2;t.position.set(o.x,.16+k*.32,o.z);t.castShadow=true;g.add(t)}}
      else if(o.w<1){const b=new T.Mesh(new T.BoxGeometry(o.w*2,1.1,o.d*2),new T.MeshStandardMaterial({map:rust(cols[(o.x*7+o.z*3+30|0)%cols.length]),roughness:.7,metalness:.4}));b.position.set(o.x,.55,o.z);b.rotation.y=.3;b.castShadow=true;g.add(b)}
      else{for(let k=0;k<7;k++){const s=.4+Math.random()*.5,b=new T.Mesh(k%2?new T.BoxGeometry(s*1.6,s,s):new T.CylinderGeometry(s*.4,s*.4,s*1.6,8),new T.MeshStandardMaterial({map:rust(cols[k%cols.length]),roughness:.7,metalness:.5}));
        b.position.set(o.x+(Math.random()-.5)*o.w*1.6,s*.5+(k>4?.5:0),o.z+(Math.random()-.5)*o.d*1.6);b.rotation.set(Math.random(),Math.random()*3,Math.random());b.castShadow=true;g.add(b)}}}
    for(const s of m.slick){const d=new T.Mesh(new T.CircleGeometry(s.r,32),new T.MeshStandardMaterial({color:0x0a0a0c,roughness:.05,metalness:.6}));d.rotation.x=-Math.PI/2;d.position.set(s.x,.005,s.z);d.scale.set(1,.8,1);g.add(d);
      const sh=new T.Mesh(new T.CircleGeometry(s.r*.5,24),new T.MeshStandardMaterial({color:0x5a2a7a,roughness:.05,metalness:.6,transparent:true,opacity:.35}));sh.rotation.x=-Math.PI/2;sh.position.set(s.x+.2,.007,s.z-.1);g.add(sh)}}
  if(id==="sky"){
    const A=m.A,st=rwTex(256,256,(x,w,h)=>{x.fillStyle="#b9ae98";x.fillRect(0,0,w,h);x.strokeStyle="#8f846e";x.lineWidth=3;for(let i=0;i<4;i++)for(let j=0;j<4;j++)x.strokeRect(i*64+2+(j%2)*10,j*64+2,60,60);for(let i=0;i<200;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;x.fillRect(Math.random()*w,Math.random()*h,6,6)}},4);
    const top=new T.Mesh(new T.BoxGeometry(A*2,.8,A*2),[0,0,new T.MeshStandardMaterial({map:st,roughness:.95,envMapIntensity:.4}),0,0,0].map(q=>q||new T.MeshStandardMaterial({color:0x8a7a62,roughness:.95})));top.position.y=-.4;top.receiveShadow=true;g.add(top);
    const trim=new T.MeshStandardMaterial({color:0xd4a72c,metalness:.7,roughness:.3});for(const[sx,sz,w,d]of[[0,-A,A*2+.1,.12],[0,A,A*2+.1,.12],[-A,0,.12,A*2],[A,0,.12,A*2]]){const t=new T.Mesh(new T.BoxGeometry(w,.06,d),trim);t.position.set(sx,.02,sz);g.add(t)}
    const und=new T.Mesh(new T.ConeGeometry(A*1.25,7,6),new T.MeshStandardMaterial({color:0x7a6a55,roughness:.95,flatShading:true}));und.rotation.x=Math.PI;und.position.y=-4.3;und.rotation.y=.4;g.add(und);
    const grass=new T.MeshStandardMaterial({color:0x5aa84a,roughness:.9});for(let i=0;i<10;i++){const a=i/10*Math.PI*2,b=new T.Mesh(new T.SphereGeometry(.5+Math.random()*.4,8,6),grass);b.position.set(Math.cos(a)*A*1.04,-.3,Math.sin(a)*A*1.04);b.scale.y=.6;g.add(b)}
    const cm=new T.MeshStandardMaterial({color:0xffffff,roughness:1});for(let i=0;i<16;i++){const c=new T.Group(),a=Math.random()*Math.PI*2,r=10+Math.random()*16;for(let k=0;k<4;k++){const s=new T.Mesh(new T.SphereGeometry(1+Math.random()*1.2,10,8),cm);s.position.set(k*1.2-1.8,Math.random()*.6,Math.random()-.5);c.add(s)}
      c.position.set(Math.cos(a)*r,-5-Math.random()*6,Math.sin(a)*r);c.scale.y=.6;g.add(c)}}
  for(const[x,z]of m.vents)g.userData.vents.push(rwVentMesh(g,x,z,id==="volcano"));
  for(const[x,z,zh,k]of m.guards)g.userData.guards.push(rwGuardMesh(g,x,z,zh,k));
  return g}
/* show a battleground (or hide them all and go back to the workshop) */
function rwMapShow(id){const G=RWG,T=THREE;id=rwMapOk(id);G.map=id;rwMapBuild(id);for(const k in RWR.mg)RWR.mg[k].visible=k===id;const m=RW_MAPS[id];
  RWR.scene.background=new T.Color(m.bg);RWR.scene.fog=id==="sky"||id==="ice"?new T.Fog(m.bg,26,70):null;
  RWR.vents=RWR.mg[id].userData.vents;RWR.guards=RWR.mg[id].userData.guards;G.hz={t0:G.t,vent:RWR.vents.map(()=>-9),guard:RWR.guards.map(()=>({t:0,cd:0,sw:9,vis:9}))}}
function rwMapHide(){if(!RWR||!RWR.scene)return;RWR.scene.background=new THREE.Color(0x1d2433);RWR.scene.fog=null}

/* ---------- the ground rules for a car on the current battleground ---------- */
/* how the car actually moves: on ice and oil it keeps sliding the way it was going */
function rwSlide(c,dt,ed){const m=rwMapCur(),fx=Math.cos(c.yaw),fz=-Math.sin(c.yaw);let grip=m.grip;for(const s of m.slick||[])if(Math.hypot(c.x-s.x,c.z-s.z)<s.r)grip=Math.min(grip,.3);if(ed)grip=Math.min(1,grip*1.4);
  if(c.mx==null){c.mx=fx*c.v;c.mz=fz*c.v}const k=grip>=1?1:Math.min(1,dt*grip*10);c.mx+=(fx*c.v-c.mx)*k;c.mz+=(fz*c.v-c.mz)*k;c.slip=grip<1&&Math.hypot(fx*c.v-c.mx,fz*c.v-c.mz)>1.5;return grip}
/* walls, edges, rocks and scrap in the way, and holes. Returns "", or how you fell: pit / lava / water / edge */
function rwBounds(c,ed){const m=rwMapCur(),r=c.r*.85;
  for(const o of m.obs||[]){if(o.r){const dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz)||1e-3,mn=o.r+r;if(d<mn){c.x=o.x+dx/d*mn;c.z=o.z+dz/d*mn;const vi=(c.mx||0)*dx/d+(c.mz||0)*dz/d;if(vi<0){c.mx-=dx/d*vi;c.mz-=dz/d*vi}c.v*=.85;const ki=c.kx*dx/d+c.kz*dz/d;if(ki<0){c.kx-=dx/d*ki*1.4;c.kz-=dz/d*ki*1.4}}}
    else{const px=Math.max(o.x-o.w,Math.min(o.x+o.w,c.x)),pz=Math.max(o.z-o.d,Math.min(o.z+o.d,c.z)),dx=c.x-px,dz=c.z-pz,d=Math.hypot(dx,dz);
      if(d<r){let nx,nz;if(d>1e-4){nx=dx/d;nz=dz/d}else{const ex=c.x-o.x,ez=c.z-o.z;if(Math.abs(ex)/o.w>Math.abs(ez)/o.d){nx=Math.sign(ex);nz=0}else{nx=0;nz=Math.sign(ez)}}
        c.x=px+nx*r;c.z=pz+nz*r;const vi=(c.mx||0)*nx+(c.mz||0)*nz;if(vi<0){c.mx-=nx*vi;c.mz-=nz*vi}c.v*=.85;const ki=c.kx*nx+c.kz*nz;if(ki<0){c.kx-=nx*ki*1.4;c.kz-=nz*ki*1.4}}}}
  if(m.shape==="sq"){if(m.walls){const A=m.A-c.r*.8;if(Math.abs(c.x)>A){c.x=Math.sign(c.x)*A;c.v*=.3;c.kx*=-.3;c.mx=(c.mx||0)*-.2}if(Math.abs(c.z)>A){c.z=Math.sign(c.z)*A;c.v*=.3;c.kz*=-.3;c.mz=(c.mz||0)*-.2}}
    else if(Math.max(Math.abs(c.x),Math.abs(c.z))>m.A+(ed?.35:.05))return"edge"}
  else{const d=Math.hypot(c.x,c.z)||1e-3;if(m.walls){const R=m.R-c.r*.8;if(d>R){c.x*=R/d;c.z*=R/d;c.v*=.3;const nx=c.x/R,nz=c.z/R,ki=c.kx*nx+c.kz*nz;if(ki>0){c.kx-=nx*ki*1.3;c.kz-=nz*ki*1.3}const vi=(c.mx||0)*nx+(c.mz||0)*nz;if(vi>0){c.mx-=nx*vi*1.2;c.mz-=nz*vi*1.2}}}
    else if(d>m.R+(ed?.35:.05))return"edge"}
  if((c.y||0)<.05){const sh=ed?.75:1;for(const h of m.holes||[]){const inH=h.r?Math.hypot(c.x-h.x,c.z-h.z)<h.r*sh:(Math.abs(c.x-h.x)<h.w*sh&&Math.abs(c.z-h.z)<h.d*sh);if(inH){c.fallAt=[h.r?h.x:c.x,h.r?h.z:Math.max(h.z-h.d,Math.min(h.z+h.d,c.z))];return h.k}}}
  return""}
/* falling: into a hole you sink down; off an edge you keep going and drop */
function rwFallStep(c,dt){if(c.out==="edge"){c.x+=(c.mx||0)*dt*.8;c.z+=(c.mz||0)*dt*.8;c.vy=(c.vy||0)-15*dt;c.y+=c.vy*dt;c.rz+=dt*1.5}
  else{const p=c.fallAt||[c.x,c.z];c.x+=(p[0]-c.x)*Math.min(1,dt*4);c.z+=(p[1]-c.z)*Math.min(1,dt*4);c.y=Math.max(-4,c.y-dt*(2+(-c.y)*3));if(c.out==="lava"&&Math.random()<.6)rwFlame(new THREE.Vector3(c.x+(Math.random()-.5),.2,c.z+(Math.random()-.5)),new THREE.Vector3(0,1,0),.8,1.2);
    if(c.out==="water"&&Math.random()<.5)rwSparks(c.x,.1,c.z,3)}c.v=0}
/* barrels in test drives: rocks and walls stop them, holes and edges swallow them */
function rwBarrelMap(d,dt){const m=rwMapCur();if(d.gone)return;
  if(d.sink){d.y-=dt*3;d.vx*=.9;d.vz*=.9;if(d.y<-3){d.gone=1;d.g.visible=false}return}
  for(const o of m.obs||[]){if(o.r){const dx=d.x-o.x,dz=d.z-o.z,q=Math.hypot(dx,dz)||1e-3;if(q<o.r+d.r){d.x=o.x+dx/q*(o.r+d.r);d.z=o.z+dz/q*(o.r+d.r);d.vx*=-.3;d.vz*=-.3}}
    else if(Math.abs(d.x-o.x)<o.w+d.r&&Math.abs(d.z-o.z)<o.d+d.r){const ox=o.w+d.r-Math.abs(d.x-o.x),oz=o.d+d.r-Math.abs(d.z-o.z);if(ox<oz){d.x+=Math.sign(d.x-o.x)*ox;d.vx*=-.4}else{d.z+=Math.sign(d.z-o.z)*oz;d.vz*=-.4}}}
  if(m.walls){if(m.shape==="sq"){const AA=m.A-.4;if(Math.abs(d.x)>AA){d.x=Math.sign(d.x)*AA;d.vx*=-.4}if(Math.abs(d.z)>AA){d.z=Math.sign(d.z)*AA;d.vz*=-.4}}else{const q=Math.hypot(d.x,d.z),R=m.R-.4;if(q>R){d.x*=R/q;d.z*=R/q;d.vx*=-.4;d.vz*=-.4}}}
  else if((m.shape==="sq"?Math.max(Math.abs(d.x),Math.abs(d.z))>m.A:Math.hypot(d.x,d.z)>m.R))d.sink=1;
  if(d.y<.05)for(const h of m.holes||[])if(h.r?Math.hypot(d.x-h.x,d.z-h.z)<h.r:(Math.abs(d.x-h.x)<h.w&&Math.abs(d.z-h.z)<h.d)){d.sink=1;if(h.k==="lava")d.burn=3}}
/* the battleground choice: chips (in the garage for test drives, in the lobby for battles) */
function rwMapChips(cur,attr){return`<div class="rwmaps">${RW_MAP_IDS.map(id=>{const m=RW_MAPS[id];return`<button class="rwmap${id===cur?" on":""}" ${attr}="${id}"><i>${m.ic}</i><b>${m.nm}</b></button>`}).join("")}</div>`}
