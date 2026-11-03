/* Scoring Heroes - batting driver for the app's Mixamo (Xbot) avatars.
   Extracted from the batting lab: batting-master clips (86 shots, right/left hand) -> Mixamo bones,
   leg pins, the user's SH bat (shbat.js) and a two-hand grip solver (both hands on the handle, same wrap,
   bat kept out of the body and ground). Usage:
     const SBT=create(THREE); const a=SBT.makeBatter(model, parentGroup, 'R'|'L');
     each frame AFTER mixer.update(): SBT.play(a, shotId, tSeconds)  or  SBT.stance(a)
*/
import * as BM from './batting-master.js';
import {build as batBuild} from './shbat.js';
export function create(THREE){
const D2R=Math.PI/180,Q=new THREE.Quaternion(),E=new THREE.Euler();let LASTP=null;const PIN_CACHE=new Map();
const BONES=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
const P=o=>{const p={};const l=o.lean||0;p.Spine=[l*.6+4,(o.twist||0)*.5,0];p.Spine1=[l*.4,(o.twist||0)*.5,0];p.Neck=[o.head||0,(o.hy||0)*.6,0];p.Head=[(o.head||0)*.3,(o.hy||0)*.4,0];
 const aL=o.aL||[0,0,12],aR=o.aR||[0,0,12];
 p.LeftArm=[70-aL[1],0,aL[0]];p.LeftForeArm=[0,0,aL[2]];p.RightArm=[70-aR[1],0,-aR[0]];p.RightForeArm=[0,0,-aR[2]];
 const lL=o.lL||[0,0],lR=o.lR||[0,0];p.LeftUpLeg=[lL[0],0,0];p.LeftLeg=[-lL[1],0,0];p.RightUpLeg=[lR[0],0,0];p.RightLeg=[-lR[1],0,0];
 p._y=o.y||0;p._r=o.r||[0,0,0];p._ry=o.ry||0;p._rx=o.rx||0;p._rz=o.rz||0;return p};
const BASE={LeftArm:[70,0,0],RightArm:[70,0,0],LeftForeArm:[0,0,12],RightForeArm:[0,0,-12],Spine:[4,0,0]};
function pose(a,p){for(const n in a.bones){const r=p[n]||BASE[n]||[0,0,0];E.set(r[0]*D2R,r[1]*D2R,r[2]*D2R,'XYZ');Q.setFromEuler(E);a.bones[n].forEach((b,i)=>b.quaternion.copy(a.rest[n].q[i]).multiply(Q))}
 a.bones.Hips.forEach((b,i)=>{const hp=a.rest.Hips.p[i];b.position.set(hp.x,hp.y+(p._y||0),hp.z+(p._z||0))});
 const o=p._r||[0,0,0];a.root.position.set(a.home[0]+o[0],a.home[1]+o[1],a.home[2]+o[2]);a.root.rotation.set(0,a.face+(p._ry||0)*D2R,0);a.pivot.rotation.set((p._rx||0)*D2R,0,(p._rz||0)*D2R)}
function surf(a,name){let r=null;a.model.traverse(o=>{if(o.isSkinnedMesh&&/Surface/.test(o.name)&&!r)r=o.skeleton.bones.find(b=>b.name.replace(/^mixamorig:?/,'')===name)});return r}
const GRIPN={L:-1,R:-1};
function gripFrame(a,hand){const hb=surf(a,hand==='L'?'LeftHand':'RightHand'),fb=surf(a,hand==='L'?'LeftHandMiddle1':'RightHandMiddle1');const d=fb.position.clone().normalize(),L=fb.position.length();const gp=d.clone().multiplyScalar(L*.55).add(new THREE.Vector3(0,0,GRIPN[hand]*L*.38));const ax=d.clone().applyAxisAngle(new THREE.Vector3(0,0,1),(hand==='L'?-1:1)*a.cock*D2R).normalize();const U=d.clone().sub(ax.clone().multiplyScalar(d.dot(ax))).normalize(),N=new THREE.Vector3(0,0,GRIPN[hand]);return{hb,gp,ax,U,N}}
function footPos(a,side){const f=surf(a,side+'Foot');a.root.updateMatrixWorld(true);return f.getWorldPosition(new THREE.Vector3())}
function groundFix(a){a.root.updateMatrixWorld(true);const l=footPos(a,'Left'),r=footPos(a,'Right');a.root.position.y-=Math.min(l.y,r.y)-a.fh}
let WB=null;const GRIP={on:true,faceK:.35,reach:9.5,err:0,axErr:0,pen:0,seed:null,clear:true};
function bodyCaps(a){const W=n=>surf(a,n).getWorldPosition(new THREE.Vector3());const C=[];const H=W('Hips'),S2=W('Spine2'),NK=W('Neck');C.push([H,S2,.17],[S2,NK,.16]);
 for(const sd of['Left','Right']){const u=W(sd+'UpLeg'),k=W(sd+'Leg'),f=W(sd+'Foot');C.push([u,k,.12],[k,f,.125])}return C}
function segDist(p,A,B){const ab=B.clone().sub(A),t=Math.max(0,Math.min(1,p.clone().sub(A).dot(ab)/ab.lengthSq()));return p.distanceTo(A.clone().add(ab.multiplyScalar(t)))}
function gripSolve(a,p){if(!GRIP.on||!a.bat||a.role!=='batter')return;const topH=a.hand==='R'?'L':'R',top=topH==='L'?'Left':'Right',bot=a.hand==='R'?'Right':'Left',sT=top==='Left'?1:-1,sB=-sT;
 const hb=a.bat.parent,F=gripFrame(a,a.hand),FT=gripFrame(a,topH),th=FT.hb;
 const tgtL=F.gp.clone().add(F.ax.clone().multiplyScalar(GRIP.reach));
 const N=[top+'Arm',top+'ForeArm',top+'Hand',bot+'Arm',bot+'ForeArm',bot+'Hand'];
 const lim=[[-170,150],[-200,200],[sT>0?0:-155,sT>0?155:0],[-100,100],[-120,120],[-60,60],[-60,60],[-60,60],[-170,150],[-200,200],[sB>0?0:-155,sB>0?155:0],[-100,100],[-70,70],[-70,70],[-70,70]];
 const o=N.map(n=>(p[n]||[0,0,0]).slice());
 const v0=[o[0][0],o[0][2],o[1][2],o[0][1],o[1][1],o[2][0],o[2][1],o[2][2],o[3][0],o[3][2],o[4][2],o[3][1],o[5][0],o[5][1],o[5][2]];
 const v=v0.slice();
 const put=()=>{p[N[0]]=[v[0],v[3],v[1]];p[N[1]]=[0,v[4],v[2]];p[N[2]]=[v[5],v[6],v[7]];p[N[3]]=[v[8],v[11],v[9]];p[N[4]]=[0,0,v[10]];p[N[5]]=[v[12],v[13],v[14]]};
 const tw=new THREE.Vector3(),pw=new THREE.Vector3(),a1=new THREE.Vector3(),a2=new THREE.Vector3(),q=new THREE.Vector3();
 const SB=[-16,-28,-40,-52,-64,-75];
 let AX0=null;const axw=new THREE.Vector3();
 const err=()=>{put();pose(a,p);a.root.updateMatrixWorld(true);tw.copy(tgtL);hb.localToWorld(tw);pw.copy(FT.gp);th.localToWorld(pw);
  a1.copy(F.U).transformDirection(hb.matrixWorld);a2.copy(FT.U).transformDirection(th.matrixWorld);
  const n1=F.N.clone().transformDirection(hb.matrixWorld),n2=FT.N.clone().transformDirection(th.matrixWorld);
  const e=[tw.x-pw.x,tw.y-pw.y,tw.z-pw.z,(a1.x-a2.x)*.12,(a1.y-a2.y)*.12,(a1.z-a2.z)*.12,(n1.x-n2.x)*.12,(n1.y-n2.y)*.12,(n1.z-n2.z)*.12];
  axw.copy(F.ax).transformDirection(hb.matrixWorld);if(!AX0){AX0=new THREE.Vector3(0,.97,.12).transformDirection(a.root.matrixWorld)}e.push((axw.x-AX0.x)*.25,(axw.y-AX0.y)*.25,(axw.z-AX0.z)*.25);{const fw=GRIP.faceW||0,fd=a.root.matrixWorld.elements;e.push(fw*(n1.x-fd[8]),fw*(n1.y-fd[9]),fw*(n1.z-fd[10]))}
  if(GRIP.clear){const caps=bodyCaps(a);let worst=0;for(const s of SB){q.copy(F.gp).add(F.ax.clone().multiplyScalar(s));hb.localToWorld(q);let pen=0;for(const [A,B,r] of caps){const c=segDist(q,A,B)-(r+.0);if(-c>pen)pen=-c}e.push(pen);worst=Math.max(worst,pen)}
   for(const s of SB){q.copy(F.gp).add(F.ax.clone().multiplyScalar(s));hb.localToWorld(q);e.push(Math.max(0,.02-q.y))}GRIP.pen=worst}
  return e};
 const nrm=e=>Math.hypot(e[0],e[1],e[2]),nrmA=e=>Math.hypot(e[3],e[4],e[5],e[6],e[7],e[8])/.12,nrmP=e=>{let m=0;for(let i=15;i<e.length;i++)m=Math.max(m,e[i]);return m};
 const ok=e=>nrm(e)<.006&&nrmA(e)<.12&&nrmP(e)<.006;
 const solve=(A,b)=>{const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let i=0;i<n;i++){let m=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[m][i]))m=r;[M[i],M[m]]=[M[m],M[i]];for(let r=0;r<n;r++)if(r!==i){const f=M[r][i]/M[i][i];for(let c=i;c<=n;c++)M[r][c]-=f*M[i][c]}}return M.map((r,i)=>r[n]/r[i])};
 const run1=(K,wts,its)=>{let e=err();
  for(let it=0;it<its&&!ok(e);it++){const R=e.length,J=Array.from({length:R},()=>[]);for(let k=0;k<K;k++){const s=v[k];v[k]=s+2;const e2=err();v[k]=s;for(let r=0;r<R;r++)J[r][k]=(e[r]-e2[r])/2}
   const A=[];for(let i=0;i<R;i++){A.push([]);for(let j=0;j<R;j++){let s=0;for(let k=0;k<K;k++)s+=J[i][k]*J[j][k]*wts[k]*wts[k];A[i].push(s+(i===j?1e-5:0))}}
   const y=solve(A,e);for(let k=0;k<K;k++){let s=0;for(let i=0;i<R;i++)s+=J[i][k]*y[i];s*=wts[k]*wts[k];v[k]=Math.max(lim[k][0],Math.min(lim[k][1],v[k]+Math.max(-40,Math.min(40,s))))}
   e=err()}return e};
 const score=e=>nrm(e)+nrmA(e)*.01+nrmP(e)*.5;const T0=performance.now();
 const W1=[1,1,1,1,.7,.5,.5,.5,.4,.4,.4,.4,.5,.5,.5];
 let e=run1(15,W1,10),best=[v.slice(),score(e)];
 if(!ok(e)){const st=[[20,100*sT,100*sT,0],[-60,150*sT,90*sT,0],[60,40*sT,40*sT,0],[-100,120*sT,60*sT,30]];
  for(let s=0;s<st.length&&!ok(e)&&performance.now()-T0<250;s++){for(let k=0;k<12;k++)v[k]=v0[k];for(let k=0;k<4;k++)v[k]=st[s][k];for(let k=4;k<8;k++)v[k]=0;e=run1(15,W1,14);const m=score(e);if(m<best[1])best=[v.slice(),m]}
  for(let k=0;k<15;k++)v[k]=best[0][k];e=run1(15,W1,6)}
 GRIP.err=nrm(e);GRIP.axErr=nrmA(e)*57.3;GRIP.pen=nrmP(e);put()}
