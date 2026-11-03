/* Scoring Heroes - batting playback for the app's Mixamo (Xbot) avatars (runtime, no solver).
   Plays pose tables baked offline from the batting master + two-hand grip solver (see shbatting.js / tools/bake-batting.cjs).
     const SBP=create(THREE); const a=SBP.makeBatter(clonedXbotScene, parentGroup, 'R'|'L');
     each frame AFTER mixer.update(): SBP.playBaked(a, table, tSeconds)   (table = fetched /vendor/batpose/<SHOT>_<R|L>.json)
*/
import * as BM from './batting-master.js';
import {build as batBuild} from './shbat.js';
export {BM};
export function create(THREE){
const D2R=Math.PI/180,Q=new THREE.Quaternion(),E=new THREE.Euler();

const BONES=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
const BASE={LeftArm:[70,0,0],RightArm:[70,0,0],LeftForeArm:[0,0,12],RightForeArm:[0,0,-12],Spine:[4,0,0]};
function pose(a,p){for(const n in a.bones){const r=p[n]||BASE[n]||[0,0,0];E.set(r[0]*D2R,r[1]*D2R,r[2]*D2R,'XYZ');Q.setFromEuler(E);a.bones[n].forEach((b,i)=>b.quaternion.copy(a.rest[n].q[i]).multiply(Q))}
 a.bones.Hips.forEach((b,i)=>{const hp=a.rest.Hips.p[i];b.position.set(hp.x,hp.y+(p._y||0),hp.z+(p._z||0))});
 const o=p._r||[0,0,0];a.root.position.set(a.home[0]+o[0],a.home[1]+o[1],a.home[2]+o[2]);a.root.rotation.set(0,a.face+(p._ry||0)*D2R,0);a.pivot.rotation.set((p._rx||0)*D2R,0,(p._rz||0)*D2R)}
function surf(a,name){let r=null;a.model.traverse(o=>{if(o.isSkinnedMesh&&/Surface/.test(o.name)&&!r)r=o.skeleton.bones.find(b=>b.name.replace(/^mixamorig:?/,'')===name)});return r}
const GRIPN={L:-1,R:-1};
function gripFrame(a,hand){const hb=surf(a,hand==='L'?'LeftHand':'RightHand'),fb=surf(a,hand==='L'?'LeftHandMiddle1':'RightHandMiddle1');const d=fb.position.clone().normalize(),L=fb.position.length();const gp=d.clone().multiplyScalar(L*.55).add(new THREE.Vector3(0,0,GRIPN[hand]*L*.38));const ax=d.clone().applyAxisAngle(new THREE.Vector3(0,0,1),(hand==='L'?-1:1)*a.cock*D2R).normalize();const U=d.clone().sub(ax.clone().multiplyScalar(d.dot(ax))).normalize(),N=new THREE.Vector3(0,0,GRIPN[hand]);return{hb,gp,ax,U,N}}
function footPos(a,side){const f=surf(a,side+'Foot');a.root.updateMatrixWorld(true);return f.getWorldPosition(new THREE.Vector3())}
function attachBat(a,hand){if(a.bat){a.bat.parent&&a.bat.parent.remove(a.bat)}const hb=surf(a,hand==='L'?'LeftHand':'RightHand');if(!hb)return;
 const F=gripFrame(a,hand),g=new THREE.Group();
 const bat=batBuild(THREE,new THREE.MeshStandardMaterial({color:0xd9b36a,roughness:.7}),new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:.9}));
 bat.scale.setScalar(100);bat.position.set(0,1.5,0);g.add(bat);
 const bx=new THREE.Vector3().crossVectors(F.ax,F.N).normalize(),M4=new THREE.Matrix4().makeBasis(bx,F.ax.clone(),F.N.clone());
 g.quaternion.setFromRotationMatrix(M4);g.position.copy(F.gp);
 const blade=new THREE.Object3D();blade.position.set(0,-.46,0);bat.add(blade);
 hb.add(g);a.bat=g;a.batBlade=blade;a.hand=hand}
/* model: the cloned Xbot scene; g: its parent group (world position/yaw are owned by the app) */
function makeBatter(model,g,hand,ref){
 const root=new THREE.Group(),pivot=new THREE.Group();g.add(root);root.add(pivot);pivot.add(model);
 const bones={};model.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(BONES.includes(n))(bones[n]=bones[n]||[]).push(o)}});
 /* rest pose comes from the untouched source model when given (the app's clone is already being moved by its idle mixer) */
 const rb={};(ref||model).traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(BONES.includes(n))(rb[n]=rb[n]||[]).push(o)}});
 const rest={};for(const n in bones){const src=rb[n]&&rb[n].length===bones[n].length?rb[n]:bones[n];rest[n]={q:src.map(b=>b.quaternion.clone()),p:src.map(b=>b.position.clone())}}
 const a={role:'batter',root,pivot,model,g,bones,rest,home:[0,0,0],face:0,clip:null,t:0,cock:-75,hand};
 a.ck=()=>{g.updateWorldMatrix(true,false);const p=g.getWorldPosition(new THREE.Vector3());return Math.round(p.x*100)+','+Math.round(p.z*100)+','+Math.round(g.rotation.y*100)+'|'};
 g.updateWorldMatrix(true,true);pose(a,{});root.updateMatrixWorld(true);a.fh=Math.min(footPos(a,'Left').y,footPos(a,'Right').y);
 model.traverse(o=>{if(/Hand(Thumb|Index|Middle|Ring|Pinky)\d$/.test(o.name))o.scale.setScalar(.001)});
 attachBat(a,hand);return a}

function playBaked(a,tab,t){const n=tab.f.length,x=Math.max(0,Math.min(tab.dur,t))*tab.fps,i=Math.min(n-1,Math.floor(x)),j=Math.min(n-1,i+1),u=x-i,A=tab.f[i],B=tab.f[j],p={};let m=0;
 for(const [k,w] of tab.keys){if(w===3){p[k]=[A[m]+(B[m]-A[m])*u,A[m+1]+(B[m+1]-A[m+1])*u,A[m+2]+(B[m+2]-A[m+2])*u];m+=3}else{p[k]=A[m]+(B[m]-A[m])*u;m+=1}}
 pose(a,p)}

return{makeBatter,playBaked,pose,attachBat,BM}}
