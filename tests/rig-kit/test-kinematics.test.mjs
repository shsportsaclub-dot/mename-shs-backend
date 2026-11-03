import assert from 'node:assert/strict';
import {SHOTS} from '../../public/rig-kit/batting-handedness.mjs';
import {shotKinematics,validateShotCatalog} from '../../public/rig-kit/shot-kinematics.mjs';
assert.ok(validateShotCatalog());
for(const shot of SHOTS){const r=shotKinematics(shot,'RHB'),l=shotKinematics(shot,'LHB');for(const key of Object.keys(r.motionTargets)){assert.equal(r.motionTargets[key],-l.motionTargets[key],shot+':'+key)}assert.deepEqual(r.phases,l.phases);assert.equal(r.availableFBXClip,false);}
console.log('PASS: '+SHOTS.length+' shot specifications, 42 handedness configurations, mirror angles and phases');
