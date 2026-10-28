import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('marketplace offers: buyer offers, seller-only review, buyer sees own status', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'of-')), port = 8273, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Seller', role: 'viewer' }, '+912': { nick: 'Buyer', role: 'viewer' }, '+913': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { s: sign('+911'), b: sign('+912'), x: sign('+913') };
  const call = (m, p, tk, body) => fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async r => [r.status, await r.json().catch(() => ({}))]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    let [st, j] = await call('POST', '/api/offers/mk-bat-1', T.b, { amt: '900' }); assert.equal(st, 404, 'listing must be published');
    [st] = await call('PUT', '/api/shared/market/mk-bat-1', T.s, { data: { x: { id: 'mk-bat-1', kind: 'used', title: 'Willow bat', cat: 'Bats', price: '1200', phone: '9000000001', status: 'open' } } }); assert.equal(st, 200);
    [st] = await call('POST', '/api/offers/mk-bat-1', null, { amt: '900' }); assert.equal(st, 401);
    [st] = await call('POST', '/api/offers/mk-bat-1', T.s, { amt: '900' }); assert.equal(st, 400, 'no self offers');
    [st] = await call('POST', '/api/offers/mk-bat-1', T.b, { amt: 'abc' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/offers/mk-bat-1', T.b, { amt: 'Rs 900', phone: '9000000002', msg: 'Can you do 900?' }); assert.equal(st, 200); const oid = j.id;
    [st, j] = await call('GET', '/api/offers/mk-bat-1', T.s); assert.equal(j.owner, true); assert.equal(j.items[0].amt, '900'); assert.equal(j.items[0].phone, '9000000002');
    [st, j] = await call('GET', '/api/offers/mk-bat-1', T.x); assert.equal(j.mine.length, 0, 'strangers see nothing');
    [st, j] = await call('GET', '/api/offers/mk-bat-1', T.b); assert.equal(j.mine.length, 1); assert.ok(!('phone' in j.mine[0]));
    [st] = await call('PUT', `/api/offers/mk-bat-1/${oid}`, T.b, { status: 'accepted' }); assert.equal(st, 403);
    [st] = await call('PUT', `/api/offers/mk-bat-1/${oid}`, T.s, { status: 'countered' }); assert.equal(st, 400, 'counter needs a price');
    [st] = await call('PUT', `/api/offers/mk-bat-1/${oid}`, T.s, { status: 'countered', counter: '1050' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/offers/mk-bat-1', T.b); assert.equal(j.mine[0].status, 'countered'); assert.equal(j.mine[0].counter, '1050');
  } finally { srv.kill(); }
});
