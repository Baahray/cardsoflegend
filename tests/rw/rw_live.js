/* ================= BATTLE CARS: live battles between the two phones =================
   Uses the app's challenge pop-up. When it's accepted, games/rwl holds the battle: the car each player picked, READY, the start time, and who left.
   Each phone drives its own car and sends where it is a few times a second (games/rwp_X|O), with the hits it landed on the other car.
   The other phone takes those hits (damage, knocks, flips) on its own car. games/rwwin counts the wins. */
const RW_BT=120;
const RW_DMG={wedge:4,flip:6,spin:9,drum:9,axe:12,crush:11,spike:7,saw:8};
/* Cass's edge (never shown): he takes less damage and gets knocked about less, his pit is a bit smaller, he rights himself faster, and a draw goes to him */
const rwEdge=()=>me()==="O";

function rwListenLive(){if(typeof GNAME!=="undefined")GNAME.rw="BATTLE CARS";
  db.doc("games/rwl").onSnapshot(s=>{RWD.live=s.exists?s.data():null;rwOnLive()},er);
  for(const k of ["X","O"])db.doc("games/rwp_"+k).onSnapshot(s=>{if(k!==me()&&s.exists)rwOnPos(s.data())},er);
  db.doc("games/rwwin").onSnapshot(s=>{RWD.win=s.exists?s.data():{};if(RWG&&RWG.mode==="garage"&&!RWG.viewing){const e=$("#rwtally");if(e)e.innerHTML=rwTally()}},er)}
function rwLiveNew(c){return db.doc("games/rwl").set({id:c&&c.id||Date.now(),at:Date.now(),m:rwMapOk(c&&c.m),bX:"",bO:"",rX:0,rO:0,s:0,qX:0,qO:0})}
function rwLiveAsk(){const R=rwSel();if(!R){toast("Build a car first! 🏎️");return}const m=rwMapOk(rwLoad().map);if(typeof chSend!=="function"){rwLiveNew({id:Date.now(),m});return}chSend("rw",{m})}
const rwLiveFresh=()=>{const L=RWD.live;return!!(L&&L.id&&Date.now()-(L.at||0)<15*60000&&!L.qX&&!L.qO&&rwLoad().liveDone!==L.id)};
const rwTally=()=>{const w=RWD.win||{};return(w.X||w.O)?`🏆 Live battles won — Dad <b>${w.X||0}</b> · Cass <b>${w.O||0}</b>`:"Fight the other phone's car, live!"};
function rwLiveBtn(){return`<button class="b rwbig rwlivebtn" id="rwlive">⚔️ LIVE BATTLE vs ${rwNm(rwThem()).toUpperCase()}</button><div class="rwsoon" id="rwtally">${rwTally()}</div>`}
function rwOnLive(){const G=RWG,L=RWD.live,th=rwThem();if(!G||G.dead||!RWR||typeof g==="undefined"||g!=="rw")return;
  if(G.mode==="battle"){const B=G.B;if(B&&L&&L.id===B.id&&L["q"+th]&&!B.end)rwBEnd("win","left");return}
  if(G.mode==="lobby"){if(!L||L.id!==G.lobby||L["q"+th]){if(L&&L["q"+th])toast(rwNm(th)+" left the battle");G.lobby=null;const S=rwLoad();if(L){S.liveDone=L.id;rwSave()}return rwGarage()}
    rwLobbyUI();if(L.s&&L.rX&&L.rO)rwBattleGo();return}
  if(G.mode==="garage"&&rwLiveFresh())rwLobby()}

