import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('academy sync: owner backs up, parent sees only own child, others see nothing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ay-')), port = 8264, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+919000000001': { nick: 'Coach' }, '+919000000002': { nick: 'Parent' }, '+919000000003': { nick: 'Other' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('+919000000001'), p: sign('+919000000002'), x: sign('+919000000003') };
  const call = (m, p, tk, body) => fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async r => [r.status, await r.json()]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    const mk = new Date().toISOString().slice(0, 7);
    const academy = { name: 'Sky High Academy', students: [
      { id: 's1', name: 'Arjun', sport: 'Cricket', batch: 'b1', coach: 'Ravi', fee: 1000, level: 'Beginner', parent: 'P', phone: '90000 00002', paid: { [mk]: 400 }, att: { '2026-10-01': true, '2026-10-02': false, '2026-10-03': true } },
      { id: 's2', name: 'Meera', sport: 'Cricket', fee: 900, phone: '9111111111', paid: {}, att: {} }],
      batches: [{ id: 'b1', name: 'Morning', days: ['Mon', 'Wed'], time: '6:00' }], coaches: [] };
    let [st, j] = await call('PUT', '/api/academy', null, { academy }); assert.equal(st, 401);
    [st, j] = await call('PUT', '/api/academy', T.o, { academy: { students: 'x' } }); assert.equal(st, 400);
    [st, j] = await call('PUT', '/api/academy', T.o, { academy }); assert.equal(st, 200); assert.equal(j.students, 2);
    [st, j] = await call('GET', '/api/academy', T.o); assert.equal(j.academy.students.length, 2);
    [st, j] = await call('GET', '/api/academy', T.p); assert.equal(j.academy, null);          // parent has no academy of their own
    [st, j] = await call('GET', '/api/academy/mine', T.p); assert.equal(j.items.length, 1);
    const k = j.items[0]; assert.equal(k.name, 'Arjun'); assert.equal(k.batch.name, 'Morning'); assert.equal(k.att.p, 2); assert.equal(k.att.n, 3); assert.equal(k.paid[mk], 400);
    assert.ok(!JSON.stringify(j).includes('Meera') && !JSON.stringify(j).includes('9111111111'));   // no other students or numbers
    assert.ok(!JSON.stringify(j).includes('9000000001'));                                           // owner number masked
    [st, j] = await call('GET', '/api/academy/mine', T.x); assert.equal(j.items.length, 0);
    [st] = await call('GET', '/api/academy/mine', null); assert.equal(st, 401);
  } finally { srv.kill(); }
});
