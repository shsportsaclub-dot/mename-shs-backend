import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { genVapid } from '../webpush.mjs';
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const hkdf = (salt, ikm, info, len) => { const prk = hmac(salt, ikm); let t = Buffer.alloc(0), out = Buffer.alloc(0), i = 1; while (out.length < len) { t = hmac(prk, Buffer.concat([t, info, Buffer.from([i++])])); out = Buffer.concat([out, t]); } return out.subarray(0, len); };
const decrypt = (ua, auth, rec) => { const salt = rec.subarray(0, 16), idl = rec[20], asPub = rec.subarray(21, 21 + idl), ct = rec.subarray(21 + idl);
  const ikm = hkdf(auth, ua.computeSecret(asPub), Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPub]), 32);
  const d = crypto.createDecipheriv('aes-128-gcm', hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12)); d.setAuthTag(ct.subarray(ct.length - 16));
  const p = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]); return JSON.parse(p.subarray(0, p.length - 1).toString()); };
test('match alerts: start, wicket (throttled) and result reach followers of either team, not the scorer or non-followers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ma-')), port = 8293, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Scorer', role: 'scorer' }, '9000000002': { nick: 'Fan', role: 'viewer' }, '9000000003': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const got = []; const ps = http.createServer((q, r) => { const ch = []; q.on('data', c => ch.push(c)); q.on('end', () => { got.push({ url: q.url, body: Buffer.concat(ch) }); r.writeHead(201); r.end(); }); });
  await new Promise(r => ps.listen(0, '127.0.0.1', r)); const pport = ps.address().port, v = genVapid();
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0', VAPID_PUBLIC: v.pub, VAPID_PRIVATE: v.priv }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { s: sign('9000000001'), f: sign('9000000002'), o: sign('9000000003') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const mk = tag => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); const auth = crypto.randomBytes(16); return { e, auth, sub: { endpoint: `http://127.0.0.1:${pport}/${tag}`, keys: { p256dh: e.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } } }; };
  const wait = () => new Promise(r => setTimeout(r, 600));
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    const fan = mk('fan'), oth = mk('other'), sc = mk('scorer');
    for (const [t, k] of [[T.f, fan], [T.o, oth], [T.s, sc]]) await call('POST', '/api/push/subscribe', t, { sub: k.sub });
    [st] = await call('POST', '/api/push/follow', null, { teams: ['tA'] }); assert.equal(st, 401);
    [st, j] = await call('POST', '/api/push/follow', T.f, { teams: ['tB', 'bad id!', 'tB'], matches: [] }); assert.equal(j.teams, 1);
    await call('POST', '/api/push/follow', T.s, { teams: ['tA'] });   // the scorer follows too but must not alert themselves
    const teams = { tA: { name: 'Lions' }, tB: { name: 'Tigers' } }, wk = n => Array.from({ length: n }, () => ({ w: 'bowled' }));
    const save = m => call('PUT', '/api/shared/matches/mm1', T.s, { data: { m: { id: 'mm1', a: 'tA', b: 'tB', ...m }, teams } });
    await save({ status: 'setup', innings: [] }); await wait(); assert.equal(got.length, 0);
    await save({ status: 'live', innings: [{ ev: [] }] }); await wait();
    assert.equal(got.length, 1); assert.equal(got[0].url, '/fan'); let p = decrypt(fan.e, fan.auth, got[0].body); assert.equal(p.title, 'Match started'); assert.equal(p.body, 'Lions v Tigers'); assert.equal(p.url, '/?match=mm1');
    got.length = 0; await save({ status: 'live', innings: [{ ev: wk(1) }] }); await wait();
    assert.equal(got.length, 1); p = decrypt(fan.e, fan.auth, got[0].body); assert.match(p.title, /^Wicket! Lions v Tigers/);
    got.length = 0; await save({ status: 'live', innings: [{ ev: wk(2) }] }); await wait(); assert.equal(got.length, 0);   // throttled
    await save({ status: 'live', innings: [{ ev: wk(2) }] }); await wait(); assert.equal(got.length, 0);   // no change, no alert
    await save({ status: 'done', result: 'Lions won by 5 runs', innings: [{ ev: wk(2) }] }); await wait();
    assert.equal(got.length, 1); p = decrypt(fan.e, fan.auth, got[0].body); assert.equal(p.title, 'Result: Lions v Tigers'); assert.equal(p.body, 'Lions won by 5 runs');
    assert.ok(got.every(x => x.url === '/fan'));   // 'other' never followed, scorer excluded
    got.length = 0; await save({ status: 'done', result: 'Lions won by 5 runs', innings: [{ ev: wk(2) }] }); await wait(); assert.equal(got.length, 0);   // resaving a finished match is silent
    // tournament follow and single-match follow
    await call('POST', '/api/push/follow', T.o, { teams: [], tours: ['tourX'], matches: ['mm3'] });
    got.length = 0; await call('PUT', '/api/shared/matches/mm2', T.s, { data: { m: { id: 'mm2', a: 'tC', b: 'tD', tid: 'tourX', status: 'live', innings: [] }, teams } }); await wait();
    assert.equal(got.length, 1); assert.equal(got[0].url, '/other');
    got.length = 0; await call('PUT', '/api/shared/matches/mm2', T.s, { data: { m: { id: 'mm2', a: 'tC', b: 'tD', tid: 'tourY', status: 'done', result: 'x', innings: [] }, teams } }); await wait();
    assert.equal(got.length, 0);   // the saved match now belongs to a tournament this user does not follow
    got.length = 0; await call('PUT', '/api/shared/matches/mm3', T.s, { data: { m: { id: 'mm3', a: 'tE', b: 'tF', status: 'live', innings: [] }, teams } }); await wait();
    assert.equal(got.length, 1); assert.equal(got[0].url, '/other');
  } finally { srv.kill(); ps.close(); }
});
