import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('ground photos and ratings: validation, one review per account, owner cannot rate, removal rights', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grp-')), port = 8272, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Owner', role: 'viewer' }, '+912': { nick: 'Fan', role: 'viewer' }, '+913': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore','inherit','inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('+911'), f: sign('+912'), x: sign('+913') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const img = 'data:image/jpeg;base64,' + Buffer.from('fakejpegbytes').toString('base64');
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st, j] = await call('POST', '/api/grounds', T.o, { name: 'Photo Ground', lat: 17.385, lng: 78.4867, owner: true }); assert.equal(st, 200); const id = j.item.id;
    [st] = await call('POST', '/api/grounds/photo', null, { id, img }); assert.equal(st, 401);
    [st] = await call('POST', '/api/grounds/photo', T.f, { id, img: 'http://evil/x.jpg' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/grounds/photo', T.f, { id, img: 'data:image/jpeg;base64,' + 'A'.repeat(270000) }); assert.equal(st, 413);
    [st, j] = await call('POST', '/api/grounds/photo', T.f, { id, img }); assert.equal(st, 200); const p1 = j.id;
    [st, j] = await call('POST', '/api/grounds/photo', T.o, { id, img }); assert.equal(st, 200); assert.equal(j.photos, 2);
    [st] = await call('POST', '/api/grounds/photo/delete', T.x, { id, pid: p1 }); assert.equal(st, 403);
    [st] = await call('POST', '/api/grounds/review', T.o, { id, stars: 5 }); assert.equal(st, 403);          // owner cannot rate own ground
    [st] = await call('POST', '/api/grounds/review', T.f, { id, stars: 9 }); assert.equal(st, 400);
    [st] = await call('POST', '/api/grounds/review', T.f, { id, stars: 4, text: 'Good <b>pitch</b>' }); assert.equal(st, 200);
    [st, j] = await call('POST', '/api/grounds/review', T.x, { id, stars: 5 }); assert.equal(st, 200); assert.equal(j.rating, 4.5);
    [st, j] = await call('POST', '/api/grounds/review', T.f, { id, stars: 3 }); assert.equal(j.reviews, 2);   // update, not duplicate
    [st, j] = await call('GET', '/api/grounds/detail?id=' + id, T.f); assert.equal(j.photos.length, 2); assert.equal(j.reviews.length, 2); assert.ok(!/[<>]/.test(JSON.stringify(j.reviews)));
    assert.equal(j.item.photos, 2); assert.equal(j.item.rating, 4);
    [st] = await call('POST', '/api/grounds/photo/delete', T.o, { id, pid: p1 }); assert.equal(st, 200);        // owner may remove
    [st, j] = await call('GET', '/api/grounds?lat=17.385&lng=78.4867&r=500'); assert.equal(j.items[0].photos, 1);
  } finally { srv.kill(); }
});
