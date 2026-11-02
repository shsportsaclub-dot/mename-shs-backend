/* SH 3D broadcast titles: extruded, bevelled, metal-lit glyphs (outlines baked from Poppins Bold Italic, SIL OFL) with sparks, god rays and glow, rendered on a transparent canvas for OBS. */
import {G} from './shglyph.js';
export const THEMES=[
 {n:'gold',face:0xffc531,side:0xa85a00,em:0x2a1400,rough:.2,met:1,glow:'#ffb300',rim:0xffd27a,spark:[1,.8,.3]},
 {n:'chrome',face:0xeaf2ff,side:0x55627f,em:0x000000,rough:.12,met:1,glow:'#7fb2ff',rim:0x9cc4ff,spark:[.7,.85,1]},
 {n:'fire',face:0xff7a12,side:0x8a1400,em:0x6a1a00,rough:.35,met:.7,glow:'#ff4d00',rim:0xff7a30,spark:[1,.5,.1]},
 {n:'ruby',face:0xe01d3a,side:0x5a0414,em:0x300008,rough:.25,met:.85,glow:'#ff2a55',rim:0xff6a8a,spark:[1,.3,.4]},
 {n:'ice',face:0x9fe8ff,side:0x1a6fa8,em:0x001a2a,rough:.18,met:.9,glow:'#35d0ff',rim:0x8fe8ff,spark:[.5,.9,1]},
 {n:'neon',face:0x0a0e22,side:0x00e5ff,em:0x00a8c0,rough:.4,met:.3,glow:'#19f0ff',rim:0xff2bd6,spark:[.3,.95,1]},
 {n:'emerald',face:0x1fd36b,side:0x066332,em:0x052a14,rough:.22,met:.9,glow:'#2ee66b',rim:0x8dffb4,spark:[.5,1,.6]},
 {n:'violet',face:0xa24dff,side:0x3a0f7a,em:0x1a0638,rough:.25,met:.85,glow:'#b36bff',rim:0xd9b0ff,spark:[.8,.5,1]}];
const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c};
export function textGroup(T,text,th,o){o=o||{};const grp=new T.Group(),fm=new T.MeshPhysicalMaterial({color:th.face,metalness:th.met,roughness:th.rough,clearcoat:1,clearcoatRoughness:.08,emissive:th.em,emissiveIntensity:th.n==='fire'||th.n==='neon'?.9:.35,envMapIntensity:1.5}),sm=new T.MeshPhysicalMaterial({color:th.side,metalness:th.met,roughness:th.rough+.12,clearcoat:.6,emissive:th.em,emissiveIntensity:.5,envMapIntensity:1.2});
 const meshes=[];let x=0;const tr=o.track==null?.03:o.track;
 for(const ch of String(text).toUpperCase()){if(ch===' '){x+=.28;continue}const g=G[ch];if(!g){x+=.3;continue}
  const sp=new T.ShapePath();for(const c of g.c){sp.moveTo(c[0],c[1]);for(let i=2;i<c.length;i+=2)sp.lineTo(c[i],c[i+1]);sp.lineTo(c[0],c[1])}
  const sh=sp.toShapes(),geo=new T.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelOffset:0,bevelSegments:5,curveSegments:1});
  const m=new T.Mesh(geo,[fm,sm]);m.position.x=x;grp.add(m);meshes.push(m);x+=g.w+tr}
 grp.children.forEach(m=>{m.position.x-=(x-tr)/2;m.position.y=-.36;m.position.z=-.1});
 return {grp,width:x-tr,mats:[fm,sm]}}
function envMap(T,ren){const pm=new T.PMREMGenerator(ren),sc=new T.Scene();sc.background=new T.Color(0x0a0f1c);
 const box=(w,h,x,y,z,c,i)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(i),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);sc.add(m)};
 box(14,6,-8,8,6,0xffffff,5);box(8,10,9,2,5,0xfff1d0,4);box(20,3,0,-6,4,0x6688ff,1.6);box(6,6,0,4,-9,0xffffff,3);box(3,16,-11,0,-2,0xffc880,2.4);box(16,2,0,10,0,0xffffff,3);
 const r=pm.fromScene(sc,.03);pm.dispose();return r.texture}
