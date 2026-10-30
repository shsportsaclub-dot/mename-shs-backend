import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('ground registry: GPS register, 200 m rule, owner claim/rename, records only for the owner', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gr-')), port = 8271, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Owner', role: 'viewer' }, '+912': { nick: 'Scorer', role: 'scorer' }, '+913': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('+911'), s: sign('+912'), x: sign('+913') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/grounds', null, { name: 'Sky Ground', lat: 17.385, lng: 78.4867 }); assert.equal(st, 401);
    [st] = await call('POST', '/api/grounds', T.o, { name: 'Sky Ground' }); assert.equal(st, 400);                       // needs GPS
    [st, j] = await call('POST', '/api/grounds', T.o, { name: 'Sky Ground', lat: 17.385, lng: 78.4867, owner: true }); assert.equal(st, 200); const id = j.item.id; assert.ok(j.item.owned);
    // 100 m away (0.0009 deg lat ~ 100 m) -> refused, even with a different name
    [st, j] = await call('POST', '/api/grounds', T.x, { name: 'Totally Different', lat: 17.3859, lng: 78.4867 }); assert.equal(st, 409); assert.equal(j.existing.id, id);
    // ~400 m away -> allowed
    [st, j] = await call('POST', '/api/grounds', T.x, { name: 'Far Ground', lat: 17.3886, lng: 78.4867 }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/grounds?lat=17.385&lng=78.4867&r=5000'); assert.equal(j.items.length, 2); assert.equal(j.items[0].id, id); assert.equal(j.within, 1);
    [st] = await call('POST', '/api/grounds/claim', T.x, { id }); assert.equal(st, 409);                                  // already owned
    [st] = await call('PUT', '/api/grounds', T.x, { id, name: 'Hijack' }); assert.equal(st, 403);
    [st, j] = await call('PUT', '/api/grounds', T.o, { id, name: 'Sky Cricket Ground' }); assert.equal(st, 200); assert.equal(j.item.name, 'Sky Cricket Ground');
    [st] = await call('POST', '/api/grounds/record', T.s, { id, rec: { mid: 'm1', a: 'A', b: 'B', overs: 20, date: '2026-10-30', status: 'live' } }); assert.equal(st, 200);
    [st] = await call('POST', '/api/grounds/record', T.s, { id, rec: { mid: 'm1', a: 'A', b: 'B', overs: 20, date: '2026-10-30', status: 'done', result: 'A won', score: '150/5 & 120/9' } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/grounds/records?id=' + id, T.o); assert.equal(st, 200); assert.equal(j.items.length, 1); assert.equal(j.items[0].status, 'done');
    [st] = await call('GET', '/api/grounds/records?id=' + id, T.x); assert.equal(st, 403);
    [st, j] = await call('GET', '/api/grounds?lat=17.385&lng=78.4867'); assert.equal(j.items[0].matches, 1);
  } finally { srv.kill(); }
});
