import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('paid viewing: server withholds the stream link until the collector confirms a payment', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-')), port = 8291, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Scorer', role: 'scorer' }, '9000000002': { nick: 'Fan', role: 'viewer' }, '9000000003': { nick: 'Other', role: 'viewer' }, '9000000004': { nick: 'Scorer2', role: 'scorer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { s: sign('9000000001'), f: sign('9000000002'), o: sign('9000000003'), s2: sign('9000000004') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j; const URL1 = 'https://www.youtube.com/live/abc123', URL2 = 'https://www.youtube.com/live/cam2';
    await call('POST', '/api/streams', T.s, { key: 'm1', url: URL1 }); await call('POST', '/api/streams', T.s, { key: 'm1_s2', url: URL2 });
    [st, j] = await call('GET', '/api/streams'); assert.equal(j.streams.m1, URL1);   // free until gated
    [st, j] = await call('POST', '/api/pay/charge', T.s, { title: 'Viewing pass', upi: 'org@okbank', amount: 10000, kind: 'pass', ref: 'm1' }); const id = j.id;
    [st] = await call('POST', '/api/streams/gate', T.f, { key: 'm1', charge: id }); assert.equal(st, 403);      // viewers cannot gate
    [st] = await call('POST', '/api/streams/gate', T.s2, { key: 'm1', charge: id }); assert.equal(st, 403);     // not their charge
    [st] = await call('POST', '/api/streams/gate', T.s, { key: 'm1', charge: 'nope' }); assert.equal(st, 404);
    [st] = await call('POST', '/api/streams/gate', T.s, { key: 'm1', charge: id }); assert.equal(st, 200);
    const raw = async tk => JSON.stringify((await call('GET', '/api/streams', tk))[1]);
    for (const tk of [null, T.f, T.o]) { const t = await raw(tk); assert.ok(!t.includes('abc123') && !t.includes('cam2'), 'link must not leak'); const [, g] = await call('GET', '/api/streams', tk); assert.deepEqual(g.locked, ['m1']); assert.equal(g.gates.m1, id); }
    [st, j] = await call('GET', '/api/streams', T.s); assert.equal(j.streams.m1, URL1); assert.equal(j.streams.m1_s2, URL2); assert.deepEqual(j.locked, []);   // collector sees it
    await call('POST', '/api/pay/submit', T.f, { id, utr: '123456789012' });
    assert.ok(!(await raw(T.f)).includes('abc123'));                              // submitted but not confirmed
    [st, j] = await call('GET', '/api/pay/charge?id=' + id, T.s); const sid = j.charge.subs[0].id;
    await call('POST', '/api/pay/decide', T.s, { id, sid, status: 'confirmed' });
    [st, j] = await call('GET', '/api/streams', T.f); assert.equal(j.streams.m1, URL1); assert.equal(j.streams.m1_s2, URL2); assert.deepEqual(j.locked, []);
    assert.ok(!(await raw(T.o)).includes('abc123'));                              // someone else still locked
    [st] = await call('POST', '/api/streams/gate', T.s, { key: 'm1', charge: null }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/streams'); assert.equal(j.streams.m1, URL1);   // free again
  } finally { srv.kill(); }
});
