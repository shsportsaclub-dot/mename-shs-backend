import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { genVapid } from '../webpush.mjs';
test('auction registration: fee by UPI confirmed by organiser, decisions and SOLD alerts reach the player', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ar-')), port = 8301, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Org', role: 'viewer' }, '9000000002': { nick: 'Pl', role: 'viewer' }, '9000000003': { nick: 'Pl3', role: 'viewer' } }, shared: {} }));
  const got = []; const ps = http.createServer((q, r) => { q.on('data', () => {}); q.on('end', () => { got.push(q.url); r.writeHead(201); r.end(); }); });
  await new Promise(r => ps.listen(0, '127.0.0.1', r)); const pport = ps.address().port, v = genVapid();
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0', VAPID_PUBLIC: v.pub, VAPID_PRIVATE: v.priv }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('9000000001'), p: sign('9000000002'), q: sign('9000000003') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const sub = tag => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); return { endpoint: `http://127.0.0.1:${pport}/${tag}`, keys: { p256dh: e.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') } }; };
  const wait = () => new Promise(r => setTimeout(r, 600));
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    await call('POST', '/api/push/subscribe', T.o, { sub: sub('org') }); await call('POST', '/api/push/subscribe', T.p, { sub: sub('player') });
    [st, j] = await call('POST', '/api/pay/charge', T.o, { title: 'Registration fee', upi: 'org@okbank', amount: 20000, kind: 'aucreg', ref: 'au1' }); const ch = j.id;
    const A0 = { id: 'au1', name: 'Premier Auction', teams: [{ id: 'tm1', name: 'Lions' }], players: [], reg: { open: true, fee: 200, cats: [{ n: 'A', base: 500 }], feeCharge: ch } };
    [st] = await call('PUT', '/api/shared/auc/au1', T.o, { data: { a: A0 } }); assert.equal(st, 200);
    const form = { name: 'Pl One', photo: 'data:image/png;base64,iVBORw0KGgo=', decl: true };
    got.length = 0; [st, j] = await call('POST', '/api/aucreg/au1', T.p, { form }); assert.equal(st, 200); assert.equal(j.reg.status, 'PAYMENT_PENDING'); const rid = j.reg.id;
    await wait(); assert.deepEqual(got, ['/org']);                                      // organiser told about the new registration
    [st, j] = await call('PUT', '/api/aucreg/au1/' + rid, T.o, { action: 'approve', cat: 'A', base: 500 }); assert.equal(st, 400);   // unpaid cannot be approved
    [st, j] = await call('POST', '/api/pay/submit', T.p, { id: ch, utr: '123456789012' }); assert.equal(st, 200); const sid = j.id;
    [st, j] = await call('GET', '/api/aucreg/au1', T.p); assert.equal(j.reg.paid, false);   // submitted is not paid
    [st] = await call('POST', '/api/pay/decide', T.o, { id: ch, sid, status: 'confirmed' });
    [st, j] = await call('GET', '/api/aucreg/au1', T.p); assert.equal(j.reg.paid, true); assert.equal(j.reg.status, 'SUBMITTED');
    [st, j] = await call('GET', '/api/aucreg/au1', T.o); assert.ok(j.regs[0].audit.some(x => /fee confirmed by UPI/.test(x.a)));
    got.length = 0; [st, j] = await call('PUT', '/api/aucreg/au1/' + rid, T.o, { action: 'approve', cat: 'A', base: 500 }); assert.equal(st, 200); assert.equal(j.reg.status, 'APPROVED');
    await wait(); assert.deepEqual(got, ['/player']);
    // the organiser sells the player: the auction record is saved with the pool entry marked sold
    const pool = { id: 'rg' + rid, regId: rid, name: 'Pl One', st: null };
    await call('PUT', '/api/shared/auc/au1', T.o, { data: { a: { ...A0, players: [pool] } } }); await wait();
    got.length = 0; await call('PUT', '/api/shared/auc/au1', T.o, { data: { a: { ...A0, players: [{ ...pool, st: 'sold', team: 'tm1', price: 900 }] } } }); await wait();
    assert.deepEqual(got, ['/player']);
    got.length = 0; await call('PUT', '/api/shared/auc/au1', T.o, { data: { a: { ...A0, players: [{ ...pool, st: 'sold', team: 'tm1', price: 900 }] } } }); await wait(); assert.equal(got.length, 0);   // re-save is silent
    // a charge that is not the organiser's cannot mark registrations paid
    [st, j] = await call('POST', '/api/pay/charge', T.p, { title: 'Other fee', upi: 'pl@okbank', amount: 20000 }); const bad = j.id;
    await call('PUT', '/api/shared/auc/au1', T.o, { data: { a: { ...A0, reg: { ...A0.reg, feeCharge: bad } } } });
    [st, j] = await call('POST', '/api/aucreg/au1', T.q, { form: { ...form, name: 'Pl Three' } }); assert.equal(st, 200);
    [st, j] = await call('POST', '/api/pay/submit', T.q, { id: bad, utr: '999999999999' }); const s3 = j.id;
    await call('POST', '/api/pay/decide', T.p, { id: bad, sid: s3, status: 'confirmed' });
    [st, j] = await call('GET', '/api/aucreg/au1', T.q); assert.equal(j.reg.paid, false); assert.equal(j.reg.status, 'PAYMENT_PENDING');
  } finally { srv.kill(); ps.close(); }
});