function rawSample(a,clip,t,over,sh){a.root.position.set(a.home[0]+(sh?sh[0]:0),a.home[1],a.home[2]+(sh?sh[1]:0));const p=P(clip.f(t));if(over)Object.assign(p,over);if(WB&&a.bat){p[a.hand==='R'?'RightHand':'LeftHand']=WB.slice()}{const u=clip.dur?t/clip.dur:t;GRIP.faceW=a.role==='batter'?GRIP.faceK*Math.max(0,Math.min(1,1-(u-.05)/.2)):0}gripSolve(a,p);if(sh)p._r=[p._r[0]+sh[0],p._r[1],p._r[2]+sh[1]];pose(a,p);groundFix(a);a.root.updateMatrixWorld(true);LASTP=p;return p}
function legIK(a,side,target,pOut){const hip=surf(a,side+'UpLeg'),knee=surf(a,side+'Leg'),foot=surf(a,side+'Foot');a.root.updateMatrixWorld(true);
 const H=hip.getWorldPosition(new THREE.Vector3()),K=knee.getWorldPosition(new THREE.Vector3()),F=foot.getWorldPosition(new THREE.Vector3());
 const l1=H.distanceTo(K),l2=K.distanceTo(F);const yaw=a.face+(pOut._ry||0)*D2R,f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 const dv=target.clone().sub(H);const dx=dv.dot(f),dy=dv.y;let D=Math.hypot(dx,dy);D=Math.min(l1+l2-1e-4,Math.max(Math.abs(l1-l2)+1e-3,D));
 const th=Math.atan2(dx,-dy),al=Math.acos(Math.min(1,Math.max(-1,(l1*l1+D*D-l2*l2)/(2*l1*D)))),phi=Math.acos(Math.min(1,Math.max(-1,(l1*l1+l2*l2-D*D)/(2*l1*l2))));
 const hipX=(th+al)/D2R,kneeFlex=(Math.PI-phi)/D2R;return[hipX,-kneeFlex]}