/* ---------- the lobby: pick a car, press READY ---------- */
function rwLobby(){const G=RWG,L=RWD.live;G.mode="lobby";G.lobby=L.id;G.viewing=null;G.auto=1;rwArena(0);rwBattleTidy();$("#rwbot").innerHTML="";$("#rwbot").className="rwbot";$("#rwhint").textContent="";$("#rwtop").className="rwtop";G.lobbyShown=null;rwLobbyUI();if(L.s&&L.rX&&L.rO)rwBattleGo()}
function rwLobbyUI(){const G=RWG,L=RWD.live,S=rwLoad(),th=rwThem(),tn=rwNm(th);if(!L||G.mode!=="lobby")return;
  const mine=L["r"+me()],theirs=L["r"+th],tb=theirs&&RWD.g[th]&&RWD.g[th].bots?RWD.g[th].bots[L["b"+th]]:null,R=rwSel();
  if(R&&(!G.M||G.M.R!==R))rwShow(R);rwCam("show");
  const key=[mine,theirs,L["b"+th],R&&R.id,S.bots.length,L.m].join("|");if(G.lobbyShown===key)return;G.lobbyShown=key;
  const chips=S.bots.slice().reverse().map(b=>`<button class="rwchip${R&&b.id===R.id?" on":""}" data-m="${rwEsc(b.id)}" ${mine?"disabled":""}><i style="background:${rwEsc(b.col)}"></i>${rwEsc(b.nm)}</button>`).join("");
  $("#rwpanel").className="rwpanel on garage";$("#rwpanel").innerHTML=`<div class="rwlogo">LIVE<br><span>BATTLE</span></div>
    <div class="rwcard"><div class="rwname">⚔️ You vs ${tn}</div>
      ${S.bots.length?`<div class="rwchips"><b>${mine?"YOUR CAR":"PICK YOUR CAR"}</b>${chips}</div>`:`<p class="rwsay">You need a car first! Leave this battle and build one.</p>`}
      <div class="rwchips" style="margin-top:6px"><b>BATTLEGROUND</b></div>${rwMapChips(rwMapOk(L.m),"data-lm")}<p class="rwsay" style="margin:2px 0 0">${RW_MAPS[rwMapOk(L.m)].say}</p>
      <div class="rwopp">${theirs?`✅ <b>${tn}</b> is READY${tb?` with <b>“${rwEsc(tb.nm)}”</b>`:""}!`:`<span class="rwdots"></span> ${tn} is picking a car…`}</div>
      <div class="rwbtns"><button class="b d" id="rwlq">✖ LEAVE</button>${mine?`<button class="b y rwbig" disabled>${theirs?"GET READY…":"WAITING FOR "+tn.toUpperCase()+"…"}</button>`:`<button class="b y rwbig" id="rwrdy" ${R?"":"disabled"}>READY! ⚔️</button>`}</div>
      <p class="rwsay" style="margin-top:8px">Knock out ${tn}'s car, flip it, or make it fall! 2 minutes.</p></div>`;
  $("#rwpanel").querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{S.sel=b.dataset.m;rwSave();sfx("tap");rwLobbyUI()});
  $("#rwpanel").querySelectorAll("[data-lm]").forEach(b=>b.onclick=()=>{const L=RWD.live;if(!L||b.dataset.lm===L.m||(L.rX&&L.rO))return;sfx("tap");db.doc("games/rwl").update({m:b.dataset.lm,rX:0,rO:0}).catch(er)});
  $("#rwlq").onclick=()=>rwLiveLeave();const rd=$("#rwrdy");if(rd)rd.onclick=()=>{const R=rwSel();if(!R)return;rwSave(1);sfx("win");
    const L=RWD.live;db.doc("games/rwl").update({["b"+me()]:R.id,["r"+me()]:1,...(L&&L["r"+th]?{s:Date.now()+5000}:{})}).catch(er)}}
function rwLiveLeave(){const G=RWG,L=RWD.live,B=G&&G.B;
  if(G&&G.mode==="battle"&&B&&!B.end){if(!confirm(`Leave the battle? ${rwNm(rwThem())} wins if you leave.`))return;B.q=1;rwLiveSend(2)}
  if(L&&!(B&&B.end)){db.doc("games/rwl").update({["q"+me()]:1}).catch(er)}const S=rwLoad();if(L){S.liveDone=L.id;rwSave()}if(G){G.lobby=null;G.mode="garage"}sfx("tap");rwGarage()}

