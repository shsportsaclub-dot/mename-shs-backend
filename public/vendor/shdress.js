/* Scoring Heroes: original kit for the animated human model. Everything here is generated in code (colours painted per body part from the skin weights, helmet, pads, gloves, caps, hats, name on the back). No bought or copied assets. */
const geoCache=new Map(),matCache=new Map(),texCache=new Map();
function groupOf(b){b=b.replace('mixamorig','').replace(/^(Left|Right)/,'');
 if(/Head|Neck|Eye/.test(b))return'skin';
 if(/Hand|ForeArm/.test(b))return'skin';
 if(/Shoulder|Spine|Arm/.test(b))return'shirt';
 if(/UpLeg|Hips/.test(b))return'pants';
 if(/Foot|Toe/.test(b))return'shoes';
 if(/Leg/.test(b))return'shin';
 return'skin'}
export function palette(T,o){const sh=new T.Color(o.shirt||'#2563eb'),dk=(c,f)=>new T.Color(c).multiplyScalar(f);
 const kind=o.kit||'field',soccer=kind==='soccer',court=kind==='court'||kind==='vest';
 const pants=new T.Color(o.pants||(soccer||court?'#f3f4f6':dk(sh,.82).getStyle()));
 return{key:[sh.getHexString(),pants.getHexString(),kind,o.skin||''].join(),skin:new T.Color(o.skin||'#c68a5a'),shirt:sh,pants,shin:soccer?sh.clone():(kind==='ump'||kind==='field'||kind==='bat'||kind==='bowl'||kind==='wk'?pants.clone():new T.Color('#c68a5a')),shoes:new T.Color(kind==='ump'?'#111':'#f4f4f4')}}
function paint(T,mesh,names,pal){const k=mesh.name+'|'+pal.key;let g=geoCache.get(k);if(g)return g;g=mesh.geometry.clone();const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,n=g.attributes.position.count,col=new Float32Array(n*3),gr=names.map(groupOf);
 for(let i=0;i<n;i++){let r=0,gg=0,b=0,t=0;for(let j=0;j<4;j++){const w=sw.getComponent(i,j);if(w<=0)continue;const c=pal[gr[si.getComponent(i,j)]]||pal.skin;r+=c.r*w;gg+=c.g*w;b+=c.b*w;t+=w}if(t>0){r/=t;gg/=t;b/=t}else{r=pal.skin.r;gg=pal.skin.g;b=pal.skin.b}col[i*3]=r;col[i*3+1]=gg;col[i*3+2]=b}
 g.setAttribute('color',new T.BufferAttribute(col,3));geoCache.set(k,g);return g}
function logoTex(T,col){const k='logo|'+col;let t=texCache.get(k);if(t)return t;const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');x.fillStyle=col;x.font='900 40px Arial Black,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('SH',64,24);x.font='700 11px Arial,sans-serif';x.fillText('SCORING HEROES',64,52);t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;texCache.set(k,t);return t}
function nameTex(T,name,col){const k=name+'|'+col;let t=texCache.get(k);if(t)return t;const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.clearRect(0,0,256,96);x.fillStyle=col;x.font='900 44px Arial Black,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';let s=String(name).toUpperCase();while(x.measureText(s).width>240&&s.length>3)s=s.slice(0,-1);x.fillText(s,128,48);t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;texCache.set(k,t);return t}
const M=(T,c,r)=>new T.MeshStandardMaterial({color:c,roughness:r==null?.6:r,metalness:.05});
function cap(T,col){const g=new T.Group(),m=M(T,col,.7),d=new T.Mesh(new T.SphereGeometry(.125,16,10,0,Math.PI*2,0,Math.PI*.55),m);g.add(d);const pk=new T.Mesh(new T.BoxGeometry(.2,.012,.12),m);pk.position.set(0,.03,.14);pk.rotation.x=.12;g.add(pk);return g}
function hairShell(T,col){const g=new T.Group(),m=M(T,col,.9),A=new T.Mesh(new T.SphereGeometry(.134,20,10,0,Math.PI*2,0,Math.PI*.3),m),B=new T.Mesh(new T.SphereGeometry(.134,20,10,Math.PI/2+.95,Math.PI*2-1.9,Math.PI*.3,Math.PI*.3),m);A.scale.set(1,1,1.08);B.scale.set(1,1,1.08);g.add(A,B);return g}
function helmet(T,col){const g=new T.Group(),m=M(T,col,.35),d=new T.Mesh(new T.SphereGeometry(.132,18,12,0,Math.PI*2,0,Math.PI*.66),m);d.scale.set(1,1,1.1);g.add(d);const mt=M(T,'#9aa3ad',.3);
 const pk=new T.Mesh(new T.BoxGeometry(.2,.012,.09),m);pk.position.set(0,.045,.15);g.add(pk);
 for(const x of[-.06,-.02,.02,.06]){const c=new T.Mesh(new T.CylinderGeometry(.004,.004,.1),mt);c.position.set(x,-.02,.155);g.add(c)}
 for(const y of[.0,-.045]){const c=new T.Mesh(new T.CylinderGeometry(.004,.004,.17),mt);c.rotation.z=Math.PI/2;c.position.set(0,y,.158);g.add(c)}
 for(const s of[-1,1]){const c=new T.Mesh(new T.BoxGeometry(.012,.07,.08),m);c.position.set(s*.125,-.03,.06);g.add(c)}return g}
