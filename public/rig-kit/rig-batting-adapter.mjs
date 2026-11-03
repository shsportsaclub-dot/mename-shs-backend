import {createBattingPoseTrack,sampleBattingPose} from './batting-pose-runtime.mjs';

// Applies authoring targets to a Mixamo-like FBX humanoid, preserving bind-pose rotations.
// No claim of physical accuracy: the bat requires a separate two-hand IK solve.
const aliases={
 hips:['hips','pelvis'],spine:['spine'],chest:['spine2','chest','upperchest'],neck:['neck'],head:['head'],
 leftShoulder:['leftshoulder'],rightShoulder:['rightshoulder'],
 leftArm:['leftarm','leftupperarm'],rightArm:['rightarm','rightupperarm'],
 leftForeArm:['leftforearm','leftlowerarm'],rightForeArm:['rightforearm','rightlowerarm'],
 leftUpLeg:['leftupleg','leftthigh'],rightUpLeg:['rightupleg','rightthigh'],
 leftLeg:['leftleg','leftcalf'],rightLeg:['rightleg','rightcalf']
};
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^mixamorig/,'');
export function discoverHumanoid(root){
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o)});
 const found={};for(const [key,names] of Object.entries(aliases))found[key]=bones.find(b=>names.some(n=>norm(b.name)===n))||null;
 return {bones:found,totalBones:bones.length,missing:Object.entries(found).filter(([,v])=>!v).map(([k])=>k)};
}
const rad=n=>n*Math.PI/180;
export function createRigBattingController(root,shot='cover_drive',handedness='RHB'){
 const {bones,totalBones,missing}=discoverHumanoid(root);
 const required=['hips','chest','leftArm','rightArm','leftUpLeg','rightUpLeg'];
 if(required.some(k=>!bones[k]))throw Error('Required humanoid bones missing: '+required.filter(k=>!bones[k]).join(', '));
 let track=createBattingPoseTrack(shot,handedness);
 const originals=Object.fromEntries(Object.entries(bones).filter(([,b])=>b).map(([k,b])=>[k,b.quaternion.clone()]));
 const lead=()=>handedness==='RHB'?'left':'right',trail=()=>handedness==='RHB'?'right':'left';
 const apply=(key,axis,deg)=>{const bone=bones[key];if(!bone)return;const q=originals[key].clone();const d=rad(deg);const delta=bone.quaternion.clone().identity();if(axis==='x')delta.setFromAxisAngle({x:1,y:0,z:0},d);else if(axis==='y')delta.setFromAxisAngle({x:0,y:1,z:0},d);else delta.setFromAxisAngle({x:0,y:0,z:1},d);bone.quaternion.copy(q.multiply(delta));};
 function setShot(next,hand=handedness){shot=next;handedness=hand;track=createBattingPoseTrack(shot,handedness)}
 function update(t){
  const {pose,phase}=sampleBattingPose(track,t);
  apply('hips','y',pose.hipsYaw);apply('chest','y',pose.chestYaw);apply('head','y',pose.headYaw);
  apply(lead()+'Arm','x',pose.leadShoulderX);apply(trail()+'Arm','x',pose.trailShoulderX);
  apply(lead()+'ForeArm','x',pose.leadElbow*.45);apply(trail()+'ForeArm','x',pose.trailElbow*.45);
  apply(lead()+'UpLeg','x',pose.leadKnee*.4);apply(trail()+'UpLeg','x',pose.trailKnee*.4);
  apply(lead()+'Leg','x',-pose.leadKnee*.6);apply(trail()+'Leg','x',-pose.trailKnee*.6);
  return {phase,pose};
 }
 function reset(){for(const [key,q] of Object.entries(originals))bones[key].quaternion.copy(q)}
 return {setShot,update,reset,diagnostics:{totalBones,missing,rigged:true,handedness,shot},get track(){return track}};
}