/* ---------- starting the battle ---------- */
function rwBattleTidy(){const G=RWG;if(RWR&&RWR.foe)RWR.foe.clear();if(G&&G.B&&G.mode!=="battle")G.B=null;const h=$("#rwres");if(h)h.remove()}
function rwBattleGo(){const G=RWG,L=RWD.live,th=rwThem();if(!G||!L||(G.B&&G.B.id===L.id))return;
  const S=rwLoad(),myR=S.bots.find(b=>b.id===L["b"+me()])||rwSel(),fo=RWD.g[th]&&RWD.g[th].bots&&RWD.g[th].bots[L["b"+th]];
  if(!fo||!myR){clearTimeout(G.waitT);G.waitT=setTimeout(rwOnLive,700);return}
  const T=THREE,FR=rwUnpack(L["b"+th],fo);G.mode="battle";G.view=null;G.viewing=null;$("#rwpanel").className="rwpanel";$("#rwpanel").innerHTML="";$("#rwbot").className="rwbot";$("#rwhint").textContent="";
  G.map=rwMapOk(L.m);rwShow(myR);$("#rwtop").className="rwtop";rwArena(1);RWR.dummies.clear();G.dum=[];if(!RWR.foe){RWR.foe=new T.Group();RWR.scene.add(RWR.foe)}
  const fb=rwBody(FR);rwLegacy(FR,fb);const FM=rwModel(FR,fb,{});FM.g.rotation.order="YZX";RWR.foe.clear();RWR.foe.add(FM.g);FM.ht=FM.box.y1+FM.dy;G.M.ht=G.M.box.y1+G.M.dy;G.M.g.rotation.order="YZX";
  const st=rwStats(myR,G.body,rwCass()),fs=rwStats(FR,fb,th==="O"),sp=rwMapCur().spawn[me()],fp=rwMapCur().spawn[th],hpM=Math.round(80+st.arm*12);
  G.car={x:sp[0],z:sp[1],yaw:sp[2],v:0,spd:2.4+st.spd*.85,turn:((myR.wheels||[]).some(w=>w.k==="t")?2.6:(myR.wheels||[]).length<=2?4.2:3.3),push:st.push,pow:st.pow,kg:st.kg,r:Math.max(.5,G.M.r*.85),
    kx:0,kz:0,y:0,vy:0,rz:0,rzv:0,down:0,hp:hpM,hpM,out:0,burn:0,mx:null,mz:null};
  G.B={id:L.id,s:L.s,ca:me()==="O"?Math.PI:0,t:-9,go:0,cd:9,seq:0,ev:[],evDone:0,fc:{f:0,b:0},cool:{},shot:{},ls:0,pend:0,fin:0,end:null,ram:0,
    foe:{R:FR,M:FM,r:Math.max(.5,FM.r*.85),kg:fs.kg,push:fs.push,nm:FR.nm,x:fp[0],z:fp[1],yaw:fp[2],y:0,rz:0,spd:0,hp:1,hpM:1,fT:9,fB:9,fc:{f:0,b:0},net:null,last:0,pred:0,out:0,fin:0}};
  G.fireT=9;G.fireB=9;G.joy=null;G.dash=0;G.camSet=0;rwFireLabels();rwHud();sfx("b_warn")}
function rwHud(){let h=$("#rwhud");if(!h){h=document.createElement("div");h.id="rwhud";h.className="rwhud";$("#rwc").appendChild(h)}const th=rwThem();
  h.innerHTML=`<div class="rwhp me"><b>YOU</b><i><s id="rwhpm"></s></i></div><div class="rwclk" id="rwclk">2:00</div><div class="rwhp th"><b>${rwNm(th).toUpperCase()}</b><i><s id="rwhpt"></s></i></div>`}
/* ---------- each frame of a battle ---------- */
function rwCanAct(){const G=RWG,c=G.car,B=G.B;return!!(B&&B.go&&!B.end&&!B.fin&&!c.out&&c.y<.08&&Math.cos(c.rz)>.6)}
function rwBattleFrame(dt){const G=RWG,B=G.B,c=G.car,F=B.foe,now=Date.now();B.t=(now-B.s)/1000;
  if(B.t<0){const n=Math.ceil(-B.t);if(n<=3&&n!==B.cd){B.cd=n;rwMsg(String(n));sfx("tap")}}else if(!B.go){B.go=1;rwMsg("FIGHT!");sfx("b_boom");$("#rwhint").textContent="Left: drive · Right: FRONT and BACK weapons"}
  if(B.go&&B.t>3)$("#rwhint").textContent="";
  rwBStep(dt);rwFoeStep(dt);rwHazards(dt);
  if(B.go&&!B.fin&&!B.end&&B.t>=RW_BT){B.fin=1;B.finAt=now;rwMsg("TIME!");sfx("b_warn");rwLiveSend(2)}
  if(B.fin&&!B.end&&(F.fin||now-B.finAt>4000)){const a=Math.max(0,Math.round(c.hp))/c.hpM,b=F.hp/F.hpM;rwBEnd(a>b+.001||(Math.abs(a-b)<=.001&&rwEdge())?"win":"lose","time")}
  if(B.go&&!B.end&&F.last&&now-F.last>12000)rwBEnd("none","lost");
  if(B.go&&!B.end&&!F.last&&B.t>15)rwBEnd("none","lost");
  if(B.pend&&performance.now()-B.ls>90)rwLiveSend(1);else rwLiveSend(0);
  /* camera: keep both cars in view */
  const pc=G.pcam,port=G.H>G.W,mx=(c.x*.55+F.x*.45)*.85,mz=(c.z*.55+F.z*.45)*.85,dd=Math.hypot(c.x-F.x,c.z-F.z),hgt=Math.min(21,(port?10:7.5)+dd*(port?.38:.22)),back=hgt*.8,cs=Math.cos(B.ca),sn=Math.sin(B.ca),up=port?2.2:1;
  const want=new THREE.Vector3(mx+(back+up)*sn,hgt,mz+(back+up)*cs);if(!G.camSet){pc.position.copy(want);G.camSet=1}else pc.position.lerp(want,1-Math.exp(-dt*3));pc.lookAt(mx+up*sn,0,mz+up*cs);
  rwHudUpd()}
