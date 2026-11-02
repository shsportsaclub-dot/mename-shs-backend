import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const modulePath=new URL('../scripts/original-cricket/avatar-study.mjs',import.meta.url);
test('study avatar has a continuous detailed head with outward normals and human head dimensions',async()=>{
 assert.ok(fs.existsSync(modulePath),'original study geometry is required');const {originalStudyAvatarMeshes}=await import(modulePath);const a=originalStudyAvatarMeshes(),h=a.studyHead;
 assert.ok(h.p.length/3>9000);assert.equal(h.p.length,h.n.length);assert.ok(h.p.every(Number.isFinite));assert.ok(Math.max(...h.i)<h.p.length/3);
 const ys=h.p.filter((_,i)=>i%3===1),xs=h.p.filter((_,i)=>i%3===0);assert.ok(Math.max(...ys)-Math.min(...ys)>.25);assert.ok(Math.max(...xs)-Math.min(...xs)<.23);
 for(let i=0;i<h.n.length;i+=3)assert.ok(Math.abs(Math.hypot(...h.n.slice(i,i+3))-1)<1e-6);
 const front=44*129;assert.ok(h.n[front*3+2]>.5);assert.deepEqual(a.studyHead.p,originalStudyAvatarMeshes().studyHead.p);
});
test('face surface fits eyes in sockets and keeps nose forward of cheeks',async()=>{assert.ok(fs.existsSync(modulePath));const {studyFacePoint}=await import(modulePath);const nose=studyFacePoint(0,-.01),cheek=studyFacePoint(.05,-.01),eye=studyFacePoint(.034,.026);assert.ok(nose[2]>cheek[2]+.025);assert.ok(eye[2]<studyFacePoint(.034,.047)[2]);assert.ok([nose,cheek,eye].flat().every(Number.isFinite));});
test('standalone avatar exports code without source trackers or scorer connections',()=>{const path=new URL('../public/original-avatar.html',import.meta.url);assert.ok(fs.existsSync(path),'avatar standalone build required');const html=fs.readFileSync(path,'utf8');assert.match(html,/SH_AVATAR_STUDY=true/);assert.match(html,/SHAvatar/);assert.doesNotMatch(html,/new EventSource|tasks-vision|<script[^>]+src=/);});
test('avatar camera keeps the full bat and body inside a narrow portrait viewport',async()=>{const m=await import(modulePath);assert.equal(typeof m.studyAvatarCamera,'function');for(const aspect of [390/844,1100/1200,16/9]){const c=m.studyAvatarCamera('body',aspect),d=c.eye[2],halfHeight=d*Math.tan(c.fov/2),halfWidth=halfHeight*aspect;assert.ok(halfWidth>=.85,'bat must stay inside horizontal view');assert.ok(halfHeight>=1.05,'head and shoes stay inside vertical view');}});
test('collar exterior normals face forward',async()=>{const {originalStudyAvatarMeshes}=await import(modulePath);const collar=originalStudyAvatarMeshes().studyCollar;assert.ok(collar.n[2]>0);assert.ok(collar.n[121*3+2]>0);});