function shiftAt(a,clip,t){const A=clip.pins[0];if(t<A.from)return[0,0];const key=a.ck()+a.role+clip.id+clip.hand+A.foot+'A';let tg=PIN_CACHE.get(key);if(!tg){rawSample(a,clip,A.at);tg=footPos(a,A.foot).clone();PIN_CACHE.set(key,tg)}
 rawSample(a,clip,t);const fp=footPos(a,A.foot),w=1-BM.__S(BM.TIMING.hold,BM.TIMING.end,t);return[(tg.x-fp.x)*w,(tg.z-fp.z)*w]}
function pinTarget(a,clip,pn){const key=a.ck()+a.role+clip.id+clip.hand+pn.foot+pn.at;let tg=PIN_CACHE.get(key);if(!tg){const sh=shiftAt(a,clip,pn.at);rawSample(a,clip,pn.at,null,sh);tg=footPos(a,pn.foot).clone();PIN_CACHE.set(key,tg)}return tg}
function sample(a,clip,t,opt){const pins=clip.pins||[];let raw=rawSample(a,clip,t);if(!pins.length)return;
 const w=1-BM.__S(BM.TIMING.hold,BM.TIMING.end,t);const act=pins.filter(pn=>t>=pn.from);if(!act.length)return;
 const sh=shiftAt(a,clip,t);const over={};
 for(const pn of act){const tg=pinTarget(a,clip,pn);raw=rawSample(a,clip,t,null,sh);const ik=legIK(a,pn.foot,tg,raw);const cur=[raw[pn.foot+'UpLeg'][0],raw[pn.foot+'Leg'][0]];
  over[pn.foot+'UpLeg']=[cur[0]+(ik[0]-cur[0])*w,0,0];over[pn.foot+'Leg']=[cur[1]+(ik[1]-cur[1])*w,0,0]}
 rawSample(a,clip,t,over,sh);a.root.updateMatrixWorld(true);
 // lateral (hip abduction) correction by secant iteration so the pinned foot stays put sideways too
 const yaw=a.face+(raw._ry||0)*D2R,sv=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 for(const pn of act){const tg=pinTarget(a,clip,pn);const lat=()=>{a.root.updateMatrixWorld(true);return tg.clone().sub(footPos(a,pn.foot)).dot(sv)};
  let z0=0,e0=lat();if(Math.abs(e0)<.004)continue;const k=pn.foot+'UpLeg';over[k]=over[k].slice();let z1=2;over[k][2]=z1;rawSample(a,clip,t,over,sh);let e1=lat();
  for(let it=0;it<3&&Math.abs(e1)>.004&&Math.abs(e1-e0)>1e-6;it++){const z2=z1-e1*(z1-z0)/(e1-e0);z0=z1;e0=e1;z1=Math.max(-25,Math.min(25,z2));over[k][2]=z1;rawSample(a,clip,t,over,sh);e1=lat()}}
 a.root.updateMatrixWorld(true)}