function rwHudUpd(){const G=RWG,B=G.B,c=G.car,F=B.foe,a=$("#rwhpm"),b=$("#rwhpt"),k=$("#rwclk");if(!a)return;
  const pa=Math.max(0,c.hp/c.hpM),pb=Math.max(0,F.hp/F.hpM);a.style.width=(pa*100).toFixed(1)+"%";b.style.width=(pb*100).toFixed(1)+"%";a.className=pa<.3?"low":"";b.className=pb<.3?"low":"";
  const left=Math.max(0,Math.ceil(RW_BT-Math.max(0,B.t)));k.textContent=Math.floor(left/60)+":"+String(left%60).padStart(2,"0");k.classList.toggle("low",left<=10&&B.go)}
/* my car: driving, knocks, flips, walls, the pit, and my weapons hitting the other car */
function rwBStep(dt){const G=RWG,B=G.B,c=G.car,M=G.M,F=B.foe,ed=rwEdge();let jx=0,jy=0;const act=rwCanAct();
  if(G.joy){jx=G.joy.dx;jy=G.joy.dy}if(G.keys.ArrowUp||G.keys.w)jy=-1;if(G.keys.ArrowDown||G.keys.s)jy=1;if(G.keys.ArrowLeft||G.keys.a)jx=-1;if(G.keys.ArrowRight||G.keys.d)jx=1;
  const mag=Math.min(1,Math.hypot(jx,jy));
  if(act&&mag>.15){const want=Math.atan2(-jy,jx)+B.ca;let da=want-c.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));const back=Math.abs(da)>2.4;
    if(back)da=Math.atan2(Math.sin(da+Math.PI),Math.cos(da+Math.PI));c.yaw+=Math.max(-c.turn*dt,Math.min(c.turn*dt,da));const tv=(back?-.7:1)*c.spd*mag*Math.max(.2,Math.cos(Math.min(1.4,Math.abs(da))));c.v+=(tv-c.v)*Math.min(1,dt*5)}
  else c.v*=Math.pow(act?.02:.15,dt);
  if(G.dash>0){G.dash-=dt;if(act)c.v=G.dashSd==="b"?Math.min(c.v,-c.spd*1.8):Math.max(c.v,c.spd*1.8)}
  G.fireT+=dt;G.fireB+=dt;
  const fx=Math.cos(c.yaw),fz=-Math.sin(c.yaw);
  if(c.out&&c.out!=="ko")rwFallStep(c,dt);
  else{rwSlide(c,dt,ed);c.x+=(c.mx+c.kx)*dt;c.z+=(c.mz+c.kz)*dt;const kd=Math.pow(c.y>.05?.7:.05,dt);c.kx*=kd;c.kz*=kd;
    if(c.y>0||c.vy>0){c.vy-=15*dt;c.y+=c.vy*dt;c.rz+=c.rzv*dt;if(c.y<=0){c.y=0;if(c.vy<-4){c.vy=-c.vy*.25;sfx("hit");rwSparks(c.x,.1,c.z,8)}else c.vy=0;c.rzv*=.3}}
    else{c.rz=Math.atan2(Math.sin(c.rz),Math.cos(c.rz));const t=Math.abs(c.rz)>Math.PI/2?Math.sign(c.rz||1)*Math.PI:0;c.rz+=(t-c.rz)*Math.min(1,dt*6);c.rzv=0;
      if(Math.cos(c.rz)<0&&!c.out){if(!c.down)rwMsg("FLIPPED! 🙃");c.down+=dt;if(c.down>(ed?1.4:2.2)){c.down=0;c.vy=4.5;c.y=.01;c.rzv=-Math.sign(c.rz||1)*Math.PI/.6;sfx("b_swish");rwMsg("SELF-RIGHT!")}}else c.down=0}
    const fall=c.out?"":rwBounds(c,ed);if(fall&&B.go&&!B.end){c.out=fall;c.vy=0;rwMsg(RW_FALL[fall]);sfx("lose");rwLiveSend(2);setTimeout(()=>rwBEnd("lose",fall),1400)}}
  /* bumping into the other car: each phone moves its own car; the heavier, pushier car moves less */
  if(!c.out&&!F.out&&c.y<.4&&F.y<.4){const dx=F.x-c.x,dz=F.z-c.z,d=Math.hypot(dx,dz)||1e-3,ov=c.r+F.r-d;
    if(ov>0){const nx=dx/d,nz=dz/d,mp=c.kg*(1+c.push*.2),fp=F.kg*(1+F.push*.2),sh=fp/(mp+fp);c.x-=nx*ov*sh;c.z-=nz*ov*sh;const into=(fx*c.v)*nx+(fz*c.v)*nz;if(into>0)c.v*=1-sh*.6;
      const kin=c.kx*nx+c.kz*nz;if(kin>0){c.kx-=nx*kin;c.kz-=nz*kin}
      if(act&&into>2.2&&G.t-B.ram>.8&&!c.out){B.ram=G.t;rwLand({d:Math.round(2+into),ix:nx*into*.9*(1-sh+.3),iz:nz*into*.9*(1-sh+.3),up:0,sp:0,k:"ram"},F.x,.4,F.z,"BASH!")}}}
  /* my weapons on the other car */
  if(act&&!F.out&&F.net&&c.y<.1){const cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),f0=G.fireT,f1=G.fireB;
    M.weps.forEach((wp,wi)=>{const f=wp.sd==="b"?f1:f0,k=wp.k,sz=wp.s||1,reach=(RW_REACH[k]||.4)*sz*1.15,lx=wp.p[0]+wp.n[0]*reach,lz=wp.p[2]+wp.n[2]*reach,ly=wp.p[1]+M.dy+wp.n[1]*reach,
        wx=c.x+lx*cy+lz*sy,wz=c.z-lx*sy+lz*cy,ux=wp.n[0]*cy+wp.n[2]*sy,uz=-wp.n[0]*sy+wp.n[2]*cy,hl=Math.hypot(ux,uz)||1,ex=F.x-wx,ez=F.z-wz,edd=Math.hypot(ex,ez)||1e-3;
      if(k==="flame"){if(f>1.2)return;const bx=c.x+wp.p[0]*cy+wp.p[2]*sy,bz=c.z-wp.p[0]*sy+wp.p[2]*cy,vx=F.x-bx,vz=F.z-bz,vd=Math.hypot(vx,vz)||1e-3;
        if(vd<reach+F.r&&(vx*ux+vz*uz)/(vd*hl)>.8&&F.y<1.2){const ck="f"+wi;if((B.cool[ck]||0)>G.t)return;B.cool[ck]=G.t+.3;rwLand({d:2+Math.round(sz),ix:ux/hl*.4,iz:uz/hl*.4,up:0,sp:0,k:"flame",fl:1},F.x,.5,F.z,B.t-(B.burnMsg||0)>2?["🔥 TOASTED!","🔥 ON FIRE!","🔥 SIZZLE!"][Math.random()*3|0]:"",1);if(B.t-(B.burnMsg||0)>2)B.burnMsg=B.t}return}
      if(edd>F.r+.4*sz||ly>1.5*sz||F.y>.9)return;if((B.cool[wi]||0)>G.t)return;const one=k==="flip"||k==="axe"||k==="crush"||k==="wedge";if(one&&B.shot[wi]===B.fc[wp.sd])return;let hit=null,dir=[ux/hl,uz/hl];
      if(k==="flip"&&f<.25)hit=[2.5,5+c.pow*.8,9];else if(k==="axe"&&f>.12&&f<.3)hit=[1,2.5,4];else if(k==="crush"&&f>.1&&f<.3)hit=[.6,1.2,3];else if(k==="wedge"&&G.dash>0&&G.dashSd===wp.sd)hit=[4,2.2,3];
      else if(k==="spin"||k==="drum"){const up=f<1.5?1.6:1;hit=k==="spin"?[4*up,2*up,8]:[2.5*up,4*up,9];if(k==="spin")dir=[-dir[1],dir[0]]}
      else if(k==="spike"&&(wp.sd==="b"?c.v<-1.5:c.v>1.5))hit=[3,.6,3];
      else if(k==="saw"){const up=f<1.5?1.5:1;hit=[1.6*up,2.4*up,6]}
      if(!hit)return;if(one)B.shot[wi]=B.fc[wp.sd];const m=.7+.3*sz;hit=hit.map(v=>v*m);B.cool[wi]=G.t+(k==="spin"||k==="drum"||k==="spike"||k==="saw"?.6:.5);
      const dmg=Math.round((RW_DMG[k]||5)*m*(.8+c.pow*.1)*(k==="spin"||k==="drum"||k==="saw"?(f<1.5?1.3:1):1)),sp=(k==="flip"?1:.35)*hit[2]*(Math.random()<.5?-1:1)*(k==="flip"?.6:.25);
      rwLand({d:dmg,ix:dir[0]*hit[0]+ex/edd*.8,iz:dir[1]*hit[0]+ez/edd*.8,up:hit[1],sp,k},wx,Math.max(.3,ly),wz,hit[1]>4?["FLIPPED!","SMASH!","WHAM!","KER-RUNCH!"][Math.random()*4|0]:dmg>=10?["CRUNCH!","SMASH!","BOOM!"][Math.random()*3|0]:"")})}
  /* the car's position and tilt (it turns end over end around its middle when flipped) */
  rwPose(M,c.x,c.y,c.z,c.yaw,c.rz)}
