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
test('squad members with an account see the match in their list and are alerted when it is created and when it starts', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-')), port = 8309, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Scorer', role: 'scorer' }, '9000000002': { nick: 'ByPhone', role: 'viewer' }, '9000000003': { nick: 'ByShid', role: 'viewer', shid: 'SH-AB12CD34' }, '9000000004': { nick: 'ByRegistry', role: 'viewer' }, '9000000005': { nick: 'Outsider', role: 'viewer' } },
    shared: { rgPlayers: { pr1: { id: 'pr1', name: 'Reg Player', ph: '9000000004' } } } }));
  const got = []; const ps = http.createServer((q, r) => { const ch = []; q.on('data', c => ch.push(c)); q.on('end', () => { got.push({ url: q.url, body: Buffer.concat(ch) }); r.writeHead(201); r.end(); }); });
  await new Promise(r => ps.listen(0, '127.0.0.1', r)); const pport = ps.address().port, v = genVapid();
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0', VAPID_PUBLIC: v.pub, VAPID_PRIVATE: v.priv }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = Object.fromEntries(['1', '2', '3', '4', '5'].map(n => [n, sign('900000000' + n)]));
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const keys = {}; const mk = tag => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); const auth = crypto.randomBytes(16); keys[tag] = { e, auth }; return { endpoint: `http://127.0.0.1:${pport}/${tag}`, keys: { p256dh: e.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } }; };
  const wait = () => new Promise(r => setTimeout(r, 700)); const tell = () => got.map(g => { const k = keys[g.url.slice(1)]; return g.url.slice(1) + ':' + decrypt(k.e, k.auth, g.body).title; }).sort();
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    for (const [n, tag] of [['1', 'scorer'], ['2', 'phone'], ['3', 'shid'], ['4', 'reg'], ['5', 'outsider']]) await call('POST', '/api/push/subscribe', T[n], { sub: mk(tag) });
    const teams = { tA: { id: 'tA', name: 'Lions' }, tB: { id: 'tB', name: 'Tigers' } };
    const link = { phones: ['+91 90000 00002', '12345'], shids: ['SH-AB12CD34', 'bad'], rids: ['pr1', 'nope'] };
    const save = (m, withLink = true) => call('PUT', '/api/shared/matches/mq1', T[1], { data: { m: { id: 'mq1', a: 'tA', b: 'tB', date: '2026-11-01', innings: [], ...m }, teams, players: {}, ...(withLink ? { link } : {}) } });
    [st] = await save({ status: 'setup' }); assert.equal(st, 200); await wait();
    assert.deepEqual(tell(), ['phone:You are in a match', 'reg:You are in a match', 'shid:You are in a match']);   // never the scorer or the outsider
    [st, j] = await call('GET', '/api/shared/matches/mq1'); assert.ok(!JSON.stringify(j).includes('9000000002') && !JSON.stringify(j).includes('SH-AB12CD34') && j.item.data.link === undefined);   // numbers never leave the server
    for (const [n, yes] of [['2', 1], ['3', 1], ['4', 1], ['1', 0], ['5', 0]]) { [st, j] = await call('GET', '/api/me/matches', T[n]); assert.equal(j.items.length, yes, 'list for ' + n); if (yes) { assert.equal(j.items[0].a, 'Lions'); assert.equal(j.items[0].b, 'Tigers'); } }
    [st] = await call('GET', '/api/me/matches'); assert.equal(st, 401);
    got.length = 0; await save({ status: 'setup', name: 'again' }); await wait(); assert.equal(got.length, 0);   // re-saving does not repeat the alert
    got.length = 0; await save({ status: 'live' }, false); await wait();   // a save without the link keeps the squad
    assert.deepEqual(tell(), ['phone:Your match has started', 'reg:Your match has started', 'shid:Your match has started']);
    [st, j] = await call('GET', '/api/me/matches', T[2]); assert.equal(j.items[0].status, 'live');
    got.length = 0; await save({ status: 'done', result: 'Lions won' }); await wait(); assert.deepEqual(tell(), ['phone:Result: Lions v Tigers', 'reg:Result: Lions v Tigers', 'shid:Result: Lions v Tigers']);
  } finally { srv.kill(); ps.close(); }
});
