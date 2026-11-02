import test from 'node:test';
import assert from 'node:assert/strict';
import {originalAvatarMeshes,solveAvatarJoint,avatarFaceProfile} from '../scripts/original-cricket/avatars.mjs';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('original face, uniform and helmet meshes have finite indexed geometry and unit normals',()=>{const meshes=originalAvatarMeshes();assert.equal(Object.keys(meshes).length,10);for(const m of Object.values(meshes)){assert.equal(m.p.length,m.n.length);assert.ok(m.p.every(Number.isFinite));assert.ok(m.n.every(Number.isFinite));assert.ok(Math.max(...m.i)<m.p.length/3);assert.ok(m.i.length%3===0);for(let k=0;k<m.n.length;k+=3)assert.ok(Math.abs(Math.hypot(...m.n.slice(k,k+3))-1)<1e-6);}});
test('face variants are deterministic original geometry with different proportions',()=>{const a=originalAvatarMeshes(),b=originalAvatarMeshes();assert.deepEqual(a.head0.p,b.head0.p);assert.notDeepEqual(a.head0.p,a.head5.p);assert.notEqual(avatarFaceProfile(0).width,avatarFaceProfile(5).width);});
test('arm and leg IK preserve bone lengths, even with unreachable targets and aligned poles',()=>{for(const target of [[0,-.6,0],[.2,.2,.2],[0,-3,0],[0,0,0],[0,.6,0]]){const start=[0,0,0],r=solveAvatarJoint(start,target,.33,.31,[0,1,0]);assert.ok([...r.joint,...r.end].every(Number.isFinite));assert.ok(Math.abs(distance(start,r.joint)-.33)<1e-6);assert.ok(Math.abs(distance(r.joint,r.end)-.31)<1e-6);if(distance(start,target)>.02&&distance(start,target)<.64)assert.ok(distance(r.end,target)<1e-6);}});

test('head and helmet normals face outward toward light',()=>{const m=originalAvatarMeshes();assert.ok(m.head0.n[(14*41)*3+2]>.5);assert.ok(m.helmet.n[(10*37)*3+2]>.5);assert.ok(m.jersey.n[(15*33)*3+2]>.5);});