function rwPose(M,x,y,z,yaw,rz){const h=(M.ht||.8)/2,s=Math.sin(rz),k=1-Math.cos(rz);M.g.position.set(x+h*s*Math.cos(yaw),y+h*k,z-h*s*Math.sin(yaw));M.g.rotation.set(0,yaw,rz)}
/* I landed a hit: tell the other phone, and show it here straight away */
function rwLand(e,x,y,z,msg,quiet){const G=RWG,B=G.B,F=B.foe;e.n=++B.seq;B.ev.push(e);if(B.ev.length>8)B.ev.shift();
  if(!quiet){sfx(e.k==="crush"||e.k==="ram"?"hit":"b_clang");rwSparks(x,y,z,e.k==="ram"?8:14)}if(msg)rwMsg(msg);
  if(e.k!=="flame"){const km=60/Math.max(40,F.kg);F.pred=.55;F.pkx=e.ix*km;F.pkz=e.iz*km;F.pvy=e.up*km;F.prz=e.sp;}
  F.hp=Math.max(0,F.hp-e.d*(rwEdge()?1.15:.75)*(F.hpM>1?1:0));rwLiveSend(1)}
/* the other phone landed a hit on me */
function rwTakeHit(e){const G=RWG,B=G.B,c=G.car,ed=rwEdge();if(!c||c.out||B.end||B.fin)return;const dm=ed?.75:1.15,km=60/Math.max(40,c.kg)*(ed?.8:1);
  c.hp=Math.max(0,c.hp-e.d*dm);c.kx+=(e.ix||0)*km;c.kz+=(e.iz||0)*km;if(e.up>0){c.vy=Math.max(c.vy,e.up*km);c.y=Math.max(c.y,.01);c.rzv+=(e.sp||0)}
  if(e.fl)c.burn=.5;else{sfx(e.k==="crush"||e.k==="ram"?"hit":"b_clang");rwSparks(c.x,.5,c.z,10);if(navigator.vibrate)try{navigator.vibrate(e.d>=10?60:25)}catch(_){}}
  rwKoCheck()}
