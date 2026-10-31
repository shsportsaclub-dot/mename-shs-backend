import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('tournament viewing pass: one payment unlocks the streams of every match in the tournament', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-')), port = 8313, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Org', role: 'scorer' }, '9000000002': { nick: 'Fan', role: 'viewer' }, '9000000003': { nick: 'Other', role: 'viewer' }, '9000000004': { nick: 'Scorer2', role: 'scorer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('9000000001'), f: sign('9000000002'), x: sign('9000000003'), s2: sign('9000000004') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    const U1 = 'https://www.youtube.com/live/m1', U2 = 'https://www.youtube.com/live/m2', U3 = 'https://www.youtube.com/live/free';
    const team = id => ({ id, name: id }), put = (id, tid) => call('PUT', '/api/shared/matches/' + id, T.o, { data: { m: { id, a: 'tA', b: 'tB', status: 'live', innings: [], ...(tid ? { tid } : {}) }, teams: { tA: team('tA'), tB: team('tB') }, players: {} } });
    await put('mm1', 'tr1'); await put('mm2', 'tr1'); await put('mm3');
    for (const [k, u] of [['mmm1', U1], ['mmm2', U2], ['mmm3', U3]]) await call('POST', '/api/streams', T.o, { key: k, url: u });
    [st] = await call('POST', '/api/pay/charge', T.o, { title: 'Pass', upi: 'org@okbank', amount: 30000, kind: 'pass', ref: 'tr1', days: 0 });
    [st, j] = await call('POST', '/api/pay/charge', T.o, { title: 'Cup viewing pass', upi: 'org@okbank', amount: 30000, kind: 'pass', ref: 'tr1' }); const ch = j.id;
    [st] = await call('POST', '/api/streams/gate', T.o, { key: 'T:tr1', charge: ch }); assert.equal(st, 404);   // tournament not shared yet
    await call('PUT', '/api/shared/tours/tr1', T.o, { data: { t: { id: 'tr1', name: 'Cup', teams: [] }, teams: {} } });
    [st] = await call('POST', '/api/streams/gate', T.s2, { key: 'T:tr1', charge: ch }); assert.equal(st, 403);   // not the tournament's owner
    [st] = await call('POST', '/api/streams/gate', T.f, { key: 'T:tr1', charge: ch }); assert.equal(st, 403);    // viewer
    [st] = await call('POST', '/api/streams/gate', T.o, { key: 'T:tr1', charge: ch }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/streams', T.f); assert.equal(j.streams.mmm3, U3); assert.equal(j.streams.mmm1, undefined); assert.equal(j.streams.mmm2, undefined);
    assert.deepEqual(j.locked.sort(), ['mmm1', 'mmm2']); assert.equal(j.lockedBy.mmm1, ch); assert.ok(!JSON.stringify(j).includes('/m1') && !JSON.stringify(j).includes('/m2'));
    [st, j] = await call('GET', '/api/streams', T.o); assert.equal(j.streams.mmm1, U1);   // the organiser sees them
    [st, j] = await call('POST', '/api/pay/submit', T.f, { id: ch, utr: '123456789012' }); const sid = j.id;
    [st, j] = await call('GET', '/api/streams', T.f); assert.equal(j.streams.mmm1, undefined);   // submitted, not confirmed
    await call('POST', '/api/pay/decide', T.o, { id: ch, sid, status: 'confirmed' });
    [st, j] = await call('GET', '/api/streams', T.f); assert.equal(j.streams.mmm1, U1); assert.equal(j.streams.mmm2, U2); assert.deepEqual(j.locked, []);
    [st, j] = await call('GET', '/api/streams', T.x); assert.equal(j.streams.mmm1, undefined);   // someone else still locked
    // a match with its own pass as well needs both
    [st, j] = await call('POST', '/api/pay/charge', T.o, { title: 'Final pass', upi: 'org@okbank', amount: 10000, kind: 'pass', ref: 'mmm2' }); const ch2 = j.id;
    await call('POST', '/api/streams/gate', T.o, { key: 'mmm2', charge: ch2 });
    [st, j] = await call('GET', '/api/streams', T.f); assert.equal(j.streams.mmm1, U1); assert.equal(j.streams.mmm2, undefined); assert.equal(j.lockedBy.mmm2, ch2);
    [st] = await call('POST', '/api/streams/gate', T.o, { key: 'T:tr1', charge: null }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/streams', T.x); assert.equal(j.streams.mmm1, U1); assert.equal(j.streams.mmm2, undefined);   // tournament free, the final still paid
  } finally { srv.kill(); }
});
