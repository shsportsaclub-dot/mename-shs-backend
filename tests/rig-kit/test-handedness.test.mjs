import assert from 'node:assert/strict';
import { SHOTS,battingMotion } from '../../public/rig-kit/batting-handedness.mjs';
for (const shot of SHOTS) {
 const r=battingMotion(shot,'RHB'),l=battingMotion(shot,'LHB');
 assert.equal(r.leadFoot,l.trailFoot); assert.equal(r.trailFoot,l.leadFoot);
 assert.equal(r.bodyTurnSign,-l.bodyTurnSign);assert.equal(r.batSwingSign,-l.batSwingSign);
 assert.equal(r.offSideSign,-l.offSideSign);assert.equal(r.legSideSign,-l.legSideSign);
 assert.equal(r.availableFBXClip,false);assert.equal(l.availableFBXClip,false);
}
console.log('PASS: '+SHOTS.length+' shots x 2 stances; mirror, footwork and missing-FBX flags verified');