function rwKoCheck(){const G=RWG,B=G.B,c=G.car;if(c.hp<=0&&!c.out&&!B.end){c.out="ko";c.hp=0;rwMsg("KNOCKED OUT! 💥");sfx("b_boom");rwLiveSend(2);setTimeout(()=>rwBEnd("lose","ko"),1400)}}
/* the other car, as the network last saw it: glide towards it, guessing ahead a little */
function rwOnPos(d){const G=RWG,B=G&&G.B;if(!G||G.mode!=="battle"||!B||d.id!==B.id)return;const F=B.foe;F.last=Date.now();F.net=d;
  for(const e of d.ev||[])if(e.n>B.evDone){B.evDone=e.n;rwTakeHit(e)}
  if((d.f||0)>F.fc.f){F.fc.f=d.f;F.fT=0}if((d.b||0)>F.fc.b){F.fc.b=d.b;F.fB=0}
  F.hp=d.hp;F.hpM=d.hm||1;F.burn=d.br;if(d.fin){F.fin=1}
  if(d.out&&!F.out){F.out=d.out;if(!B.end){rwMsg(RW_FALL[d.out]||"KNOCKED OUT! 💥");sfx("b_boom");setTimeout(()=>rwBEnd("win",d.out),1400)}}
  if(d.q&&!B.end)rwBEnd("win","left")}
