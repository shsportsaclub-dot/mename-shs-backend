import assert from 'node:assert/strict';
import {SHOTS} from '../../public/rig-kit/batting-handedness.mjs';
import {createBattingPoseTrack,sampleBattingPose} from '../../public/rig-kit/batting-pose-runtime.mjs';
let checks=0;
for(const shot of SHOTS){
 const r=createBattingPoseTrack(shot,'RHB'),l=createBattingPoseTrack(shot,'LHB');
 assert.equal(r.frames.length,7);assert.equal(l.frames.length,7);
 assert.equal(r.leadFoot,'left');assert.equal(l.leadFoot,'right');
 for(let t=0;t<=100;t++){
  const a=sampleBattingPose(r,t/100).pose,b=sampleBattingPose(l,t/100).pose;
  for(const key of Object.keys(a)){
   assert(Number.isFinite(a[key])&&Number.isFinite(b[key]));
   const mirrored=['rootYaw','hipsYaw','chestYaw','headYaw','batAngle'].includes(key);
   assert(Math.abs(a[key]-(mirrored?-b[key]:b[key]))<1e-8,shot+': '+key);
   checks++;
  }
 }
 assert.equal(r.visuallyVerified,false);
}
console.log(`PASS: ${SHOTS.length} shot families, 42 handed tracks, ${checks} numeric/mirroring checks. VISUAL / RETARGETING NOT TESTED.`);
