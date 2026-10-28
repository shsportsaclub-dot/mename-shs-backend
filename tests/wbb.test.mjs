// World-match ball by ball scored by SH scorers: public read, Admin/Scorer write, validation, undo.
import test from 'node:test'; import assert from 'node:assert/strict'; import crypto from 'node:crypto'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('wbb: public read, scorer/admin write, validation, undo', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wbb-')), port = 8271, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Sc', name: 'Scorer', role: 'scorer' }, '+912': { nick: 'V', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const call = (m, p, tk, body) => fetch('http://127.0.0.1:' + port + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async r => [r.status, await r.json()]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    let [s, j] = await call('GET', '/api/wbb/m-1'); assert.equal(s, 200); assert.deepEqual(j.balls, []);
    const b = { over: 35, ball: 2, runs: 1, batsman: 'A', bowler: 'B', inning: 'BAN Inning 1' };
    [s] = await call('POST', '/api/wbb/m-1', null, b); assert.equal(s, 401);
    [s] = await call('POST', '/api/wbb/m-1', sign('+912'), b); assert.equal(s, 403);
    [s] = await call('POST', '/api/wbb/m-1', sign('+911'), { ...b, ball: 9 }); assert.equal(s, 400);
    [s] = await call('POST', '/api/wbb/m-1', sign('+911'), { ...b, runs: -1 }); assert.equal(s, 400);
    [s, j] = await call('POST', '/api/wbb/m-1', sign('+911'), b); assert.equal(s, 200, JSON.stringify(j)); assert.equal(j.n, 1);
    [s, j] = await call('POST', '/api/wbb/m-1', sign('+911'), { over: 35, ball: 3, runs: 0, wicket: true, out: 'A' }); assert.equal(j.n, 2);
    [s, j] = await call('GET', '/api/wbb/m-1'); assert.equal(j.balls.length, 2); assert.equal(j.balls[1].wicket, true);
    [s] = await call('POST', '/api/wbb/m-1', sign('+912'), { undo: true }); assert.equal(s, 403);
    [s, j] = await call('POST', '/api/wbb/m-1', sign('+911'), { undo: true }); assert.equal(j.n, 1);
  } finally { srv.kill(); }
});