function hat(T){const g=new T.Group(),m=M(T,'#2b2e33',.8);const cr=new T.Mesh(new T.CylinderGeometry(.1,.115,.1,18),m);cr.position.y=.1;g.add(cr);const br=new T.Mesh(new T.CylinderGeometry(.24,.24,.012,24),m);br.position.y=.04;g.add(br);return g}
/* root: cloned skinned model, g: the person group. returns {update(o)} */
/* stylised face built from primitives: brows, eyes, nose, beard, hair; front is +z of the head bone */
function faceGroup(T,skin,beard,hair){const g=new T.Group(),mat=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r||.8});
 const eye=(sx)=>{const e=new T.Group(),w=new T.Mesh(new T.SphereGeometry(.0115,12,8),mat('#efe9dc',.4));w.scale.set(1.45,.6,.5);const i=new T.Mesh(new T.SphereGeometry(.0068,10,8),mat('#1d120b',.25));i.scale.set(1,.9,.8);i.position.z=.0035;e.add(w,i);e.position.set(sx*.036,.012,.092);return e};
 g.add(eye(-1),eye(1));
 for(const sx of[-1,1]){const b=new T.Mesh(new T.BoxGeometry(.042,.0095,.01),mat('#1b1410'));b.position.set(sx*.037,.033,.097);b.rotation.z=sx*-.07;g.add(b)}
 const nose=new T.Mesh(new T.SphereGeometry(.012,10,8),mat(skin,.7));nose.scale.set(.85,1.25,1.1);nose.position.set(0,-.012,.106);g.add(nose);
 const mo=new T.Mesh(new T.BoxGeometry(.03,.0045,.006),mat('#6b2f2a',.7));mo.position.set(0,-.052,.098);g.add(mo);
 if(beard){const bd=new T.Mesh(new T.SphereGeometry(.045,14,10),new T.MeshStandardMaterial({color:'#2a1c14',roughness:1,transparent:true,opacity:.55}));bd.scale.set(1.25,.85,.85);bd.position.set(0,-.07,.062);g.add(bd)}
 if(hair){const h=new T.Mesh(new T.SphereGeometry(.102,18,10,Math.PI*.5,Math.PI,0,Math.PI*.5),mat(hair,.9));h.position.set(0,.002,-.006);g.add(h)}
 g.scale.setScalar(1.22);return g}
/* the player's real photo wrapped on the front of the head (used when the data provider supplies a usable picture) */
function photoCap(T,img){window.__shPhoto=(window.__shPhoto||0)+1;const t=new T.CanvasTexture(img);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
 const w=img.width||256,h=img.height||256,side=Math.min(w,h);t.repeat.set(side/w*.86,side/h*.9);t.offset.set((1-t.repeat.x)/2,Math.max(0,(1-t.repeat.y)*.4));
 const m=new T.Mesh(new T.SphereGeometry(.125,28,18,Math.PI/2-.55,1.1,Math.PI*.3,Math.PI*.4),new T.MeshStandardMaterial({map:t,roughness:.85,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));return m}
function gAlign(T,hb){const c=hb.children.find(x=>/Middle1$/.test(x.name));const d=c?c.position.clone().normalize():new T.Vector3(0,1,0);return new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d)}
/* batting pad: rounded shell, seven padded cane ridges, domed top flap, knee roll and two straps (length 0.5 along y, scaled to the shin) */
function padMesh(T,wk){const g=new T.Group(),W=wk?'#e9e4d2':'#f7f7f4',R=wk?'#d8cfb4':'#e6e9f2',S='#27386b';
 const shell=new T.Mesh(new T.BoxGeometry(.17,.5,.04),M(T,W,.65));g.add(shell);
 for(let i=-3;i<=3;i++){const c=new T.Mesh(new T.CapsuleGeometry(.0115,.34,4,8),M(T,R,.7));c.position.set(i*.02,-.03,.026);g.add(c)}
 const flap=new T.Mesh(new T.BoxGeometry(.17,.07,.05),M(T,W,.65));flap.position.set(0,.215,.01);g.add(flap);
 const knee=new T.Mesh(new T.CapsuleGeometry(.03,.1,4,10),M(T,W,.6));knee.rotation.z=Math.PI/2;knee.position.set(0,.17,.04);g.add(knee);
 for(const y of[-.12,.04]){const st=new T.Mesh(new T.BoxGeometry(.17,.018,.04),M(T,S,.7));st.position.set(0,y,0);g.add(st)}
 return g}
