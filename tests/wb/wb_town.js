/* ===================== BOOM TOWN: whole villages, towns and cities =====================
   Each place is made of buildings (cottages, shops, churches, flats, skyscrapers…) put down round the field.
   Every block knows which building it belongs to (bld), so the game can count how many buildings are down.
   Trees and haystacks are "props" (bld -1): they fall and drop coins but don't count. */
function wbTownMaker(){const B=[],blds=[],decor=[];let cur=-1,OX=0,OZ=0,RA=0,CS=1,SN=0,COL=null;
  const add=(t,x,y,z,w,h,d,ry)=>{const X=x*CS+z*SN,Z=-x*SN+z*CS;const o={t,x:+(X+OX).toFixed(3),y:+y.toFixed(3),z:+(Z+OZ).toFixed(3),w,h,d,ry:(ry||0)+RA,bld:cur};if(COL!=null)o.col=COL;B.push(o)};
  /* walls, log-cabin style: on even rows the front and back walls run the full width, on odd rows the side walls run the full depth, so the corners
     lock together; each wall is cut into pieces about "seg" long, with the joins moved along on every other row like real brickwork.
     door = how many rows have a doorway in the front wall (the row above is a lintel that spans it) */
  const span=(t,a0,a1,y,bh,bt,fixed,alongX,r,cuts)=>{const L=a1-a0;if(L<.05)return;const n=Math.max(1,Math.round(L/1.5)),seg=L/n,pts=[a0];
      if(cuts){for(const c of cuts)if(c>a0+.2&&c<a1-.2)pts.push(c)}else if(r%2&&n>1){pts.push(a0+seg/2);for(let k=1;k<n;k++)pts.push(a0+seg/2+k*seg)}else for(let k=1;k<n;k++)pts.push(a0+k*seg);pts.push(a1);pts.sort((p,q)=>p-q);
      for(let k=0;k<pts.length-1;k++){const m=(pts[k]+pts[k+1])/2,l=pts[k+1]-pts[k]-.02;if(l<.15)continue;if(alongX)add(t,m,y,fixed,l,bh,bt);else add(t,fixed,y,m,bt,bh,l)}};
  const ring=(t,W,Dp,rows,bw,bh,bt,y0=0,door=0)=>{const dw=.45;for(let r=0;r<rows;r++){const y=y0+bh*(r+.5),fb=r%2===0,xa=fb?-W/2:-W/2+bt,xb=-xa,za=fb?-Dp/2+bt:-Dp/2,zb=-za;
      if(door&&r<door){span(t,xa,-dw,y,bh,bt,-Dp/2+bt/2,1,r);span(t,dw,xb,y,bh,bt,-Dp/2+bt/2,1,r)}else if(door&&r===door)span(t,xa,xb,y,bh,bt,-Dp/2+bt/2,1,r,[-dw-.6,dw+.6]);else span(t,xa,xb,y,bh,bt,-Dp/2+bt/2,1,r);
      span(t,xa,xb,y,bh,bt,Dp/2-bt/2,1,r);span(t,za,zb,y,bh,bt,-W/2+bt/2,0,r);span(t,za,zb,y,bh,bt,W/2-bt/2,0,r)}return y0+rows*bh};
  const roof=(t,W,Dp,y0,steps,sh,inset)=>{let y=y0;for(let s=0;s<steps;s++){const w=W-s*inset*2;if(w<.4)break;add(t,0,y+sh/2,0,w,sh,Dp);y+=sh}return y};
  const at=(x,z,a,f,prop)=>{OX=x;OZ=z;RA=a||0;CS=Math.cos(RA);SN=Math.sin(RA);if(prop)cur=-1;else{cur=blds.length;blds.push({x,z})}f();OX=OZ=RA=SN=0;CS=1;cur=-1};
  /* ---- the buildings ---- */
  const L={
    cottage:(m="wood",r="roof",W=3,Dp=2.6,rows=3)=>{const t=ring(m,W,Dp,rows,1.5,.7,.45,0,1);add("plank",0,t+.06,0,W+.1,.12,Dp+.1);roof(r,W+.3,Dp+.3,t+.12,3,.4,W/7)},
    hut:()=>{const t=ring("straw",2.6,2.2,2,1.3,.7,.5,0,1);roof("straw",3,2.6,t,3,.35,.4)},
    shop:(m="brick")=>{const t=ring(m,3.4,3,2,1.7,.8,.45,0,1);add("glass",0,.9,-1.6,1.4,1,.1);add("plank",0,t+.06,0,3.5,.12,3.1);const t2=ring("wood",3.4,3,2,1.7,.7,.4,t+.12);roof("roof",3.7,3.3,t2,3,.35,.5)},
    terrace:(n=3,m="brick")=>{for(let i=0;i<n;i++){const x=(i-(n-1)/2)*3.1;OXs(x,()=>{const t=ring(i%2?m:"brick",3,2.8,4,1.5,.65,.45,0,1);add("plank",0,t+.06,0,3.04,.12,2.85);roof(i%3==1?"slate":"roof",3.04,3,t+.12,3,.4,.45)})}},
    barn:()=>{const t=ring("wood",4.6,3.4,3,1.5,.9,.45,0,2);add("plank",0,t+.07,0,4.7,.14,3.5);roof("roof",5,3.8,t+.14,4,.45,.55)},
    church:()=>{const t=ring("stone",3.6,6,4,1.5,.8,.5,0,2);add("slate",0,t+.07,0,3.7,.14,6.1);roof("slate",3.9,6.3,t+.14,3,.45,.5);
      let y=0;for(let r=0;r<8;r++){add("stone",0,y+.5,-4.05,1.7,1,1.7);y+=1}add("gold",0,y+.3,-4.05,.9,.6,.9);y+=.6;for(const [s,h] of [[1.4,.6],[.9,.7],[.5,.8],[.22,.7]]){add("slate",0,y+h/2,-4.05,s,h,s);y+=h}},
    clock:()=>{let y=0;for(let r=0;r<9;r++){add(r===7?"gold":"stone",0,y+.55,0,1.8,1.1,1.8);y+=1.1}add("slate",0,y+.25,0,2.1,.5,2.1);y+=.5;add("roof",0,y+.4,0,1.3,.8,1.3);add("roof",0,y+1.1,0,.6,.6,.6)},
    well:()=>{for(const [x,z] of [[-.5,0],[.5,0],[0,-.5],[0,.5]])add("stone",x,.35,z,x?.3:.7,.7,z?.3:.7);for(const x of [-.5,.5])add("trunk",x,1.1,0,.2,.8,.2);add("roof",0,1.6,0,1.6,.2,1.2)},
    windmill:()=>{let y=0,w=2.4;for(let r=0;r<7;r++){add("stone",0,y+.5,0,w,1,w);y+=1;w-=.18}add("roof",0,y+.35,0,w+.4,.7,w+.4);add("roof",0,y+.95,0,w-.3,.5,w-.3)},
    water:()=>{for(const [x,z] of [[-.95,-.95],[.95,-.95],[-.95,.95],[.95,.95]])add("trunk",x,2.4,z,.5,4.8,.5);add("plank",0,4.9,0,2.6,.2,2.6);add("ice",0,5.8,0,2.2,1.6,2.2);add("roof",0,6.85,0,2.4,.5,2.4)},
    factory:()=>{const t=ring("brick",6,4,3,1.5,.8,.5,0,2);add("slate",0,t+.08,0,6.1,.16,4.1);roof("slate",6.2,4.2,t+.16,2,.4,.8);let y=0;for(let r=0;r<9;r++){add("brick",3.65,y+.55,1,1,1.1,1);y+=1.1}},
    flats:(fl=4,W=4,Dp=3.2)=>{let y=0;for(let f=0;f<fl;f++){for(const [x,z] of [[-W/2+.3,-Dp/2+.3],[W/2-.3,-Dp/2+.3],[-W/2+.3,Dp/2-.3],[W/2-.3,Dp/2-.3]])add("stone",x,y+.6,z,.6,1.2,.6);
        add("glass",0,y+.6,-Dp/2+.3,W-1.25,1.17,.3);add("glass",0,y+.6,Dp/2-.3,W-1.25,1.17,.3);add("slate",0,y+1.3,0,W+.1,.2,Dp+.1);y+=1.4}add("roof",0,y+.25,0,W-1,.5,Dp-1)},
    tower:(fl=10,W=3.2,top="gold")=>{let y=0;for(let f=0;f<fl;f++){for(const [x,z] of [[-W/2+.3,-W/2+.3],[W/2-.3,-W/2+.3],[-W/2+.3,W/2-.3],[W/2-.3,W/2-.3]])add("stone",x,y+.65,z,.6,1.3,.6);
        add("glass",0,y+.65,-W/2+.3,W-1.22,1.27,.3);add("glass",0,y+.65,W/2-.3,W-1.22,1.27,.3);add("glass",-W/2+.3,y+.65,0,.3,1.27,W-1.82);add("glass",W/2-.3,y+.65,0,.3,1.27,W-1.82);add("slate",0,y+1.4,0,W+.1,.2,W+.1);y+=1.5}
      add(top,0,y+.4,0,W*.5,.8,W*.5);add(top,0,y+1.25,0,.45,.9,.45)},
    ginger:()=>{const t=ring("ginger",3,2.6,3,1.5,.7,.45,0,1);roof("icing",3.4,3,t,3,.35,.45);add("candy",-1.9,.6,-1.5,.35,1.2,.35);add("candy",1.9,.6,-1.5,.35,1.2,.35)},
    jellytower:(n=4)=>{for(let r=0;r<n;r++)add("jelly",0,.5+r*1.02,0,1,1,1);add("candy",0,n*1.02+.3,0,.6,.6,.6)},
    lighthouse:()=>{let y=0;for(let r=0;r<10;r++){add(r%3<2?"brick":"icing",0,y+.5,0,2.2,1,2.2);y+=1}add("slate",0,y+.1,0,2.8,.2,2.8);y+=.2;add("gold",0,y+.45,0,.8,.9,.8);for(const [x,z] of [[-.65,-.65],[.65,-.65],[-.65,.65],[.65,.65]])add("glass",x,y+.45,z,.22,.9,.22);y-=.05;add("roof",0,y+1.25,0,2,.5,2);add("roof",0,y+1.75,0,1.1,.5,1.1)},
    igloo:(fw=.9,dp=.6)=>{const rows=[[1.7,11],[1.64,10],[1.55,9],[1.43,8],[1.28,7]];let y=.2;rows.forEach(([r,n],ri)=>{for(let i=0;i<n;i++){const a=(i+(ri%2)*.5)/n*Math.PI*2;if(ri<2&&Math.cos(a)<-.85)continue;add("snow",Math.sin(a)*r,y,Math.cos(a)*r,2*Math.PI*r/n*fw,.4,dp,a)}y+=.4});add("snow",0,y+.15,0,2.3,.3,2.3);add("snow",0,y+.5,0,1.4,.4,1.4)},
    castle:()=>{const t=ring("stone",6,5,3,1.5,.8,.6,0,2);for(const [x,z] of [[-3.7,-3.2],[3.7,-3.2],[-3.7,3.2],[3.7,3.2]]){for(let r=0;r<5;r++)add("stone",x,.45+r*.9,z,1.3,.9,1.3);add("roof",x,4.75,z,1.5,.5,1.5)}
      let y=ring("stone",2.4,2.4,3,1.2,.8,.45,0);add("slate",0,y+.1,0,2.6,.2,2.6);roof("roof",2.7,2.7,y+.2,3,.4,.4)},
    haunted:()=>{let y=ring("haunt",4.4,3.6,4,1.47,.7,.5,0,2);add("slate",0,y+.1,0,4.5,.2,3.7);y=ring("haunt",3.6,3,3,1.2,.7,.45,y+.2);roof("slate",4,3.4,y,4,.4,.5)},
    grave:()=>{add("stone",0,.45,0,.6,.9,.2)},
    tree:(s=1)=>{add("trunk",0,.9*s,0,.4*s,1.8*s,.4*s);add("leaf",0,2.4*s,0,1.6*s,1.2*s,1.6*s);add("leaf",0,3.36*s,0,1*s,.7*s,1*s)},
    hay:()=>{add("straw",0,.4,0,1.2,.8,.8);add("straw",0,1.2,0,1.2,.8,.8)}};
  const OXs=(dx,f)=>{const ox=OX,oz=OZ,X=dx*CS,Z=-dx*SN;OX+=X;OZ+=Z;f();OX=ox;OZ=oz};
  /* ---- city buildings: each floor is two big blocks (turned the other way on the next floor, so they lock together) ---- */
  /* a floor is one big block: knock one out and the floors above come crashing down onto the ones below */const floorPair=(t,y,h,W,D,f)=>add(t,0,y+h/2,0,W,h,D);
  const withCol=(c,f)=>{const o=COL;COL=c;f();COL=o};
  Object.assign(L,{
    office:(fl=12,W=4,D=4,col=0x8fc3ff,set=0)=>withCol(col,()=>{let y=0,w=W,d=D;for(let f=0;f<fl;f++){if(set&&f===Math.round(fl*set)){add("slate",0,y+.1,0,w+.2,.2,d+.2);y+=.2;w*=.72;d*=.72}floorPair("office",y,1.25,w,d,f);y+=1.25}
      COL=null;add("slate",0,y+.12,0,w+.2,.24,d+.2);add("metal",0,y+.24+.5,0,w*.4,1,d*.4);add("metal",0,y+1.24+.35,0,w*.18,.7,d*.18)}),
    apart:(fl=6,W=4.4,D=3.6,col=0xe8c9a6)=>withCol(col,()=>{let y=0;for(let f=0;f<fl;f++){floorPair("apart",y,1.1,W,D,f);y+=1.1}COL=null;add("slate",0,y+.1,0,W+.2,.2,D+.2);add("roof",-W/4,y+.45,0,1,.5,1)}),
    shops:(n=3,cols=[0xff7a7a,0x7ad0ff,0xffd27a,0x9be37a])=>{for(let i=0;i<n;i++){const z=(i-(n-1)/2)*3.3;withCol(cols[i%cols.length],()=>add("shopf",0,.8,z,3,1.6,3.2));withCol(0xf2e3cf,()=>add("apart",0,2.15,z,3,1.1,3.2))}add("slate",0,2.8,0,3.2,.2,n*3.3)},
    car:(col=0xff4040)=>withCol(col,()=>{add("car",0,.42,0,1.7,.6,3.6);add("car",0,.97,-.2,1.5,.5,1.8)}),
    bus:()=>withCol(0xffcc22,()=>add("car",0,1.1,0,2.3,1.9,8)),
    lamp:()=>{add("metal",0,1.6,0,.22,3.2,.22);add("gold",0,3.33,0,.6,.26,.6)},
    fountain:()=>{for(const [x,z,w,d] of [[-1.1,0,.4,2.6],[1.1,0,.4,2.6],[0,-1.1,1.8,.4],[0,1.1,1.8,.4]])add("stone",x,.3,z,w,.6,d);add("ice",0,.25,0,1.8,.5,1.8);add("stone",0,.9,0,.6,.8,.6)},
    stadium:()=>withCol(0xdedede,()=>{const R=7,n=20;for(let r=0;r<3;r++){const rr=R-r*.5;for(let i=0;i<n;i++){const a=(i+(r%2)*.5)/n*Math.PI*2;add("apart",Math.sin(a)*rr,.45+r*.9,Math.cos(a)*rr,2*Math.PI*rr/n*.9,.9,1.4,a)}}})});
  /* flat things on the ground (roads, pavements, parks): just pictures, nothing to knock over */
  const road=(x,z,w,d,ry=0)=>decor.push({k:"road",x,z,w,d,ry}),walk=(x,z,w,d)=>decor.push({k:"walk",x,z,w,d}),park=(x,z,w,d)=>decor.push({k:"park",x,z,w,d}),pave=(x,z,w,d)=>decor.push({k:"pave",x,z,w,d}),zebra=(x,z,w,ry=0)=>decor.push({k:"zebra",x,z,w,d:2.4,ry});
  return{B,blds,decor,L,at,road,walk,park,pave,zebra,lamp:(x,z)=>decor.push({k:"lamp",x,z})}}

