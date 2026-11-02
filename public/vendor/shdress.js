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
function nameTex(T,name,col){const k=name+'|'+col;let t=texCache.get(k);if(t)return t;const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.clearRect(0,0,256,96);x.fillStyle=col;x.font='900 44px Arial Black,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';let s=String(name).toUpperCase();while(x.measureText(s).width>240&&s.length>3)s=s.slice(0,-1);x.fillText(s,128,48);t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;texCache.set(k,t);return t}
const M=(T,c,r)=>new T.MeshStandardMaterial({color:c,roughness:r==null?.6:r,metalness:.05});
function cap(T,col){const g=new T.Group(),m=M(T,col,.7),d=new T.Mesh(new T.SphereGeometry(.125,16,10,0,Math.PI*2,0,Math.PI*.55),m);g.add(d);const pk=new T.Mesh(new T.BoxGeometry(.2,.012,.12),m);pk.position.set(0,.03,.14);pk.rotation.x=.12;g.add(pk);return g}
function helmet(T,col){const g=new T.Group(),m=M(T,col,.35),d=new T.Mesh(new T.SphereGeometry(.132,18,12,0,Math.PI*2,0,Math.PI*.66),m);d.scale.set(1,1,1.1);g.add(d);const mt=M(T,'#9aa3ad',.3);
 const pk=new T.Mesh(new T.BoxGeometry(.2,.012,.09),m);pk.position.set(0,.045,.15);g.add(pk);
 for(const x of[-.06,-.02,.02,.06]){const c=new T.Mesh(new T.CylinderGeometry(.004,.004,.1),mt);c.position.set(x,-.02,.155);g.add(c)}
 for(const y of[.0,-.045]){const c=new T.Mesh(new T.CylinderGeometry(.004,.004,.17),mt);c.rotation.z=Math.PI/2;c.position.set(0,y,.158);g.add(c)}
 for(const s of[-1,1]){const c=new T.Mesh(new T.BoxGeometry(.012,.07,.08),m);c.position.set(s*.125,-.03,.06);g.add(c)}return g}
function hat(T){const g=new T.Group(),m=M(T,'#2b2e33',.8);const cr=new T.Mesh(new T.CylinderGeometry(.1,.115,.1,18),m);cr.position.y=.1;g.add(cr);const br=new T.Mesh(new T.CylinderGeometry(.24,.24,.012,24),m);br.position.y=.04;g.add(br);return g}
/* root: cloned skinned model, g: the person group. returns {update(o)} */
export function dress(T,gl,root,g,o){const pal=palette(T,o),kit=o.kit||'field';
 const shirtMat=matCache.get('s')||(matCache.set('s',new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.62,metalness:.04})),matCache.get('s'));
 let names=null;root.traverse(m=>{if(m.isSkinnedMesh&&!names)names=m.skeleton.bones.map(b=>b.name)});
 const src=gl.scene;const srcMesh={};src.traverse(m=>{if(m.isSkinnedMesh)srcMesh[m.name]=m});
 root.traverse(m=>{if(m.isSkinnedMesh){m.frustumCulled=false;const s=srcMesh[m.name]||m;m.geometry=paint(T,s,m.skeleton.bones.map(b=>b.name),pal);m.material=shirtMat}});
 const B=n=>root.getObjectByName('mixamorig'+n),bn={hd:B('Head'),lk:B('LeftLeg'),rk:B('RightLeg'),la:B('LeftFoot'),ra:B('RightFoot'),lh:B('LeftHand'),rh:B('RightHand'),sp:B('Spine2')};
 const K=new T.Group();g.add(K);const parts={};
 const add=(k,obj)=>{K.add(obj);parts[k]=obj;return obj};
 const hcol=new T.Color(o.shirt||'#2563eb').multiplyScalar(.75);
 if(kit==='bat')add('head',helmet(T,hcol));
 else if(kit==='bowl'||kit==='field'||kit==='wk')add('head',cap(T,hcol));
 else if(kit==='ump')add('head',hat(T));
 if(kit==='bat'||kit==='wk'){for(const s of['l','r']){const p=new T.Mesh(new T.BoxGeometry(.13,.5,.07),M(T,kit==='wk'?'#e9e4d2':'#f5f5f2',.7));add('pad'+s,p)}}
 if(kit==='bat'||kit==='wk')for(const s of['l','r']){const gv=new T.Mesh(new T.SphereGeometry(kit==='wk'?.075:.06,10,8),M(T,kit==='wk'?'#d8c9a0':'#f2f2f2',.8));add('gl'+s,gv)}
 let plane=null;if(o.name&&kit!=='ump'){const t=nameTex(T,o.name,'#ffffff');plane=new T.Mesh(new T.PlaneGeometry(.4,.15),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));plane.rotation.y=Math.PI;K.add(plane)}
 const v=new T.Vector3(),w=new T.Vector3(),q=new T.Quaternion(),gq=new T.Quaternion(),up=new T.Vector3(0,1,0),fw=new T.Vector3(0,0,1);
 const loc=(b,out)=>{b.getWorldPosition(out);return g.worldToLocal(out)};
 return{update(){g.updateMatrixWorld(true);g.getWorldQuaternion(gq);gq.invert();
  if(parts.head&&bn.hd){loc(bn.hd,v);bn.hd.getWorldQuaternion(q);q.premultiply(gq);parts.head.position.copy(v).add(new T.Vector3(0,.115,.015).applyQuaternion(q));parts.head.quaternion.copy(q)}
  for(const s of['l','r']){const p=parts['pad'+s];if(p){const a=loc(s==='l'?bn.lk:bn.rk,v).clone(),b=loc(s==='l'?bn.la:bn.ra,w).clone(),d=b.clone().sub(a),len=d.length();p.scale.set(1,len*1.02/.5,1);p.position.copy(a).add(b).multiplyScalar(.5).add(new T.Vector3(0,0,.045));q.setFromUnitVectors(up,d.normalize());p.quaternion.copy(q)}
   const gv=parts['gl'+s];if(gv){loc(s==='l'?bn.lh:bn.rh,v);gv.position.copy(v)}}
  if(plane&&bn.sp){loc(bn.sp,v);bn.sp.getWorldQuaternion(q);q.premultiply(gq);const off=new T.Vector3(0,-.01,-.135).applyQuaternion(q);plane.position.copy(v).add(off);plane.quaternion.copy(q).multiply(new T.Quaternion().setFromAxisAngle(up,Math.PI))}}}}