/* batting glove: wrapped fingers, thumb, padded back and a long cuff. +y runs toward the fingertips, +z is the back of the hand (flipped for the left hand by the caller) */
function gloveMesh(T,wk,side){const g=new T.Group(),inner=new T.Group(),W=wk?'#d8c9a0':'#f4f4f1',P='#e9edf6';inner.name='glv';inner.scale.set(1.38,1.18,1.45);g.add(inner);   /* chunkier gloves like the reference */
 const palm=new T.Mesh(new T.BoxGeometry(.088,.085,.036),M(T,W,.8));palm.position.set(0,.045,0);inner.add(palm);
 const cuff=new T.Mesh(new T.CylinderGeometry(.046,.04,.1,14),M(T,W,.8));cuff.position.set(0,-.04,0);cuff.scale.z=.8;inner.add(cuff);
 const band=new T.Mesh(new T.TorusGeometry(.044,.007,6,16),M(T,'#27386b',.6));band.rotation.x=Math.PI/2;band.position.set(0,-.085,0);band.scale.y=.8;inner.add(band);
 for(let i=0;i<4;i++){const x=-.033+i*.022,f=new T.Mesh(new T.CapsuleGeometry(.0115,.04,4,8),M(T,W,.8));f.rotation.x=Math.PI/2;f.position.set(x,.088,-.02);inner.add(f);
  const pd=new T.Mesh(new T.BoxGeometry(.02,.024,.012),M(T,P,.7));pd.position.set(x,.073,.026);inner.add(pd)}
 const th=new T.Mesh(new T.CapsuleGeometry(.0125,.04,4,8),M(T,W,.8));th.position.set(side==='l'?.05:-.05,.05,-.015);th.rotation.z=side==='l'?-.7:.7;inner.add(th);
 const bk=new T.Mesh(new T.BoxGeometry(.07,.05,.014),M(T,P,.7));bk.position.set(0,.04,.03);inner.add(bk);
 g.userData.fl=1;return g}
