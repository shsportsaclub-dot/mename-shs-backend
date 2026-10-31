import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('public player card: owner publishes, anyone reads, strangers cannot overwrite, bad cards rejected', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-')), port = 8278, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Kid', role: 'viewer' }, '9000000002': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { a: sign('9000000001'), b: sign('9000000002') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const c = { id: 'pl-abc123', name: 'Ravi', role: 'BAT', team: 'Lions', city: 'Hyd', shid: 'SH-AB12CD34', m: 5, r: 120, w: 2, hs: 61, f50: 1, f100: 0, phone: '9999', dob: '2000-01-01' };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('PUT', '/api/shared/players/pl-abc123', null, { data: { c } }); assert.equal(st, 401);
    [st] = await call('PUT', '/api/shared/players/pl-abc123', T.a, { data: { c: { ...c, name: '' } } }); assert.equal(st, 400);
    [st] = await call('PUT', '/api/shared/players/pl-abc123', T.a, { data: { c: { ...c, r: -1 } } }); assert.equal(st, 400);
    [st] = await call('PUT', '/api/shared/players/pl-abc123', T.a, { data: { c } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/shared/players/pl-abc123'); assert.equal(st, 200); assert.equal(j.item.data.c.name, 'Ravi'); assert.equal(j.item.data.c.r, 120);
    assert.ok(!('phone' in j.item.data.c) && !('dob' in j.item.data.c));
    [st] = await call('PUT', '/api/shared/players/pl-abc123', T.b, { data: { c: { ...c, name: 'Hacked' } } }); assert.equal(st, 403);
    [st] = await call('GET', '/api/shared/players/nope-1'); assert.equal(st, 404);
  } finally { srv.kill(); }
});