function batClip(id,hand){const c=BM.buildClip(id,hand),sh=c.shot,T=BM.TIMING;const front=hand==='R'?'Left':'Right',back=hand==='R'?'Right':'Left';
 c.pins=sh.ft==='F'?[{foot:back,from:0,at:0},{foot:front,from:T.hit-.12,at:T.hit-.12}]:sh.ft==='B'?[{foot:front,from:0,at:0},{foot:back,from:T.hit-.12,at:T.hit-.12}]:[{foot:front,from:0,at:0},{foot:back,from:0,at:0}];return c}
function batPose(a,clip,t){const key=a.role+'|'+clip.id+'|'+clip.hand;if(!clip.tabs)clip.tabs={};let tab=clip.tabs[a.role];
 if(!tab){tab=[];const N=Math.ceil(clip.dur*60)+1;for(let i=0;i<N;i++){sample(a,clip,Math.min(clip.dur,i/60));const p=LASTP;const q=Object.assign({},p);q._r=[a.root.position.x-a.home[0],a.root.position.y-a.home[1],a.root.position.z-a.home[2]];tab.push(q)}clip.tabs[a.role]=tab}
 const i=Math.min(tab.length-1,Math.max(0,Math.round(t*60)));pose(a,tab[i])}
function attachBat(a,hand){if(a.bat){a.bat.parent&&a.bat.parent.remove(a.bat)}const hb=surf(a,hand==='L'?'LeftHand':'RightHand');if(!hb)return;
 const F=gripFrame(a,hand),g=new THREE.Group();
 const bat=batBuild(THREE,new THREE.MeshStandardMaterial({color:0xd9b36a,roughness:.7}),new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:.9}));
 bat.scale.setScalar(100);bat.position.set(0,1.5,0);g.add(bat);
 const bx=new THREE.Vector3().crossVectors(F.ax,F.N).normalize(),M4=new THREE.Matrix4().makeBasis(bx,F.ax.clone(),F.N.clone());
 g.quaternion.setFromRotationMatrix(M4);g.position.copy(F.gp);
 const blade=new THREE.Object3D();blade.position.set(0,-.46,0);bat.add(blade);
 hb.add(g);a.bat=g;a.batBlade=blade;a.hand=hand}