export async function play(T,host,o){const W=host.clientWidth||1280,H=host.clientHeight||720,th=THEMES[(o.theme||0)%THEMES.length],D=o.dur||4.2;
 const ren=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));ren.setSize(W,H,false);ren.setClearColor(0,0);ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.15;ren.outputColorSpace=T.SRGBColorSpace;
 const cv=ren.domElement;cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';host.appendChild(cv);
 const scene=new T.Scene();scene.environment=envMap(T,ren);const cam=new T.PerspectiveCamera(32,W/H,.1,100);
 const tg=textGroup(T,o.text,th,o),root=new T.Group();root.add(tg.grp);scene.add(root);
 const fit=Math.min(.62*W/H/1,.9);const span=Math.max(tg.width,1.25);const dist=(span/(2*Math.tan(cam.fov*Math.PI/360)*(W/H)))/(o.fill||.6);cam.position.set(0,0,Math.max(dist,2.2));
 const key=new T.DirectionalLight(0xffffff,2.6);key.position.set(-3,4,6);scene.add(key);const rim=new T.PointLight(th.rim,60,0,2);rim.position.set(3.5,1.5,-2);scene.add(rim);const fill=new T.PointLight(0xffffff,18,0,2);fill.position.set(2,-1.5,4);scene.add(fill);
 // god rays + glow behind the title
 const rayT=new T.CanvasTexture(tex(512,512,(c,w,h)=>{c.translate(w/2,h/2);for(let i=0;i<14;i++){c.save();c.rotate(i/14*6.2832+(i%2)*.05);const g=c.createLinearGradient(0,0,w/2,0);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(.45,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;const q=14+(i%3)*10;c.beginPath();c.moveTo(0,0);c.lineTo(w/2,-q);c.lineTo(w/2,q);c.closePath();c.fill();c.restore()}const rg=c.createRadialGradient(0,0,0,0,0,w/2);rg.addColorStop(0,'rgba(255,255,255,.5)');rg.addColorStop(.5,'rgba(255,255,255,.08)');rg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=rg;c.fillRect(-w/2,-h/2,w,h)}));rayT.colorSpace=T.SRGBColorSpace;
 const rays=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:rayT,color:new T.Color(th.glow),transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:0}));rays.position.z=-.6;rays.scale.setScalar(span*2.6);scene.add(rays);
 const glT=new T.CanvasTexture(tex(256,256,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.35,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)}));glT.colorSpace=T.SRGBColorSpace;
 const glow=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:glT,color:new T.Color(th.glow),transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:0}));glow.position.z=-.4;glow.scale.set(span*1.9,span*.9,1);scene.add(glow);
 // sparks
 const N=o.sparks==null?260:o.sparks,pos=new Float32Array(N*3),vel=new Float32Array(N*3),life=new Float32Array(N),col=new Float32Array(N*3),sz=new Float32Array(N);
 const sT=new T.CanvasTexture(tex(64,64,(c,w,h)=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64)}));
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));pg.setAttribute('color',new T.BufferAttribute(col,3));
 const pm=new T.PointsMaterial({size:.07*span/1.5,map:sT,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true});const pts=new T.Points(pg,pm);scene.add(pts);
 let sp=0;const burst=(n,pw)=>{for(let k=0;k<n;k++){const i=sp++%N,a=Math.random()*6.283,b=(Math.random()-.5)*2.2,s=(.4+Math.random())*pw;pos[i*3]=(Math.random()-.5)*span*.5;pos[i*3+1]=(Math.random()-.5)*.4;pos[i*3+2]=0;vel[i*3]=Math.cos(a)*s*1.4;vel[i*3+1]=Math.sin(a)*s*.9+pw*.35;vel[i*3+2]=b*s*.4;life[i]=.9+Math.random()*1.3;const w=Math.random()<.3?1:0;col[i*3]=w?1:th.spark[0];col[i*3+1]=w?1:th.spark[1];col[i*3+2]=w?1:th.spark[2]}};
 const ease=x=>1-Math.pow(1-x,3),back=x=>{const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
 const anim=o.anim||'spin',impact=anim==='zoom'?.1:anim==='slam'?.12:.15;let t0=performance.now(),fired=0,fired2=0,last=t0,raf=0,done=0;
 return await new Promise(res=>{const fin=()=>{if(done)return;done=1;cancelAnimationFrame(raf);try{ren.dispose();scene.environment&&scene.environment.dispose();ren.forceContextLoss&&ren.forceContextLoss();cv.remove()}catch(e){}res()};
  const loop=now=>{const t=(now-t0)/1000,p=t/D,dt=Math.min(.05,(now-last)/1000);last=now;if(p>=1)return fin();
   const e=Math.min(1,p/impact),x=Math.max(0,(p-.84)/.16);let s=1,ry=0,rx=0,py=0,pz=0,sh=0;
   if(p<impact){const bk=back(e);if(anim==='spin'){s=.15+.85*bk;ry=(1-ease(e))*-2.4}else if(anim==='drop'){py=(1-ease(e))*3;s=1;ry=(1-ease(e))*.6;}else if(anim==='zoom'){pz=-(1-ease(e))*22;s=1;ry=(1-e)*.5}else if(anim==='flip'){rx=(1-ease(e))*-2.2;s=.4+.6*bk}else{s=3.2-2.2*ease(e);pz=0}}
   if(p>=impact&&p<impact+.07){const q=(p-impact)/.07;if(anim==='drop')py=Math.sin(q*3.14)*.18;if(anim==='slam'){sh=(1-q)*.04}else s=1+Math.sin(q*3.14)*.05}
   if(p>=impact){const q=t-impact*D;ry+=Math.sin(q*1.25)*.16;rx+=Math.sin(q*1.1)*.05;py+=Math.sin(q*2)*.025}
   if(x>0){s*=1+x*.55;pz+=x*1.2;py+=x*.25}
   root.scale.setScalar(Math.max(.001,s));root.rotation.set(rx,ry,0);root.position.set((Math.random()-.5)*sh*2,py+(Math.random()-.5)*sh,pz);
   const vis=1-Math.pow(x,1.5);tg.mats.forEach(m=>{m.transparent=x>0;m.opacity=vis});
   const rv=Math.max(0,Math.min(1,(p-impact+.02)/.1))*vis;rays.material.opacity=.4*rv;rays.rotation.z=t*.18;glow.material.opacity=.7*rv*(.85+.15*Math.sin(t*5));
   if(!fired&&p>=impact){fired=1;burst(o.burst||150,o.power||2.4)}if(!fired2&&p>=impact+.06&&o.burst2!==0){fired2=1;burst(80,1.6)}
   if(p>impact&&p<.8&&Math.random()<.5)burst(2,.9);
   for(let i=0;i<N;i++){if(life[i]>0){life[i]-=dt;vel[i*3+1]-=2.2*dt;pos[i*3]+=vel[i*3]*dt;pos[i*3+1]+=vel[i*3+1]*dt;pos[i*3+2]+=vel[i*3+2]*dt;const f=Math.max(0,Math.min(1,life[i]));col[i*3]*=.995;if(f<.3){col[i*3]*=f/.3+.0;col[i*3+1]*=.9;col[i*3+2]*=.9}}else{pos[i*3+1]=-99}}
   pg.attributes.position.needsUpdate=true;pg.attributes.color.needsUpdate=true;
   rim.position.x=3.5*Math.cos(t*.9);rim.position.y=1.5+Math.sin(t*.7);
   ren.render(scene,cam);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);setTimeout(fin,D*1000+400)})}
