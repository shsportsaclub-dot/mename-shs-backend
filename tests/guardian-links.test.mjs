import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('guardian links: request by SH ID, player approves, either side ends, no phone leak', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gl-')), port = 8277, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Kid', role: 'viewer', shid: 'SH-AB12CD34' }, '9000000002': { nick: 'Mom', role: 'viewer' }, '9000000003': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { k: sign('9000000001'), m: sign('9000000002'), o: sign('9000000003') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/links/request', null, { shid: 'SH-AB12CD34', rel: 'parent' }); assert.equal(st, 401);
    [st] = await call('POST', '/api/links/request', T.m, { shid: 'bad', rel: 'parent' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/links/request', T.m, { shid: 'SH-AB12CD34', rel: 'friend' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/links/request', T.m, { shid: 'SH-ZZZZZZZZ', rel: 'parent' }); assert.equal(st, 404);
    [st] = await call('POST', '/api/links/request', T.k, { shid: 'SH-AB12CD34', rel: 'parent' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/links/request', T.m, { shid: 'sh-ab12cd34', rel: 'parent', note: 'Mother <b>' }); assert.equal(st, 200); const id = j.id;
    [st] = await call('POST', '/api/links/request', T.m, { shid: 'SH-AB12CD34', rel: 'parent' }); assert.equal(st, 409);
    [st, j] = await call('GET', '/api/links', T.k); assert.equal(j.items.length, 1); assert.equal(j.items[0].role, 'player'); assert.equal(j.items[0].who, 'Mom'); assert.ok(!JSON.stringify(j).includes('9000000'));
    [st, j] = await call('GET', '/api/links', T.o); assert.equal(j.items.length, 0);
    [st] = await call('POST', '/api/links/decide', T.o, { id, status: 'approved' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/links/decide', T.m, { id, status: 'approved' }); assert.equal(st, 403);   // guardian cannot approve themselves
    [st] = await call('POST', '/api/links/decide', T.k, { id, status: 'approved' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/links', T.m); assert.equal(j.items[0].status, 'approved'); assert.equal(j.items[0].role, 'guardian'); assert.equal(j.items[0].shid, 'SH-AB12CD34');
    [st] = await call('POST', '/api/links/decide', T.k, { id, status: 'approved' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/links/decide', T.m, { id, status: 'revoked' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/links', T.k); assert.equal(j.items[0].status, 'revoked');
    [st] = await call('POST', '/api/links/request', T.m, { shid: 'SH-AB12CD34', rel: 'parent' }); assert.equal(st, 200);   // may ask again after ending
  } finally { srv.kill(); }
});
