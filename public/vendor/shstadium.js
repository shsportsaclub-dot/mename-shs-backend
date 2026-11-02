/* SH original stadium, built entirely in code (no purchased or downloaded assets).
   Game coordinates: pitch along +z from 0 to 20.12, field centre (0, CZ). Three x is mirrored by the caller (x = -game x). */
export function build(T,o){
 o=o||{};const R=o.R||58,CZ=o.CZ||10,g=new T.Group();g.name='shstadium';
 const rnd=(()=>{let s=1234567;return()=>(s=(s*16807)%2147483647)/2147483647})();
 const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 const tex=(c,rx,ry,srgb=true)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;return t};
 /* sky */
 {const c=cv(512,512),x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#2f63b8');gr.addColorStop(.45,'#6f9bdc');gr.addColorStop(.8,'#b9d0ee');gr.addColorStop(1,'#e6eaf2');x.fillStyle=gr;x.fillRect(0,0,512,512);
  for(let i=0;i<70;i++){const cx=rnd()*512,cy=130+rnd()*200,r=18+rnd()*46;const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,'rgba(255,255,255,.55)');rg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=rg;x.beginPath();x.ellipse(cx,cy,r*1.8,r*.6,0,0,7);x.fill()}
  const sky=new T.Mesh(new T.SphereGeometry(450,32,16),new T.MeshBasicMaterial({map:tex(c,1,1),side:T.BackSide,fog:false,depthWrite:false}));sky.position.set(0,0,CZ);sky.renderOrder=-10;g.add(sky)}
 /* turf: concentric mowing stripes + noise, plus a fine blade layer */
 {const S=1024,c=cv(S,S),x=c.getContext('2d');x.fillStyle='#2f7d32';x.fillRect(0,0,S,S);const cx=S/2,rr=S/2,ring=(R+24)/S*2;
  const N=Math.round((R+24)*2/5.5);for(let i=0;i<N;i++){x.fillStyle=i%2?'#3a8738':'#2f7a33';x.fillRect(i*S/N,0,S/N+1,S)}
  const id=x.getImageData(0,0,S,S),d=id.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*26;d[i]+=n*.6;d[i+1]+=n;d[i+2]+=n*.5}x.putImageData(id,0,0);
  for(let i=0;i<200;i++){const px=Math.random()*S,py=Math.random()*S,r=6+Math.random()*35;const rg=x.createRadialGradient(px,py,0,px,py,r);rg.addColorStop(0,Math.random()<.5?'rgba(20,70,25,.16)':'rgba(120,170,70,.10)');rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(px-r,py-r,r*2,r*2)}
  const m=new T.Mesh(new T.CircleGeometry(R+24,96),new T.MeshStandardMaterial({map:tex(c,1,1),roughness:.95,metalness:0}));m.rotation.x=-Math.PI/2;m.position.set(0,0,CZ);m.rotation.z=0;m.receiveShadow=true;
  m.material.map.center.set(.5,.5);g.add(m);
  const b=cv(256,256),y=b.getContext('2d');for(let i=0;i<5200;i++){y.strokeStyle='rgba('+(30+Math.random()*50|0)+','+(100+Math.random()*60|0)+',40,'+(.25+Math.random()*.4)+')';y.lineWidth=1;const px=Math.random()*256,py=Math.random()*256;y.beginPath();y.moveTo(px,py);y.lineTo(px+(Math.random()-.5)*4,py-3-Math.random()*5);y.stroke()}
  const bt=tex(b,70,70);const bl=new T.Mesh(new T.CircleGeometry(R+4,64),new T.MeshBasicMaterial({map:bt,transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));bl.rotation.x=-Math.PI/2;bl.position.set(0,.004,CZ);g.add(bl)}
 /* pitch strip with creases */
 {const c=cv(256,1024),x=c.getContext('2d');x.fillStyle='#cdb88a';x.fillRect(0,0,256,1024);for(let i=0;i<500;i++){x.fillStyle='rgba('+(150+Math.random()*60|0)+','+(120+Math.random()*50|0)+',70,'+(Math.random()*.12)+')';x.fillRect(Math.random()*256,Math.random()*1024,3+Math.random()*30,2+Math.random()*12)}
  for(const py of[110,930]){const g2=x.createRadialGradient(128,py,5,128,py,120);g2.addColorStop(0,'rgba(110,85,50,.45)');g2.addColorStop(1,'rgba(110,85,50,0)');x.fillStyle=g2;x.fillRect(0,py-120,256,240)}
  /* strip spans z -1.8 .. 21.9 (23.7 m) and x +-1.52 (3.05 m); canvas y 0 = far end */
  const Z0=-1.8,Z1=21.9,pxz=z=>1024*(1-(z-Z0)/(Z1-Z0));x.fillStyle='#f4f4ee';
  for(const zs of[0,20.12]){const f=(z)=>pxz(z);x.fillRect(128-1.32/3.05*256,f(zs)-3,2.64/3.05*256,5);const pc=zs===0?1.22:-1.22;x.fillRect(0,f(zs+pc)-3,256,5);x.fillRect(128-1.32/3.05*256,f(zs)-3,4,Math.abs(f(zs+pc)-f(zs)));x.fillRect(128+1.32/3.05*256-4,f(zs)-3,4,Math.abs(f(zs+pc)-f(zs)))}
  const m=new T.Mesh(new T.PlaneGeometry(3.05,Z1-Z0),new T.MeshStandardMaterial({map:tex(c,1,1),roughness:.9}));m.rotation.x=-Math.PI/2;m.rotation.z=Math.PI;m.position.set(0,.012,(Z0+Z1)/2);m.receiveShadow=true;g.add(m)}
 /* stumps (both ends) */
 {const wood=new T.MeshStandardMaterial({color:0xe9d9a8,roughness:.6});for(const z of[0,20.12])for(const dx of[-.1,0,.1]){const s=new T.Mesh(new T.CylinderGeometry(.018,.018,.71,8),wood);s.position.set(dx,.355,z);s.castShadow=true;g.add(s)}
  for(const z of[0,20.12])for(const dx of[-.05,.05]){const bl=new T.Mesh(new T.CylinderGeometry(.01,.01,.1,6),wood);bl.rotation.z=Math.PI/2;bl.position.set(dx,.72,z);g.add(bl)}}
 /* boundary rope + advertising boards */
 {const rope=new T.Mesh(new T.TorusGeometry(R,.09,8,160),new T.MeshStandardMaterial({color:0xf5f5f5,roughness:.8}));rope.rotation.x=Math.PI/2;rope.position.set(0,.1,CZ);g.add(rope);
  const ads=[['SCORING HEROES','#c4f000','#0a1f5c'],['SH SPORTS SKY HIGH','#ffffff','#b3122d'],['SH AUCTION','#ffd23f','#12266a'],['LIVE IN 3D','#ffffff','#0f8a4f']];
  const ts=ads.map(a=>{const c=cv(512,64),x=c.getContext('2d');x.fillStyle=a[2];x.fillRect(0,0,512,64);x.fillStyle=a[1];x.font='900 40px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(a[0],256,34);const t=tex(c,-1,1);t.offset.set(1,0);return t}),n=48;
  for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,am=(a0+a1)/2,len=2*Math.PI*(R+2.2)/n+.05;const m=new T.Mesh(new T.PlaneGeometry(len,1.05),new T.MeshStandardMaterial({map:ts[(i>>1)%4],roughness:.5,emissive:0x222222}));
   m.position.set(Math.cos(am)*(R+2.2),.55,CZ+Math.sin(am)*(R+2.2));m.rotation.y=-am-Math.PI/2;g.add(m)}}
 /* stands: crowd texture on raked rings (lower bowl, upper bowl), concourse band, roof ring with struts */
 const crowd=(()=>{const c=cv(1024,256),x=c.getContext('2d');x.fillStyle='#1b2236';x.fillRect(0,0,1024,256);const cols=['#2a58c9','#2a58c9','#3a6bdc','#ffffff','#e9ecf5','#d9def0','#1d3fa0','#2a2f45','#2a58c9','#c8cde0','#f2c230','#8a98c8'],sk=['#c68a5a','#a8693f','#e0b08a','#8a5532'];
  for(let r=0;r<32;r++){const y=r*8+6;for(let i=0;i<150;i++){const px=i*6.8+(r%2)*3+rnd()*2;if(rnd()<.06)continue;x.fillStyle=cols[rnd()*cols.length|0];x.fillRect(px,y+1,5,6);x.fillStyle=sk[rnd()*sk.length|0];x.fillRect(px+1,y-2,3,3)}x.fillStyle='rgba(0,0,0,.28)';x.fillRect(0,r*8+7,1024,1.2)}return c})();
 const ring=(pts,mat,seg)=>{const m=new T.Mesh(new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg||96),mat);m.position.set(0,0,CZ);return m};
 const crowdMat=(rx,ry)=>new T.MeshStandardMaterial({map:tex(crowd,rx,ry),roughness:.9,side:T.DoubleSide,emissive:0x0c0f1a,color:0x9fa4b4});
 g.add(ring([[R+4,1.2],[R+17,11]],crowdMat(8,1)));
 g.add(ring([[R+17,11],[R+17,13.5]],new T.MeshStandardMaterial({color:0x2a3047,roughness:.8,side:T.DoubleSide})));
 g.add(ring([[R+17,13.5],[R+32,30]],crowdMat(9,1)));
 g.add(ring([[R+32,30],[R+32,31]],new T.MeshStandardMaterial({color:0x252b40,side:T.DoubleSide})));
 /* front facia under lower bowl and walls */
 g.add(ring([[R+3.8,0],[R+3.8,1.3]],new T.MeshStandardMaterial({color:0x1d2a55,side:T.DoubleSide})));
 /* roof canopy */
 {const roofM=new T.MeshStandardMaterial({color:0x3a4256,roughness:.7,metalness:.1,side:T.DoubleSide});roofM.color.set(0xd5dae4);g.add(ring([[R+16,33.2],[R+40,38],[R+40,39],[R+16,34.4]],roofM));
  const strut=new T.MeshStandardMaterial({color:0xe2e6ee,metalness:.2,roughness:.5}),n=36;for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2,r0=R+20,r1=R+40,x0=Math.cos(a)*r0,z0=CZ+Math.sin(a)*r0,x1=Math.cos(a)*r1,z1=CZ+Math.sin(a)*r1;const len=Math.hypot(r1-r0,5);const s=new T.Mesh(new T.BoxGeometry(.5,.6,len),strut);s.position.set((x0+x1)/2,35.4,(z0+z1)/2);s.rotation.y=-a+Math.PI/2;s.rotation.x=0;g.add(s)}
  const trim=ring([[R+40,38.5],[R+40.3,38.5],[R+40.3,39.3],[R+40,39.3]],new T.MeshStandardMaterial({color:0xe8ecf4}));g.add(trim)}
 /* big screen on the far stand (canvas redrawn from scoreboard text) */
 {const c=cv(512,288),x=c.getContext('2d');const t=tex(c,-1,1);t.offset.set(1,0);const scr=new T.Mesh(new T.PlaneGeometry(22,12.4),new T.MeshBasicMaterial({map:t,toneMapped:false}));const a=-Math.PI/2+.28,r=R+15.5;scr.position.set(Math.cos(a)*r,24,CZ+Math.sin(a)*r);scr.lookAt(0,10,CZ);g.add(scr);
  const fr=new T.Mesh(new T.BoxGeometry(23.2,13.6,.9),new T.MeshStandardMaterial({color:0x10141f}));fr.position.copy(scr.position);fr.quaternion.copy(scr.quaternion);fr.translateZ(-.55);g.add(fr);
  const draw=(l1,l2,l3)=>{const gr=x.createLinearGradient(0,0,0,288);gr.addColorStop(0,'#0a2a8a');gr.addColorStop(1,'#061547');x.fillStyle=gr;x.fillRect(0,0,512,288);x.fillStyle='#c4f000';x.fillRect(0,0,512,34);x.fillStyle='#0a1f5c';x.font='900 24px Arial';x.textAlign='left';x.textBaseline='middle';x.fillText('SCORING HEROES  LIVE',14,18);
   x.fillStyle='#fff';x.font='900 66px Arial';x.fillText(String(l1||'').slice(0,14),18,104);x.fillStyle='#ffd23f';x.font='700 34px Arial';x.fillText(String(l2||'').slice(0,26),18,168);x.fillStyle='#cfe0ff';x.font='600 28px Arial';x.fillText(String(l3||'').slice(0,30),18,222);t.needsUpdate=true};draw('SH','SPORTS SKY HIGH','');g.userData.screen=draw}
 /* floodlight towers */
 {const steel=new T.MeshStandardMaterial({color:0xaab2c4,metalness:.5,roughness:.5}),lamp=new T.MeshBasicMaterial({color:0xfff6d8,toneMapped:false});for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,x=Math.cos(a)*(R+46),z=CZ+Math.sin(a)*(R+46);const p=new T.Mesh(new T.CylinderGeometry(.9,1.4,52,10),steel);p.position.set(x,26,z);g.add(p);
   const hd=new T.Mesh(new T.BoxGeometry(11,6,1.2),new T.MeshStandardMaterial({color:0x20242e}));hd.position.set(x,54,z);hd.lookAt(0,20,CZ);g.add(hd);for(let i=0;i<4;i++)for(let j=0;j<3;j++){const l=new T.Mesh(new T.CircleGeometry(.7,10),lamp);l.position.set(-4+i*2.6,-2+j*2,.65);hd.add(l)}}}
 /* light */
 const sun=new T.DirectionalLight(0xfff0d8,3.1);sun.position.set(-38,70,CZ+40);sun.target.position.set(0,0,CZ);g.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);const sc=sun.shadow.camera;sc.left=-64;sc.right=64;sc.top=64;sc.bottom=-64;sc.near=10;sc.far=200;sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;
 const hemi=new T.HemisphereLight(0xbcd4ff,0x3a5a35,1.05);g.add(hemi);
 /* ball */
 const ball=new T.Mesh(new T.SphereGeometry(.11,16,12),new T.MeshStandardMaterial({color:0xb3121d,roughness:.4}));ball.castShadow=true;ball.visible=false;g.add(ball);
 g.scale.x=-1;const API={group:g,sun,hemi,ball,screen:g.userData.screen,
  setBall(b){if(b&&b.on){ball.visible=true;ball.position.set(b.x,b.y,b.z)}else ball.visible=false}};
 return API}

