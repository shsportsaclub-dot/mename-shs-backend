import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('number change: request, admin review, alias login, merge, scorer lookup minimal', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nc-')), port = 8275, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  const mk = (n, role, extra = {}) => ({ nick: n, role, kind: 'Player', phone: '', age: 25, loc: { city: 'Hyd' }, ...extra });
  const salt = 'ab', ph = crypto.createHash('sha256');
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': mk('Ravi', 'viewer'), '9000000002': mk('Other', 'viewer'), '9000000003': mk('Adm', 'admin'), '9000000004': mk('Sco', 'scorer') }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { r: sign('9000000001'), o: sign('9000000002'), a: sign('9000000003'), s: sign('9000000004') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/me/number-change', null, { phone: '9111111111', reason: 'lost sim' }); assert.equal(st, 401);
    [st] = await call('POST', '/api/me/number-change', T.r, { phone: '123', reason: 'lost sim' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/me/number-change', T.r, { phone: '9000000001', reason: 'lost sim' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/me/number-change', T.r, { phone: '9111111111', reason: 'x' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/me/number-change', T.r, { phone: '9111111111', reason: 'Lost my SIM' }); assert.equal(st, 200); assert.equal(j.kind, 'change'); const id1 = j.id;
    [st] = await call('POST', '/api/me/number-change', T.r, { phone: '9222222222', reason: 'Lost my SIM' }); assert.equal(st, 409);
    [st] = await call('GET', '/api/admin/number-requests', T.r); assert.equal(st, 403);
    [st, j] = await call('GET', '/api/admin/number-requests', T.a); assert.equal(j.items.length, 1); assert.ok(!j.items[0].newNumber.includes('9111111111'));
    [st] = await call('POST', '/api/admin/number-decide', T.r, { rid: id1, status: 'approved' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/admin/number-decide', T.a, { rid: id1, status: 'rejected' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/admin/number-decide', T.a, { rid: id1, status: 'approved' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/me/number-change', T.r); assert.equal(j.items[0].status, 'approved');
    // new number cannot be registered separately now
    [st, j] = await call('POST', '/api/auth/register', null, { phone: '9111111111', pin: '1234', profile: { nick: 'Zed', kind: 'Player', age: 20 } }); assert.equal(j.exists, true);
    // merge: Other's number requested by Ravi
    [st, j] = await call('POST', '/api/me/number-change', T.r, { phone: '9000000002', reason: 'Duplicate account' }); assert.equal(j.kind, 'merge'); const id2 = j.id;
    [st, j] = await call('GET', '/api/admin/number-requests', T.a); assert.equal(j.items[0].merge, true); assert.equal(j.items[0].otherNick, 'Other');
    [st] = await call('POST', '/api/admin/number-decide', T.a, { rid: id2, status: 'approved' }); assert.equal(st, 200);
    // scorer lookup
    [st] = await call('POST', '/api/scorer/lookup', T.r, { phone: '9000000001' }); assert.equal(st, 403);
    [st, j] = await call('POST', '/api/scorer/lookup', T.s, { phone: '9111111111' }); assert.equal(j.found, true); assert.equal(j.profile.name, 'Ravi'); assert.match(j.profile.shid, /^SH-/); assert.ok(!('phone' in j.profile) && !('age' in j.profile));
    [st, j] = await call('POST', '/api/scorer/lookup', T.s, { phone: '9555555555' }); assert.equal(j.found, false);
    [st, j] = await call('POST', '/api/scorer/lookup', T.s, { phone: '9000000002' }); assert.equal(j.profile.name, 'Ravi');   // merged number resolves to the surviving account
  } finally { srv.kill(); }
});