export function dress(T,gl,root,g,o){const pal=palette(T,o),kit=o.kit||'field';
 const shirtMat=matCache.get('s')||(matCache.set('s',new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.62,metalness:.04})),matCache.get('s'));
 let names=null;root.traverse(m=>{if(m.isSkinnedMesh&&!names)names=m.skeleton.bones.map(b=>b.name)});
 const src=gl.scene;const srcMesh={};src.traverse(m=>{if(m.isSkinnedMesh)srcMesh[m.name]=m});
 root.traverse(m=>{if(m.isSkinnedMesh){m.frustumCulled=false;const s=srcMesh[m.name]||m;m.geometry=paint(T,s,m.skeleton.bones.map(b=>b.name),pal);m.material=shirtMat}});
 const B=n=>root.getObjectByName('mixamorig'+n),bn={hd:B('Head'),lk:B('LeftLeg'),rk:B('RightLeg'),la:B('LeftFoot'),ra:B('RightFoot'),lh:B('LeftHand'),rh:B('RightHand'),sp:B('Spine2'),la2:B('LeftArm'),ra2:B('RightArm'),lf:B('LeftForeArm'),rf:B('RightForeArm')};
 const K=new T.Group();g.add(K);const parts={};
 const add=(k,obj)=>{K.add(obj);parts[k]=obj;return obj};
 const hcol=new T.Color(o.shirt||'#2563eb').multiplyScalar(.75);
 if(kit==='bat'){if(!o.nohelm)add('head',helmet(T,hcol))}
 else if(kit==='bowl'||kit==='field'||kit==='wk')add('head',cap(T,hcol));
 else if(kit==='ump')add('head',hat(T));
 {const sk=pal.skin.getStyle?'#'+pal.skin.getHexString():'#c68a5a';const bd=(o.name||'').length%3!==1;add('face',o.photo?photoCap(T,o.photo):faceGroup(T,sk,bd,(kit==='bat'||kit==='ump')?null:'#1a1410'))}
 if(kit==='bat'&&o.nohelm)add('head',hairShell(T,'#1d1612'));
 if(kit==='bat'||kit==='wk'){for(const s of['l','r'])add('pad'+s,padMesh(T,kit==='wk'))}
 if(kit==='bat'||kit==='wk')for(const s of['l','r'])add('gl'+s,gloveMesh(T,kit==='wk',s))
 const GOLD=M(T,'#d4af37',.35),showKit=kit==='bat'||kit==='bowl'||kit==='field'||kit==='wk'||kit==='soccer';
 if(showKit){const col=new T.Mesh(new T.TorusGeometry(.082,.012,8,24),GOLD);col.rotation.x=Math.PI/2;col.scale.z=.35;add('collar',col);for(const s of['l','r']){const b=new T.Mesh(new T.TorusGeometry(.046,.007,6,16),GOLD);add('band'+s,b)}if(kit==='bat'||kit==='wk')for(const s of['l','r']){const w=new T.Mesh(new T.CylinderGeometry(.036,.034,.05,14,1,true),new T.MeshStandardMaterial({color:o.accent||'#d7263d',roughness:.9,side:T.DoubleSide}));w.rotation.x=Math.PI/2;const wg=new T.Group();wg.add(w);add('wr'+s,wg)}   /* red wristbands like the reference */
  const lg=new T.Mesh(new T.PlaneGeometry(.1,.05),new T.MeshBasicMaterial({map:logoTex(T,'#e8cf7a'),transparent:true,depthWrite:false}));add('logo',lg)}
 let plane=null;if(o.name&&kit!=='ump'){const t=nameTex(T,o.name,'#ffffff');plane=new T.Mesh(new T.PlaneGeometry(.4,.15),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));plane.rotation.y=Math.PI;K.add(plane)}
 const v=new T.Vector3(),w=new T.Vector3(),q=new T.Quaternion(),gq=new T.Quaternion(),up=new T.Vector3(0,1,0),fw=new T.Vector3(0,0,1);
 const loc=(b,out)=>{b.getWorldPosition(out);return g.worldToLocal(out)};
 return{update(){g.updateMatrixWorld(true);g.getWorldQuaternion(gq);gq.invert();
  if(parts.head&&bn.hd){loc(bn.hd,v);bn.hd.getWorldQuaternion(q);q.premultiply(gq);parts.head.position.copy(v).add(new T.Vector3(0,.115,.015).applyQuaternion(q));parts.head.quaternion.copy(q)}
  if(parts.face&&bn.hd){loc(bn.hd,v);bn.hd.getWorldQuaternion(q);q.premultiply(gq);parts.face.position.copy(v).add(new T.Vector3(0,.115,.015).applyQuaternion(q));parts.face.quaternion.copy(q)}
  for(const s of['l','r']){const p=parts['pad'+s];if(p){const a=loc(s==='l'?bn.lk:bn.rk,v).clone(),b=loc(s==='l'?bn.la:bn.ra,w).clone(),d=b.clone().sub(a),len=d.length();p.scale.set(1,len*1.02/.5,1);p.position.copy(a).add(b).multiplyScalar(.5);const kb=s==='l'?bn.lk:bn.rk;kb.getWorldQuaternion(q);q.premultiply(gq);p.position.add(new T.Vector3(0,0,.07).applyQuaternion(q));q.setFromUnitVectors(up,d.normalize().negate());p.quaternion.copy(q)}
   const gv=parts['gl'+s];if(gv){const hb=s==='l'?bn.lh:bn.rh;loc(hb,v);gv.position.copy(v);hb.getWorldQuaternion(q);q.premultiply(gq);gv.quaternion.copy(q).multiply(gv.userData.al||(gv.userData.al=gAlign(T,hb)))}}
  if(parts.collar&&bn.sp){loc(bn.sp,v);bn.sp.getWorldQuaternion(q);q.premultiply(gq);parts.collar.position.copy(v).add(new T.Vector3(0,.17,.01).applyQuaternion(q));parts.collar.quaternion.copy(q).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2))}
  if(parts.logo&&bn.sp){loc(bn.sp,v);bn.sp.getWorldQuaternion(q);q.premultiply(gq);parts.logo.position.copy(v).add(new T.Vector3(.07,.045,.14).applyQuaternion(q));parts.logo.quaternion.copy(q)}
  for(const s of['l','r']){const wr=parts['wr'+s];if(wr){const a=loc(s==='l'?bn.lf:bn.rf,v).clone(),b=loc(s==='l'?bn.lh:bn.rh,w).clone(),d=b.clone().sub(a);wr.position.copy(a).addScaledVector(d,.82);q.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());wr.quaternion.copy(q)}}
  for(const s of['l','r']){const bd=parts['band'+s];if(bd){const a=loc(s==='l'?bn.la2:bn.ra2,v).clone(),b=loc(s==='l'?bn.lf:bn.rf,w).clone(),d=b.clone().sub(a);bd.position.copy(a).addScaledVector(d,.8);q.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());bd.quaternion.copy(q)}}
  if(plane&&bn.sp){loc(bn.sp,v);bn.sp.getWorldQuaternion(q);q.premultiply(gq);const off=new T.Vector3(0,-.01,-.135).applyQuaternion(q);plane.position.copy(v).add(off);plane.quaternion.copy(q).multiply(new T.Quaternion().setFromAxisAngle(up,Math.PI))}}}}