/* Arena for the other sports (football, basketball, rugby, kabaddi, volleyball, badminton, tennis, table tennis, pickleball).
   Game coordinates: length along x (-L/2..L/2), width along z, camera looks along +z. Built in code; the caller mirrors x. */
export function buildArena(T,sp){
 const L=sp.L,Wd=sp.W,g=new T.Group();g.name='sharena';const sc=sp.table?.3:Math.max(.5,Math.min(3.5,L/30)),apron=Math.max(2,L*.06);
 const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 const tex=(c,rx,ry)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=4;t.colorSpace=T.SRGBColorSpace;return t};
 const rnd=(()=>{let s=987654;return()=>(s=(s*16807)%2147483647)/2147483647})();
 const std=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r==null?.7:r,metalness:.05});
 /* sky */
 {const c=cv(256,256),x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#1d4a9c');gr.addColorStop(.55,'#6f9bdc');gr.addColorStop(1,'#d3e0f2');x.fillStyle=gr;x.fillRect(0,0,256,256);
  const sky=new T.Mesh(new T.SphereGeometry(500,24,12),new T.MeshBasicMaterial({map:tex(c,1,1),side:T.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-10;g.add(sky)}
 /* floor texture with stripes and the court or pitch lines */
 const TW=Math.min(1536,Math.max(512,Math.round((L+2*apron)*14))),s=TW/(L+2*apron),TH=Math.round((Wd+2*apron)*s),px=m=>(m+L/2+apron)*s,pz=m=>(m+Wd/2+apron)*s;
 {const c=cv(TW,TH),x=c.getContext('2d');const sh=(h,f)=>{const n=parseInt(String(h).replace('#',''),16);return'rgb('+(((n>>16)&255)*f|0)+','+(((n>>8)&255)*f|0)+','+((n&255)*f|0)+')'};
  x.fillStyle=sh(sp.surf,.8);x.fillRect(0,0,TW,TH);x.fillStyle=sp.surf;x.fillRect(px(-L/2),pz(-Wd/2),L*s,Wd*s);
  const n=sp.kind==='goal'||sp.kind==='try'?14:8;for(let i=0;i<n;i++)if(i%2){x.fillStyle=sp.stripe;x.fillRect(px(-L/2+i/n*L),pz(-Wd/2),L/n*s,Wd*s)}
  const id=x.getImageData(0,0,TW,TH),d=id.data;for(let i=0;i<d.length;i+=4){const q=(Math.random()-.5)*14;d[i]+=q;d[i+1]+=q;d[i+2]+=q}x.putImageData(id,0,0);
  x.strokeStyle='#fff';x.lineWidth=Math.max(2,s*.12);x.lineCap='square';
  const ln=(x0,z0,x1,z1,col,w)=>{x.save();if(col)x.strokeStyle=col;if(w)x.lineWidth=w;x.beginPath();x.moveTo(px(x0),pz(z0));x.lineTo(px(x1),pz(z1));x.stroke();x.restore()},rc=(x0,z0,x1,z1)=>x.strokeRect(px(Math.min(x0,x1)),pz(Math.min(z0,z1)),Math.abs(x1-x0)*s,Math.abs(z1-z0)*s),ci=(cx,cz,r,a0,a1)=>{x.beginPath();x.arc(px(cx),pz(cz),r*s,a0||0,a1==null?Math.PI*2:a1);x.stroke()};
  rc(-L/2,-Wd/2,L/2,Wd/2);
  if(sp.kind==='goal'){ln(0,-Wd/2,0,Wd/2);ci(0,0,9.15);for(const sg of[-1,1]){rc(sg*L/2,-20.15,sg*(L/2-16.5),20.15);rc(sg*L/2,-9.16,sg*(L/2-5.5),9.16)}}
  else if(sp.kind==='try'){ln(0,-Wd/2,0,Wd/2);for(const sg of[-1,1]){ln(sg*(L/2-10),-Wd/2,sg*(L/2-10),Wd/2);ln(sg*(L/2-22),-Wd/2,sg*(L/2-22),Wd/2)}}
  else if(sp.kind==='hoop'){ln(0,-Wd/2,0,Wd/2);ci(0,0,1.8);for(const sg of[-1,1]){rc(sg*L/2,-2.45,sg*(L/2-5.8),2.45);ci(sg*(L/2-1.6),0,6.75,sg>0?Math.PI*.62:-Math.PI*.38,sg>0?Math.PI*1.38:Math.PI*.38)}}
  else if(sp.kind==='raid'){ln(0,-Wd/2,0,Wd/2,'#ffd84d',s*.2);ln(-L/2+3.75,-Wd/2,-L/2+3.75,Wd/2);ln(L/2-3.75,-Wd/2,L/2-3.75,Wd/2)}
  else{ln(0,-Wd/2,0,Wd/2,'#fff',s*.18);if(sp.shuttle||sp.n>=1&&!sp.table){ln(-L/2*.46,-Wd/2,-L/2*.46,Wd/2);ln(L/2*.46,-Wd/2,L/2*.46,Wd/2);ln(-L/2,0,L/2,0)}}
  const m=new T.Mesh(new T.PlaneGeometry(L+2*apron,Wd+2*apron),new T.MeshStandardMaterial({map:tex(c,1,1),roughness:.9}));m.rotation.x=-Math.PI/2;m.receiveShadow=true;g.add(m);
  const out=new T.Mesh(new T.PlaneGeometry(L*8,Wd*10+500),new T.MeshStandardMaterial({color:0x2b3040,roughness:1}));out.rotation.x=-Math.PI/2;out.position.y=-.02;g.add(out)}
 /* crowd banks on the far side and both ends, ad boards on the touchline */
 const crowd=(()=>{const c=cv(512,128),x=c.getContext('2d');x.fillStyle='#1b2236';x.fillRect(0,0,512,128);const cols=['#2a58c9','#3a6bdc','#ffffff','#e9ecf5','#d9def0','#1d3fa0','#f2c230','#c8cde0','#c0392b','#8a98c8'],sk=['#c68a5a','#a8693f','#e0b08a','#8a5532'];
  for(let r=0;r<16;r++){const y=r*8+6;for(let i=0;i<75;i++){const q=i*6.8+(r%2)*3;if(rnd()<.06)continue;x.fillStyle=cols[rnd()*cols.length|0];x.fillRect(q,y+1,5,6);x.fillStyle=sk[rnd()*sk.length|0];x.fillRect(q+1,y-2,3,3)}}return c})();
 const bank=(len,rows,depth0,rotY,ox,oz)=>{const h=9*sc,d=10*sc,sl=Math.hypot(h,d),t=tex(crowd,Math.max(1,len/(41*sc)),Math.max(.5,sl/(19*sc))),m=new T.Mesh(new T.PlaneGeometry(len,sl),new T.MeshStandardMaterial({map:t,roughness:.9,side:T.DoubleSide,emissive:0x0c0f1a,color:0xa8adbc}));
  const grp=new T.Group();m.rotation.x=Math.atan2(d,h);m.position.set(0,h/2,depth0+d/2);grp.add(m);const wall=new T.Mesh(new T.PlaneGeometry(len,6*sc),std(0x232a40,.9));wall.position.set(0,h+3*sc,depth0+d);wall.rotation.y=Math.PI;grp.add(wall);grp.rotation.y=rotY;grp.position.set(ox,0,oz);g.add(grp)};
 const bx=L/2+Math.max(3,L*.04),bz=Wd/2+Math.max(2,Wd*.08);
 bank(bx*2.6,7,bz,0,0,0);bank(bz*2,5,bx,-Math.PI/2,0,0);bank(bz*2,5,bx,Math.PI/2,0,0);
 /* ad boards */
 {const ads=[['SCORING HEROES','#c4f000','#0a1f5c'],['SH SPORTS SKY HIGH','#ffffff','#b3122d'],['SH AUCTION','#ffd23f','#12266a']],ts=ads.map(a=>{const c=cv(512,64),x=c.getContext('2d');x.fillStyle=a[2];x.fillRect(0,0,512,64);x.fillStyle=a[1];x.font='900 40px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(a[0],256,34);const t=tex(c,-1,1);t.offset.set(1,0);return t}),n=14,w=bx*2/n;
  for(let i=0;i<n;i++){const m=new T.Mesh(new T.PlaneGeometry(w,.9*sc),new T.MeshStandardMaterial({map:ts[i%3],roughness:.5,emissive:0x222222}));m.position.set(-bx+(i+.5)*w,.45*sc,bz-.4);m.rotation.y=Math.PI;g.add(m)}}
 /* goals, posts, hoops, net, table */
 const white=std(0xffffff,.5),steel=std(0xaab2c4,.4);
 const cyl=(r,h,mat,x,y,z)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,8),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 const netTex=(()=>{const c=cv(64,64),x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=2;for(let i=0;i<=64;i+=8){x.beginPath();x.moveTo(i,0);x.lineTo(i,64);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(64,i);x.stroke()}return c})();
 const netMat=(rx,ry)=>new T.MeshBasicMaterial({map:tex(netTex,rx,ry),transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false});
 if(sp.kind==='goal'){for(const sg of[-1,1]){const X=sg*L/2;cyl(.06,2.44,white,X,1.22,-3.66);cyl(.06,2.44,white,X,1.22,3.66);const cb=cyl(.06,7.32,white,X,2.44,0);cb.rotation.x=Math.PI/2;
   const back=new T.Mesh(new T.PlaneGeometry(7.32,2.44),netMat(14,5));back.rotation.y=Math.PI/2;back.position.set(X+sg*2,1.22,0);g.add(back);for(const z of[-3.66,3.66]){const sd=new T.Mesh(new T.PlaneGeometry(2,2.44),netMat(4,5));sd.position.set(X+sg*1,1.22,z);g.add(sd)}}}
 else if(sp.kind==='try'){for(const sg of[-1,1]){const X=sg*L/2;cyl(.08,13,white,X,6.5,-2.8);cyl(.08,13,white,X,6.5,2.8);const cb=cyl(.08,5.6,white,X,5.6,0);cb.rotation.x=Math.PI/2}}
 else if(sp.kind==='hoop'){for(const sg of[-1,1]){const X=sg*(L/2-.9);cyl(.07,3.4,steel,X,1.7,0);const bb=new T.Mesh(new T.BoxGeometry(.05,1.05,1.8),new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.85,roughness:.3}));bb.position.set(X,3.5,0);bb.castShadow=true;g.add(bb);
   const rim=new T.Mesh(new T.TorusGeometry(.23,.02,8,20),std(0xff6b00,.4));rim.rotation.x=Math.PI/2;rim.position.set(sg*(L/2-1.6),3.05,0);g.add(rim)}}
 else if(sp.kind==='net'){const nh=sp.net||1,top=sp.table?.76+nh*.2:nh;
  if(sp.table){const tb=new T.Mesh(new T.BoxGeometry(L,.04,Wd),std(0x1d4ed8,.5));tb.position.y=.76;tb.castShadow=true;tb.receiveShadow=true;g.add(tb);for(const a of[-1,1])for(const b of[-1,1])cyl(.03,.74,steel,a*(L/2-.2),.37,b*(Wd/2-.1));
   const nt=new T.Mesh(new T.PlaneGeometry(Wd+.3,.15),netMat(10,1));nt.rotation.y=Math.PI/2;nt.position.set(0,.76+.08,0);g.add(nt)}
  else{const nt=new T.Mesh(new T.PlaneGeometry(Wd+.8,nh*.9),netMat(Math.round((Wd+.8)*3),Math.max(2,Math.round(nh*3))));nt.rotation.y=Math.PI/2;nt.position.set(0,nh*.55,0);g.add(nt);const tape=new T.Mesh(new T.BoxGeometry(.04,.08,Wd+.8),white);tape.position.set(0,nh,0);g.add(tape);cyl(.04,nh+.1,steel,0,(nh+.1)/2,-(Wd/2+.4));cyl(.04,nh+.1,steel,0,(nh+.1)/2,Wd/2+.4)}}
 /* floodlight towers */
 for(const [a,b] of[[-1,1],[1,1],[-1,-1],[1,-1]]){const X=a*(bx+6*sc),Z=b*(bz+10*sc);const p=new T.Mesh(new T.CylinderGeometry(.35*sc,.5*sc,26*sc,8),steel);p.position.set(X,13*sc,Z);g.add(p);const hd=new T.Mesh(new T.BoxGeometry(4*sc,2*sc,.5*sc),new T.MeshBasicMaterial({color:0xfff6d8,toneMapped:false}));hd.position.set(X,26.5*sc,Z);hd.lookAt(0,5,0);g.add(hd)}
 /* light and shadows */
 const sun=new T.DirectionalLight(0xfff0d8,3);const R0=Math.max(L,Wd)*.62+apron;sun.position.set(-R0*.5,R0*1.4,-R0*.9);sun.target.position.set(0,0,0);g.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);const q=sun.shadow.camera;q.left=-R0;q.right=R0;q.top=R0;q.bottom=-R0;q.near=1;q.far=R0*4;sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;
 g.add(new T.HemisphereLight(0xbcd4ff,0x3a5a35,1.1));
 /* ball */
 let ball;{const r=sp.kind==='try'?.16:sp.kind==='hoop'?.12:sp.shuttle?.05:sp.table?.02:sp.icon==='\u{1F3BE}'?.034:.11;const col=sp.kind==='try'?0x7a3b12:sp.kind==='hoop'?0xe06a1b:sp.shuttle?0xffffff:sp.icon==='\u{1F3BE}'?0xd7f03a:0xf4f4f4;
  ball=new T.Mesh(new T.SphereGeometry(r*(sp.shuttle?1.4:1.5),14,10),std(col,.45));if(sp.kind==='try')ball.scale.set(1.5,.9,.9);ball.castShadow=true;ball.visible=false;g.add(ball)}
 g.scale.x=-1;
 return{group:g,ball,sun,setBall(b){if(b&&b.y!=null){ball.visible=true;ball.position.set(b.x,Math.max(.05,b.y),b.z)}else ball.visible=false},screen(){}}}
