import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('direct UPI collection: charge, UTR submit, duplicates, only collector decides', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'py-')), port = 8279, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Org', role: 'viewer' }, '9000000002': { nick: 'P1', role: 'viewer' }, '9000000003': { nick: 'P2', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('9000000001'), a: sign('9000000002'), b: sign('9000000003') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/pay/charge', null, { title: 'Entry fee', upi: 'org@okbank', amount: 50000 }); assert.equal(st, 401);
    [st] = await call('POST', '/api/pay/charge', T.o, { title: 'Entry fee', upi: 'bad upi', amount: 50000 }); assert.equal(st, 400);
    [st] = await call('POST', '/api/pay/charge', T.o, { title: 'Entry fee', upi: 'org@okbank', amount: 10 }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/pay/charge', T.o, { title: 'Entry <b>fee', upi: 'org@okbank', amount: 50000, payee: 'Org Club' }); assert.equal(st, 200); const id = j.id;
    [st, j] = await call('GET', '/api/pay/charge?id=' + id); assert.equal(j.charge.amount, 50000); assert.ok(!/[<>]/.test(j.charge.title)); assert.equal(j.charge.subs, undefined);
    [st] = await call('POST', '/api/pay/submit', null, { id, utr: '123456789012' }); assert.equal(st, 401);
    [st] = await call('POST', '/api/pay/submit', T.a, { id, utr: '12345' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/pay/submit', T.a, { id, utr: '123456789012' }); assert.equal(st, 200); const sid = j.id;
    [st] = await call('POST', '/api/pay/submit', T.a, { id, utr: '210987654321' }); assert.equal(st, 409);   // already waiting
    [st] = await call('POST', '/api/pay/submit', T.b, { id, utr: '123456789012' }); assert.equal(st, 409);   // same UTR
    [st, j] = await call('GET', '/api/pay/charge?id=' + id, T.a); assert.equal(j.charge.mine.length, 1); assert.ok(j.charge.mine[0].utr.startsWith('****')); assert.equal(j.charge.subs, undefined);
    [st, j] = await call('GET', '/api/pay/charge?id=' + id, T.o); assert.equal(j.charge.owner, true); assert.equal(j.charge.subs[0].utr, '123456789012');
    [st] = await call('POST', '/api/pay/decide', T.a, { id, sid, status: 'confirmed' }); assert.equal(st, 403);   // payer cannot confirm own payment
    [st] = await call('POST', '/api/pay/decide', T.o, { id, sid, status: 'rejected' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/pay/decide', T.o, { id, sid, status: 'rejected', reason: 'Not in bank' }); assert.equal(st, 200);
    [st] = await call('POST', '/api/pay/submit', T.b, { id, utr: '123456789012' }); assert.equal(st, 200);     // rejected UTR may be reused by a real payer
    [st, j] = await call('GET', '/api/pay/charge?id=' + id, T.o); const s2 = j.charge.subs.find(x => x.byName === 'P2').id;
    [st] = await call('POST', '/api/pay/decide', T.o, { id, sid: s2, status: 'confirmed' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/pay/charge?id=' + id); assert.equal(j.charge.confirmed, 1);
    [st, j] = await call('GET', '/api/pay/mine', T.o); assert.equal(j.items.length, 1);
    [st] = await call('POST', '/api/pay/close', T.a, { id, open: false }); assert.equal(st, 403);
    [st] = await call('POST', '/api/pay/close', T.o, { id, open: false }); assert.equal(st, 200);
    [st] = await call('POST', '/api/pay/submit', T.a, { id, utr: '555555555555' }); assert.equal(st, 400);
  } finally { srv.kill(); }
});
