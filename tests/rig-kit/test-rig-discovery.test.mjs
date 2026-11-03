import assert from 'node:assert/strict';
import {discoverHumanoid,createRigBattingController} from '../../public/rig-kit/rig-batting-adapter.mjs';
const names=['Hips','Spine','Spine2','Head','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg'];
const root={traverse:cb=>names.forEach(name=>cb({name:'mixamorig:'+name,isBone:true}))};
const result=discoverHumanoid(root);assert.equal(result.totalBones,12);assert.equal(result.missing.includes('hips'),false);assert.equal(result.missing.includes('leftArm'),false);
assert.throws(()=>createRigBattingController({traverse:()=>{}}),/Required humanoid bones missing/);
console.log('PASS: 12-bone name discovery and missing-rig rejection');
