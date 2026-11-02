import test from 'node:test';import assert from 'node:assert/strict';
import {originalAvatarMeshes} from '../scripts/original-cricket/avatars.mjs';
import {sampleCricketMotion} from '../scripts/original-cricket/motion.mjs';
import {deformCricketTorso,originalCricketLimb} from '../scripts/original-cricket/motion-skin.mjs';
function valid(m){assert.ok(m.p.every(Number.isFinite));assert.ok(m.n.every(Number.isFinite));assert.ok(Math.max(...m.i)<m.p.length/3);for(let i=0;i<m.n.length;i+=3)assert.ok(Math.abs(Math.hypot(...m.n.slice(i,i+3))-1)<1e-6);}
test('torso vertices deform through the hierarchy while retaining stable topology',()=>{const mesh=originalAvatarMeshes().jersey,a=deformCricketTorso(mesh,sampleCricketMotion('bat',2.57)),b=deformCricketTorso(mesh,sampleCricketMotion('bat',3.25));valid(a);valid(b);assert.equal(a.p.length,mesh.p.length);assert.deepEqual(a.i,mesh.i);assert.notDeepEqual(a.p,b.p);});
test('continuous authored limb surfaces stay finite through a bent elbow and planted knee',()=>{for(const args of [[[.2,1.4,0],[.4,1.1,.1],[.1,.95,.35],'arm'],[[-.1,.8,.06],[-.1,.45,.3],[-.1,.08,.4],'leg']]){const m=originalCricketLimb(...args);valid(m);assert.ok(m.p.length>300);}});
test('limb skin normals point outward rather than darkening the visible arm inside-out',()=>{const m=originalCricketLimb([0,1,0],[0,.6,0],[0,.2,0]);for(let k=0;k<m.p.length;k+=3){const radial=[m.p[k],0,m.p[k+2]];assert.ok(radial[0]*m.n[k]+radial[2]*m.n[k+2]>0);}});
