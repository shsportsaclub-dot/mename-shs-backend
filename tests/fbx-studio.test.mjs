import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRig, disposeRig } from '../scripts/fbx-studio/rig-tools.mjs';
test('reports actual skin weights and native clips, not filename claims',()=>{
 const root={traverse(fn){for(const n of [{isBone:true},{isSkinnedMesh:true,skeleton:{bones:[1,2]},geometry:{attributes:{position:{count:42},skinIndex:{},skinWeight:{}}}}])fn(n)},animations:[{name:'Run',duration:1.25,tracks:[1,2]}]};
 assert.deepEqual(inspectRig(root),{bones:1,meshes:1,skinnedMeshes:1,weightedMeshes:1,vertices:42,clips:[{name:'Run',duration:1.25,tracks:2}]});
});
test('static root has no fabricated animation',()=>assert.equal(inspectRig({traverse(){}}).clips.length,0));
test('dispose shared resources once',()=>{let count=0;const g={dispose(){count++}},m={dispose(){count++}};disposeRig({traverse(fn){fn({geometry:g,material:[m]});fn({geometry:g,material:m})}});assert.equal(count,2)});
test('skips an empty Take 001 before the actual motion',async()=>{const {playableClips}=await import('../scripts/fbx-studio/rig-tools.mjs');const run={name:'mixamo.com',duration:.8,tracks:[1]};assert.deepEqual(playableClips({animations:[{name:'Take 001',duration:0,tracks:[]},run]}),[run]);});
test('releases shared skeleton bone textures once',()=>{let count=0;const skeleton={dispose(){count++}};disposeRig({traverse(fn){fn({isSkinnedMesh:true,skeleton});fn({isSkinnedMesh:true,skeleton});}});assert.equal(count,1)});
test('embedded blob URLs are revoked even if parsing throws',async()=>{const {withTemporaryObjectURLs}=await import('../scripts/fbx-studio/rig-tools.mjs');const revoked=[],original=()=> 'blob:test',api={createObjectURL:original,revokeObjectURL:u=>revoked.push(u)};assert.throws(()=>withTemporaryObjectURLs(api,()=>{api.createObjectURL({});throw Error('invalid')}),/invalid/);assert.deepEqual(revoked,['blob:test']);assert.equal(api.createObjectURL,original)});