function rwFoeStep(dt){const G=RWG,B=G.B,F=B.foe,n=F.net;if(!n){rwPose(F.M,F.x,0,F.z,F.yaw,0);return}
  if(F.pred>0){F.pred-=dt;F.x+=F.pkx*dt;F.z+=F.pkz*dt;F.pkx*=Math.pow(.05,dt);F.pkz*=Math.pow(.05,dt);if(F.y>0||F.pvy>0){F.pvy-=15*dt;F.y=Math.max(0,F.y+F.pvy*dt);F.rz+=F.prz*dt;if(F.y<=0)F.pvy=0}}
  else{const age=Math.min(.3,(Date.now()-F.last)/1000),tx=n.x+(n.vx||0)*age,tz=n.z+(n.vz||0)*age,k=1-Math.exp(-dt*9);
    F.x+=(tx-F.x)*k;F.z+=(tz-F.z)*k;F.y+=(n.y-F.y)*k;let da=n.yw-F.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));F.yaw+=da*k;let dr=n.rz-F.rz;dr=Math.atan2(Math.sin(dr),Math.cos(dr));F.rz+=dr*k;
    if(Math.hypot(tx-F.x,tz-F.z)>4){F.x=tx;F.z=tz}}
  F.spd=Math.hypot(n.vx||0,n.vz||0)*(Math.cos(F.yaw)*(n.vx||0)-Math.sin(F.yaw)*(n.vz||0)<0?-1:1);
  rwPose(F.M,F.x,F.y,F.z,F.yaw,F.rz);
  if(F.burn&&Math.random()<.7)rwFlame(new THREE.Vector3(F.x+(Math.random()-.5)*.5,F.y+.7,F.z+(Math.random()-.5)*.5),new THREE.Vector3(0,1,0),.6,1.4);
  if(F.out==="ko"&&Math.random()<.5)rwFlame(new THREE.Vector3(F.x,.9,F.z),new THREE.Vector3(0,1,0),.5,1.2)}
/* fire vents, hammer guards and crushers (each phone works them out for its own car; in test drives they knock you about but don't hurt) */
function rwHazards(dt){const G=RWG,c=G.car,H=G.hz;if(!H||!c||!RWR.vents)return;const bat=G.mode==="battle"&&G.B,B=G.B,F=bat?B.foe:null,ed=bat?rwEdge():false,t=bat?B.t:G.t-H.t0,
    live=bat?(B.go&&!B.end&&!B.fin&&!c.out):!c.out,hurt=n=>{if(bat){c.hp-=n;rwKoCheck()}};
  const mg=RWR.mg&&RWR.mg[G.map];if(mg&&mg.userData.lava)mg.userData.lava.offset.x=(G.t*.05)%1;if(mg&&mg.userData.water)mg.userData.water.offset.x=(G.t*.02)%1;
  RWR.vents.forEach((v,i)=>{const p=t>3?((t+i*3.5)%7+7)%7:0,warn=p>4.8&&p<5.8,fire=p>=5.8;v.m.emissiveIntensity=fire?1.4:warn?.35+.35*Math.sin(t*20):0;
    if(fire){for(let j=0;j<2;j++)rwFlame(new THREE.Vector3(v.x+(Math.random()-.5)*1.2,.1,v.z+(Math.random()-.5)*1.2),new THREE.Vector3(0,1,0),1.1,1)
      if(live&&c.y<1&&Math.hypot(c.x-v.x,c.z-v.z)<1.15){hurt(dt*9*(ed?.75:1));c.burn=.4;if(H.vent[i]<t-1.5){H.vent[i]=t;rwMsg("🔥 BURNED!");sfx("b_boom")}}}});
  if(c.burn>0){c.burn-=dt;if(Math.random()<.7)rwFlame(new THREE.Vector3(c.x+(Math.random()-.5)*.5,c.y+.7,c.z+(Math.random()-.5)*.5),new THREE.Vector3(0,1,0),.6,1.4)}
  if(c.out==="ko"&&Math.random()<.5)rwFlame(new THREE.Vector3(c.x,.9,c.z),new THREE.Vector3(0,1,0),.5,1.2);
  RWR.guards.forEach((gd,i)=>{const s=H.guard[i],zh=gd.zh||2.5,inZ=(x,z)=>Math.abs(x-gd.gx)<zh&&Math.abs(z-gd.gz)<zh,mine=live&&inZ(c.x,c.z)&&c.y<.5,them=F&&!F.out&&inZ(F.x,F.z);
    s.cd-=dt;s.sw+=dt;s.vis-=dt;
    if(mine){s.t+=dt;if(s.t>.45&&s.cd<=0){s.cd=1.7;s.sw=0;s.hit=1}}else s.t=0;
    if(them&&!mine&&s.vis<=0&&s.sw>1.7){s.vis=1.9;s.sw=0}
    if(s.hit&&s.sw>.18){s.hit=0;if(inZ(c.x,c.z)&&!c.out){const l=Math.hypot(gd.gx,gd.gz)||1,km=60/Math.max(40,c.kg||60)*(ed?.8:1);hurt(10*(ed?.75:1));c.kx+=-gd.gx/l*7*km;c.kz+=-gd.gz/l*7*km;c.vy=3.5*km;c.y=.01;c.rzv=(c.rzv||0)+(Math.random()-.5)*3;
      sfx("b_boom");rwSparks(c.x,.4,c.z,16);rwMsg(gd.kind==="press"?"💥 CRUNCH!":"🔨 WHAM!");if(navigator.vibrate)try{navigator.vibrate(80)}catch(_){}}}
    const w=s.sw;if(gd.kind==="press")gd.arm.position.y=w<.18?2.6-(w/.18)*2.2:w<.6?.4:w<1.3?.4+((w-.6)/.7)*2.2:2.6;
    else gd.arm.rotation.z=w<.18?1.1-(w/.18)*1.55:w<.6?-.45:w<1.3?-.45+((w-.6)/.7)*1.55:1.1})}