/* ---- the places ---- */
const WB_TOWNS={
  farm(T){const {L,at}=T;at(-7,22,.3,()=>L.barn());at(6.5,20,-.2,()=>L.windmill());at(-1,30,0,()=>L.cottage("straw","straw"));at(-8,33,.2,()=>L.hut());at(7,31,-.3,()=>L.cottage("wood"));at(1.5,18,0,()=>L.well());
    for(const [x,z] of [[-3,15],[3.5,14.5],[-11,28]])at(x,z,0,()=>L.hay(),1);for(const [x,z,s] of [[-13,18,1],[12,25,1.2],[13,36,1],[-14,38,1.3],[0,38,1.1]])at(x,z,0,()=>L.tree(s),1)},
  village(T){const {L,at}=T;at(0,34,0,()=>L.church());at(-7,20,.25,()=>L.cottage("wood"));at(7,20,-.25,()=>L.cottage("brick","slate"));at(-10,28,.4,()=>L.cottage("straw","straw"));at(10,28,-.4,()=>L.cottage("brick"));
    at(-6,40,.2,()=>L.cottage("wood","slate"));at(7,41,-.2,()=>L.shop());at(0,22,0,()=>L.well());for(const [x,z,s] of [[-3.5,27,1],[3.5,27,.9],[-14,36,1.3],[14,35,1.2],[-12,15,1]])at(x,z,0,()=>L.tree(s),1)},
  seaside(T){const {L,at}=T;at(10,42,0,()=>L.lighthouse());at(-9,20,.2,()=>L.cottage("wood","roof",3,2.6,3));at(-2.5,21,0,()=>L.cottage("ice","slate",3,2.6,3));at(4,20,-.15,()=>L.cottage("candy","roof",3,2.6,3));
    at(-6,32,0,()=>L.terrace(3,"wood"));at(3,33,0,()=>L.shop("brick"));at(-12,40,.3,()=>L.flats(3));at(0,44,0,()=>L.factory());at(13,24,-.4,()=>L.hut());for(const [x,z] of [[-14,28],[12,32]])at(x,z,0,()=>L.tree(1),1)},
  market(T){const {L,at,road,walk}=T;road(0,25,4,26);walk(-2.6,25,1.2,26);walk(2.6,25,1.2,26);at(0,40,0,()=>L.clock());at(-6.5,22,0,()=>L.terrace(3,"brick"));at(6.5,22,0,()=>L.terrace(3,"wood"));at(-7,31,0,()=>L.shop("brick"));at(-3,31,0,()=>L.shop("stone"));at(3,31,0,()=>L.shop("wood"));at(7,31,0,()=>L.shop("brick"));
    at(-9,44,.15,()=>L.church());at(9,44,-.15,()=>L.flats(4));at(-14,34,.4,()=>L.cottage("wood"));at(14,34,-.4,()=>L.cottage("brick","slate"));at(4.5,14.5,0,()=>L.well());for(const [x,z] of [[-15,22],[15,23],[-4,48],[4.5,49]])at(x,z,0,()=>L.tree(1.1),1)},
  candy(T){const {L,at}=T;at(-6,20,.2,()=>L.ginger());at(0,22,0,()=>L.ginger());at(6,20,-.2,()=>L.ginger());at(-9,30,.3,()=>L.jellytower(5));at(-3,32,0,()=>L.jellytower(3));at(3,32,0,()=>L.jellytower(4));at(9,30,-.3,()=>L.jellytower(6));
    at(-5,40,0,()=>L.ginger());at(5,40,0,()=>L.ginger());at(0,46,0,()=>L.castle())},
  snow(T){const {L,at}=T;at(-6,20,0,()=>L.igloo());at(6,21,0,()=>L.igloo());at(0,27,0,()=>L.igloo());at(-9,33,0,()=>L.igloo());at(9,34,0,()=>L.igloo());at(-3,41,.2,()=>L.cottage("ice","icing"));at(4,42,-.2,()=>L.water());
    for(const [x,z] of [[-14,26],[14,28],[0,50]])at(x,z,0,()=>L.tree(1.2),1)},
  spooky(T){const {L,at}=T;at(0,40,0,()=>L.haunted());at(-9,30,.3,()=>L.haunted());at(9,31,-.3,()=>L.church());at(-4,22,0,()=>L.cottage("haunt","slate"));at(5,22,0,()=>L.cottage("haunt","slate"));at(-13,39,.3,()=>L.cottage("haunt","slate"));at(12.5,41,-.3,()=>L.haunted());at(0,30,0,()=>L.hut());
    for(let i=0;i<8;i++)at(-6+(i%4)*4,15+Math.floor(i/4)*2.5,0,()=>L.grave(),1);for(const [x,z] of [[-13,20],[13,22],[-12,44],[12,45]])at(x,z,0,()=>L.tree(1.3),1)},
  city(T){const {L,at,road,walk,park,pave,zebra}=T,P=(x,z,f)=>at(x,z,0,f,1);
    /* streets: a long avenue straight ahead, two cross streets, pavements, a park */
    pave(0,46,64,84);road(0,44,7,80);road(0,31,64,6,1);road(0,53,64,6,1);for(const z of [27.6,34.4,49.6,56.4])zebra(0,z,7);
    for(const x of [-4.4,4.4])walk(x,44,1.8,80);for(const z of [27.2,34.8,49.2,56.8])walk(0,z,64,1.8);park(14,20,15,12);
    /* near the cannon: shops on the left, a park with a fountain on the right */
    at(-7.4,20,0,()=>L.shops(4));at(-14,16,0,()=>L.apart(6,4.4,3.6,0xe9b48a));at(-14,23.5,0,()=>L.apart(7,4.4,3.6,0xd7d7e8));at(-20.5,19.5,0,()=>L.apart(4,3.6,6,0xc98f73));
    P(14,20,()=>L.fountain());for(const [x,z] of [[9,15],[19.5,15],[9,25],[19.5,25],[14,14.5]])P(x,z,()=>L.tree(1));
    /* the middle: offices and flats */
    at(-8.5,39,0,()=>L.office(12,4,4,0x8fc3ff));at(-16,38.5,0,()=>L.apart(9,4.4,4,0xf0d9b5));at(-12,46,0,()=>L.office(8,5,3.6,0xa6e3c8));at(-21,44,0,()=>L.apart(5,3.6,5,0xe5a48c));
    at(8.5,39.5,0,()=>L.office(14,4,4,0x7fa8ff));at(16.5,38.5,0,()=>L.office(10,4.2,4.2,0x9be3b8));at(10,46.5,0,()=>L.shops(3,[0xff9a5a,0x6ad0c8,0xd08aff]));at(20,46,0,()=>L.apart(6,3.6,4,0xf3e2a0));
    /* far away: the skyscrapers */
    at(-9,63,0,()=>L.office(20,4.6,4.6,0x6fa0e8,.6));at(-17,62,0,()=>L.office(16,4,4,0xb8c8ff));at(-12.5,72,0,()=>L.apart(12,5,4,0xe8d2c0));
    at(9.5,64,0,()=>L.office(22,4.8,4.8,0x86c8f0,.65));at(18,62,0,()=>L.office(17,4,4,0xa0e0d0));at(12.5,73,0,()=>L.office(12,5,4,0xc7b3ff));
    at(0,88,0,()=>L.office(22,5.2,5.2,0x9fd0ff,.55));
    /* cars, a bus, street lamps */
    const cars=[[1.7,13,0xff4b4b],[-1.7,19,0x4b8bff],[1.7,37,0xffd23f],[-1.7,44,0x44cc66],[1.7,60,0xffffff],[-1.7,68,0xff8a1a],[1.7,78,0x9b5bff]];for(const [x,z,c] of cars)P(x,z,()=>L.car(c));P(-1.7,29,()=>L.bus());
    for(const [x,z,c] of [[-12,30.2,0x30c0ff],[15,31.8,0xff5ea0],[-20,52.2,0xffe14a],[11,53.8,0x55dd55]])at(x,z,Math.PI/2,()=>L.car(c),1);
    for(let z=12;z<=80;z+=8)for(const x of [-4.9,4.9])T.lamp(x,z)},
  mega(T){const {L,at,road,walk,park,pave,zebra}=T,P=(x,z,f)=>at(x,z,0,f,1);
    /* a huge city: three avenues, three cross streets, a stadium and a forest of skyscrapers */
    pave(0,52,84,96);for(const x of [0,-24,24])road(x,50,7,92);for(const z of [30,52,74])road(0,z,84,6,1);for(const x of [-4.4,4.4,-19.6,-28.4,19.6,28.4])walk(x,50,1.8,92);
    for(const z of [26.2,33.8,48.2,55.8,70.2,77.8])walk(0,z,84,1.8);for(const z of [26.6,33.4,48.6,55.4,70.6,77.4])zebra(0,z,7);park(-12,18,12,10);
    at(13,19,0,()=>L.stadium());at(-8,19,0,()=>L.shops(3));at(-15,19,0,()=>L.apart(6,4,4,0xe9b48a));P(-12,24,()=>L.tree(1.1));P(-16,14.5,()=>L.tree(1));
    const offs=[[-9,40,13,0x8fc3ff],[-16,40,9,0xf0d9b5,1],[-9,46,8,0xa6e3c8],[-16,46.5,6,0xe5a48c,1],[9,40,15,0x7fa8ff],[16,40,11,0x9be3b8],[9,46,6,0xf3e2a0,1],[16,46.5,9,0xc7b3ff],
      [-32,40,10,0xb8c8ff],[32,40,12,0x86c8f0],[-32,62,14,0xe8d2c0,1],[32,62,16,0xa0e0d0],
      [-9,62,19,0x6fa0e8,0,.6],[-16,62,17,0xb8c8ff],[-12,68.5,10,0xe0c0a0,1],[9,62,19,0x86c8f0,0,.6],[16,62,18,0xa0e0d0],[12,68.5,12,0xc7b3ff],
      [-9,84,20,0x9fd0ff,0,.55],[-16,84,17,0x7fb0ff],[9,84,20,0x80e0ff,0,.6],[16,84,19,0xb0a8ff],[0,90,22,0xc0e8ff,0,.5],[-32,84,15,0xa6e3c8],[32,84,17,0xffc0a0]];
    for(const [x,z,f,c,ap,set] of offs)at(x,z,0,()=>ap?L.apart(f,4.4,4,c):L.office(f,f>16?4.8:4.2,f>16?4.8:4.2,c,set||0));
    const cars=[[1.7,14,0xff4b4b],[-1.7,22,0x4b8bff],[1.7,38,0xffd23f],[-1.7,46,0x44cc66],[1.7,61,0xffffff],[-1.7,66,0xff8a1a],[1.7,82,0x9b5bff],[-25.7,36,0xff4b4b],[22.3,44,0x30c0ff],[-22.3,64,0xffe14a],[25.7,70,0x55dd55]];
    for(const [x,z,c] of cars)P(x,z,()=>L.car(c));P(-1.7,30,()=>L.bus());P(22.3,58,()=>L.bus());for(const [x,z,c] of [[-12,29.2,0x30c0ff],[13,53,0xff5ea0],[-14,75,0xffe14a]])at(x,z,Math.PI/2,()=>L.car(c),1);
    for(let z=12;z<=92;z+=10)for(const x of [-4.9,4.9])T.lamp(x,z)}};
function wbTown(k){const T=wbTownMaker();WB_TOWNS[k](T);const B=T.B;B.decor=T.decor;return B}
if(typeof module!=="undefined")module.exports={wbTown,wbTownMaker,WB_TOWNS};
