import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('marketplace listings are shared: owner publishes, anyone reads, others cannot edit, verification is admin-only', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-')), port = 8271, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Seller', role: 'viewer' }, '+912': { nick: 'Buyer', role: 'viewer' }, '+913': { nick: 'Admin', role: 'admin' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { s: sign('+911'), b: sign('+912'), a: sign('+913') };
  const call = (m, p, tk, body) => fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async r => [r.status, await r.json().catch(() => ({}))]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    const x = { id: 'mk-bat-1', kind: 'used', title: 'Kashmir willow bat', cat: 'Bats', price: '1200', phone: '9000000001', status: 'open', verified: true };
    let [st, j] = await call('PUT', '/api/shared/market/mk-bat-1', null, { data: { x } }); assert.equal(st, 401);
    [st, j] = await call('PUT', '/api/shared/market/mk-bat-1', T.s, { data: { x } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/shared/market'); assert.equal(st, 200); assert.equal(j.items.length, 1); assert.equal(j.items[0].data.x.title, 'Kashmir willow bat');
    assert.ok(!('verified' in j.items[0].data.x), 'used listings cannot carry a self-set verified flag');
    [st] = await call('PUT', '/api/shared/market/mk-bat-1', T.b, { data: { x: { ...x, title: 'hijacked' } } }); assert.equal(st, 403);
    [st] = await call('PUT', '/api/shared/market/mk-bad-1', T.s, { data: { x: { id: 'mk-bad-1', title: '' } } }); assert.equal(st, 400);
    [st] = await call('PUT', '/api/shared/market/mk-bad-2', T.s, { data: { x: { id: 'mk-other', title: 'x' } } }); assert.equal(st, 400);
    const shop = { id: 'mk-shop-1', kind: 'brand', title: 'Sky Sports Hapur', phone: '9000000001', status: 'open', verified: true };
    [st] = await call('PUT', '/api/shared/market/mk-shop-1', T.s, { data: { x: shop } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/shared/market/mk-shop-1'); assert.equal(j.item.data.x.verified, false, 'seller cannot self-verify a shop');
    [st] = await call('PUT', '/api/shared/market/mk-shop-1', T.a, { data: { x: { ...shop, verified: true } } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/shared/market/mk-shop-1'); assert.equal(j.item.data.x.verified, true, 'admin can verify');
    [st] = await call('PUT', '/api/shared/market/mk-shop-1', T.s, { data: { x: { ...shop, title: 'Sky Sports Hapur 2', verified: false } } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/shared/market/mk-shop-1'); assert.equal(j.item.data.x.verified, true, 'owner edit keeps admin verification');
    [st] = await call('PUT', '/api/shared/market/mk-bat-1', T.s, { data: { x: { ...x, status: 'removed' } } }); assert.equal(st, 200);
  } finally { srv.kill(); }
});