/* send my car a few times a second (straight away after a hit or a weapon) */
function rwLiveSend(force){const G=RWG,B=G&&G.B;if(!B||!G.car)return;const now=performance.now();if(B.end&&force!==2&&!B.q)return;
  if(force!==2){if(!force&&now-B.ls<180)return;if(force&&now-B.ls<90){B.pend=1;return}}B.ls=now;B.pend=0;
  const c=G.car,fx=Math.cos(c.yaw),fz=-Math.sin(c.yaw),r=v=>Math.round(v*100)/100;
  B.pk=(B.pk||0)+1;db.doc("games/rwp_"+me()).set({id:B.id,k:B.pk,x:r(c.x),z:r(c.z),y:r(c.y),yw:r(c.yaw),rz:r(c.rz),vx:r((c.mx==null?fx*c.v:c.mx)+c.kx),vz:r((c.mz==null?fz*c.v:c.mz)+c.kz),hp:Math.max(0,Math.round(c.hp)),hm:c.hpM,f:B.fc.f,b:B.fc.b,ev:B.ev,out:c.out||0,fin:B.fin?1:0,br:c.burn>0?1:0,q:B.q?1:0}).catch(er)}
/* ---------- the end ---------- */
function rwBEnd(res,why){const G=RWG,B=G&&G.B;if(!B||B.end||G.mode!=="battle")return;B.end={res,why};const S=rwLoad();S.liveDone=B.id;rwSave();rwControls(0);rwLiveSend(2);
  if(res==="win"){sfx("win");const w=RWD.win||{};db.doc("games/rwwin").update({[me()]:(w[me()]||0)+1}).catch(er)}else if(res==="lose")sfx("lose");
  setTimeout(rwBResult,res==="none"?200:1300)}
function rwBResult(){const G=RWG,B=G&&G.B;if(!B||!B.end||G.mode!=="battle")return;const th=rwNm(rwThem()),{res,why}=B.end,win=res==="win";
  const say=res==="none"?`Lost touch with ${th}'s phone.`:why==="left"?`${th} left the battle.`:why==="time"?(win?"Time's up — your car had more left!":`Time's up — ${th}'s car had more left.`)
    :RW_FALLSAY[why]?(win?`${th}'s car ${RW_FALLSAY[why]}!`:`Your car ${RW_FALLSAY[why]}!`):(win?`${th}'s car was knocked out!`:"Your car was knocked out!");
  let h=$("#rwres");if(h)h.remove();h=document.createElement("div");h.id="rwres";h.className="rwres";
  h.innerHTML=`<div class="rwcard"><div class="rwbig2">${res==="none"?"📡":win?"🏆":"💥"}</div><div class="rwname" style="text-align:center">${res==="none"?"BATTLE OVER":win?"YOU WIN!":th.toUpperCase()+" WINS!"}</div><p class="rwsay" style="text-align:center">${say}</p>
    <div class="rwsoon">${rwTally()}</div><div class="rwbtns"><button class="b" id="rwrg">🏠 GARAGE</button><button class="b y rwbig" id="rwrm">⚔️ REMATCH</button></div></div>`;
  $("#rwc").appendChild(h);$("#rwrg").onclick=()=>{sfx("tap");h.remove();G.mode="garage";rwGarage()};$("#rwrm").onclick=()=>{h.remove();G.mode="garage";rwGarage();rwLiveAsk()}}
