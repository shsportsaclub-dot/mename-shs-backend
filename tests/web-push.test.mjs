import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const hkdf = (salt, ikm, info, len) => { const prk = hmac(salt, ikm); let t = Buffer.alloc(0), out = Buffer.alloc(0), i = 1; while (out.length < len) { t = hmac(prk, Buffer.concat([t, info, Buffer.from([i++])])); out = Buffer.concat([out, t]); } return out.subarray(0, len); };
const decrypt = (ua, auth, rec) => { const salt = rec.subarray(0, 16), idl = rec[20], asPub = rec.subarray(21, 21 + idl), ct = rec.subarray(21 + idl);
  const ikm = hkdf(auth, ua.computeSecret(asPub), Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPub]), 32);
  const d = crypto.createDecipheriv('aes-128-gcm', hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12)); d.setAuthTag(ct.subarray(ct.length - 16));
  const p = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]); return JSON.parse(p.subarray(0, p.length - 1).toString()); };
test('web push: subscribe, encrypted delivery with VAPID, payment alerts, expired endpoints dropped', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-')), port = 8283, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Org', role: 'viewer' }, '9000000002': { nick: 'P1', role: 'viewer' } }, shared: {} }));
  const got = []; let status = 201;
  const ps = http.createServer((q, r) => { const ch = []; q.on('data', c => ch.push(c)); q.on('end', () => { got.push({ url: q.url, h: q.headers, body: Buffer.concat(ch) }); r.writeHead(status); r.end(); }); });
  await new Promise(r => ps.listen(0, '127.0.0.1', r)); const pport = ps.address().port;
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('9000000001'), a: sign('9000000002') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const mk = tag => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); const auth = crypto.randomBytes(16); return { e, auth, sub: { endpoint: `http://127.0.0.1:${pport}/${tag}`, keys: { p256dh: e.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } } }; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j; const owner = mk('owner'), payer = mk('payer');
    [st, j] = await call('GET', '/api/push/key'); assert.equal(st, 200); assert.equal(Buffer.from(j.key, 'base64url').length, 65); const key = j.key;
    [st, j] = await call('GET', '/api/push/key'); assert.equal(j.key, key);   // stable
    [st] = await call('POST', '/api/push/subscribe', null, { sub: owner.sub }); assert.equal(st, 401);
    [st] = await call('POST', '/api/push/subscribe', T.o, { sub: { endpoint: 'ftp://x', keys: {} } }); assert.equal(st, 400);
    [st] = await call('POST', '/api/push/subscribe', T.o, { sub: { ...owner.sub, endpoint: 'http://evil.example/x' } }); assert.equal(st, 400);   // plain http only for localhost
    [st] = await call('POST', '/api/push/subscribe', T.o, { sub: owner.sub }); assert.equal(st, 200);
    [st] = await call('POST', '/api/push/subscribe', T.a, { sub: payer.sub }); assert.equal(st, 200);
    [st, j] = await call('POST', '/api/push/test', T.o); assert.equal(j.sent, 1);
    const m = got.pop(); assert.equal(m.url, '/owner'); assert.equal(m.h['content-encoding'], 'aes128gcm');
    assert.ok(m.h.authorization.startsWith('vapid t=') && m.h.authorization.endsWith(', k=' + key));
    assert.equal(decrypt(owner.e, owner.auth, m.body).title, 'Scoring Heroes');
    // a payment should alert the collector, and the decision should alert the payer, each with a deep link
    [st, j] = await call('POST', '/api/pay/charge', T.o, { title: 'Entry fee', upi: 'org@okbank', amount: 50000 }); const id = j.id;
    got.length = 0; [st, j] = await call('POST', '/api/pay/submit', T.a, { id, utr: '123456789012' }); const sid = j.id;
    await new Promise(r => setTimeout(r, 500)); assert.equal(got.length, 1); assert.equal(got[0].url, '/owner');
    let p = decrypt(owner.e, owner.auth, got[0].body); assert.equal(p.url, '/?pay=' + id); assert.match(p.body, /P1/);
    got.length = 0; await call('POST', '/api/pay/decide', T.o, { id, sid, status: 'confirmed' });
    await new Promise(r => setTimeout(r, 500)); assert.equal(got.length, 1); assert.equal(got[0].url, '/payer');
    p = decrypt(payer.e, payer.auth, got[0].body); assert.equal(p.title, 'Payment confirmed');
    // an expired subscription (410) is removed
    status = 410; [st, j] = await call('POST', '/api/push/test', T.a); assert.equal(j.sent, 0);
    status = 201; [st, j] = await call('POST', '/api/push/test', T.a); assert.equal(j.sent, 0);
    [st] = await call('POST', '/api/push/unsubscribe', T.o, { endpoint: owner.sub.endpoint }); assert.equal(st, 200);
    [st, j] = await call('POST', '/api/push/test', T.o); assert.equal(j.sent, 0);
  } finally { srv.kill(); ps.close(); }
});
