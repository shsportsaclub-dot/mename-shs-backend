import assert from 'node:assert/strict';
import {SHOT_REFERENCE_MATRIX} from '../../public/rig-kit/shot-reference-matrix.mjs';
import {OUT_SCENES,OUT_TYPES,OUT_VARIANTS} from '../../public/rig-kit/out-animation-controller.mjs';
import {createBattingPoseTrack,sampleBattingPose} from '../../public/rig-kit/batting-pose-runtime.mjs';
import {shotKinematics} from '../../public/rig-kit/shot-kinematics.mjs';
const names=Object.keys(SHOT_REFERENCE_MATRIX);
let tested=0;
for(const name of names){
 for(const hand of ['RHB','LHB']){
  const k=shotKinematics(name,hand);const track=createBattingPoseTrack(name,hand);
  assert.equal(track.frames.length,7);assert.ok(k);
  for(let t=0;t<=100;t+=5){const sample=sampleBattingPose(track,t/100);for(const v of Object.values(sample.pose))assert.ok(Number.isFinite(v),`${name} ${hand} ${t}`);tested++}
 }
}
assert.equal(Object.keys(OUT_TYPES).length,13);
for(const [key,steps] of Object.entries(OUT_SCENES)){
 assert.ok(steps.length>=2,key);assert.ok(steps.every(s=>Number.isFinite(s.at)&&s.at>=0),key);
 for(let i=1;i<steps.length;i++)assert.ok(steps[i].at>=steps[i-1].at,key+' not sorted');
}
assert.equal(Object.keys(OUT_SCENES).length,13);
console.log(JSON.stringify({shots:names.length,handednessConfigurations:names.length*2,poseSamples:tested,dismissalScenes:Object.keys(OUT_SCENES).length,variants:Object.keys(OUT_VARIANTS).length,passed:true},null,2));