/* model: the cloned Xbot scene; g: its parent group (world position/yaw are owned by the app) */
function makeBatter(model,g,hand){
 const root=new THREE.Group(),pivot=new THREE.Group();g.add(root);root.add(pivot);pivot.add(model);
 const bones={};model.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(BONES.includes(n))(bones[n]=bones[n]||[]).push(o)}});
 const rest={};for(const n in bones)rest[n]={q:bones[n].map(b=>b.quaternion.clone()),p:bones[n].map(b=>b.position.clone())};
 const a={role:'batter',root,pivot,model,g,bones,rest,home:[0,0,0],face:0,clip:null,t:0,cock:-75,hand};
 a.ck=()=>{g.updateWorldMatrix(true,false);const p=g.getWorldPosition(new THREE.Vector3());return Math.round(p.x*100)+','+Math.round(p.z*100)+','+Math.round(g.rotation.y*100)+'|'};
 g.updateWorldMatrix(true,true);pose(a,{});root.updateMatrixWorld(true);a.fh=Math.min(footPos(a,'Left').y,footPos(a,'Right').y);
 model.traverse(o=>{if(/Hand(Thumb|Index|Middle|Ring|Pinky)\d$/.test(o.name))o.scale.setScalar(.001)});
 attachBat(a,hand);return a}
