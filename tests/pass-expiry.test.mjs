import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('time-limited season pass: expires, can be renewed, one charge unlocks several streams, nothing is deleted', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pe-')), port = 8297, file = path.join(dir, 'd.json'), SECRET = 'x', day = 864e5;
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  const sub = (by, status, ago) => ({ id: 's' + by, by, byName: 'N' + by, utr: String(100000000000 + +by.slice(-3)), status, why: '', t: Date.now() - ago, decidedAt: Date.now() - ago });
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Scorer', role: 'scorer' }, '9000000002': { nick: 'Fresh', role: 'viewer' }, '9000000003': { nick: 'Old', role: 'viewer' }, '9000000004': { nick: 'Never', role: 'viewer' } },
    streams: { m1: 'https://x.test/one', m2: 'https://x.test/two' }, streamGate: { m1: 'pyseason01', m2: 'pyseason01' },
    shared: { pay: { pyseason01: { id: 'pyseason01', owner: '9000000001', title: 'Season pass', upi: 'o@bank', amount: 20000, days: 30, kind: 'pass', ref: 'm1', open: true, subs: [sub('9000000002', 'confirmed', 2 * day), sub('9000000003', 'confirmed', 31 * day)] } } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { s: sign('9000000001'), f: sign('9000000002'), o: sign('9000000003'), n: sign('9000000004') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    [st, j] = await call('GET', '/api/streams', T.f); assert.equal(j.streams.m1, 'https://x.test/one'); assert.equal(j.streams.m2, 'https://x.test/two');   // one pass, two streams
    [st, j] = await call('GET', '/api/streams', T.o); assert.deepEqual(j.streams, {}); assert.deepEqual(j.locked.sort(), ['m1', 'm2']);               // expired
    [st, j] = await call('GET', '/api/streams', T.n); assert.deepEqual(j.streams, {});
    [st, j] = await call('GET', '/api/pay/charge?id=pyseason01', T.o); assert.equal(j.charge.days, 30); assert.ok(j.charge.mine[0].expires < Date.now()); assert.equal(j.charge.mine[0].status, 'confirmed');   // record kept
    [st, j] = await call('GET', '/api/pay/charge?id=pyseason01', T.f); assert.ok(j.charge.mine[0].expires > Date.now());
    [st] = await call('POST', '/api/pay/submit', T.f, { id: 'pyseason01', utr: '555555555555' }); assert.equal(st, 409);   // active pass cannot be paid twice
    [st, j] = await call('POST', '/api/pay/submit', T.o, { id: 'pyseason01', utr: '777777777777' }); assert.equal(st, 200); const sid = j.id;   // expired holder may renew
    [st, j] = await call('GET', '/api/streams', T.o); assert.deepEqual(j.streams, {});                                  // waiting for confirmation
    [st] = await call('POST', '/api/pay/decide', T.s, { id: 'pyseason01', sid, status: 'confirmed' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/streams', T.o); assert.equal(j.streams.m2, 'https://x.test/two');                  // renewed
    [st, j] = await call('GET', '/api/pay/charge?id=pyseason01', T.o); assert.equal(j.charge.mine.length, 2);            // both payments kept
    [st, j] = await call('POST', '/api/pay/charge', T.s, { title: 'Pass x', upi: 'org@okbank', amount: 1000, kind: 'pass', days: 9999 }); const c1 = j.id;
    [st, j] = await call('GET', '/api/pay/charge?id=' + c1); assert.equal(j.charge.days, 0);
    [st, j] = await call('POST', '/api/pay/charge', T.s, { title: 'Pass x', upi: 'org@okbank', amount: 1000, kind: 'pass', days: 7 }); [st, j] = await call('GET', '/api/pay/charge?id=' + j.id); assert.equal(j.charge.days, 7);
  } finally { srv.kill(); }
});