const clips=new Map();
function clipFor(a,id){const k=id+'|'+a.hand;let c=clips.get(k);if(!c){c=batClip(id,a.hand);clips.set(k,c)}return c}
function stance(a){sample(a,clipFor(a,'DF_FWD'),0)}
function play(a,id,t){const c=clipFor(a,id);sample(a,c,Math.max(0,Math.min(c.dur,t)));return c.dur}

/* ---- baked tables: the grip solver is slow (~0.4 s/frame), so poses are baked offline at 30 Hz and played back in real time ---- */
function bake(a,id,fps){fps=fps||30;const c=clipFor(a,id),N=Math.ceil(c.dur*fps),frames=[],keys=new Set();let mg=0,ma=0,mp=0;
 for(let i=0;i<=N;i++){sample(a,c,Math.min(c.dur,i/fps));mg=Math.max(mg,GRIP.err);ma=Math.max(ma,GRIP.axErr);mp=Math.max(mp,GRIP.pen);const p=Object.assign({},LASTP);p._r=[a.root.position.x-a.home[0],a.root.position.y-a.home[1],a.root.position.z-a.home[2]];frames.push(p);for(const k in p)keys.add(k)}
 const ks=[...keys].sort().map(k=>[k,Array.isArray(frames.find(f=>f[k]!==undefined)[k])?3:1]);
 const r=v=>Math.round(v*100)/100;
 const f=frames.map(p=>{const o=[];for(const [k,w] of ks){const v=p[k];if(w===3){for(let j=0;j<3;j++)o.push(r(v?v[j]:0))}else o.push(r(v||0))}return o});
 return{id,hand:a.hand,dur:c.dur,fps,keys:ks,f,m:{g:+(mg*100).toFixed(2),a:+ma.toFixed(1),p:+(mp*100).toFixed(2)}}}
function playBaked(a,tab,t){const n=tab.f.length,x=Math.max(0,Math.min(tab.dur,t))*tab.fps,i=Math.min(n-1,Math.floor(x)),j=Math.min(n-1,i+1),u=x-i,A=tab.f[i],B=tab.f[j],p={};let m=0;
 for(const [k,w] of tab.keys){if(w===3){p[k]=[A[m]+(B[m]-A[m])*u,A[m+1]+(B[m+1]-A[m+1])*u,A[m+2]+(B[m+2]-A[m+2])*u];m+=3}else{p[k]=A[m]+(B[m]-A[m])*u;m+=1}}
 pose(a,p)}
function setHand(a,hand){a.hand=hand;attachBat(a,hand)}
return{bake,playBaked,makeBatter,play,stance,setHand,clipFor,BM,GRIP,pose,sample,batClip,attachBat,surf,footPos,gripFrame}}
