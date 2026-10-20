import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('online ground booking: server prices, rejects clashes/closed/hours, owner accepts, privacy of others', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gb-')), port = 8263, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  const day = (dow) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 7 + ((dow - d.getUTCDay() + 7) % 7)); return d.toISOString().slice(0, 10); }, wed = day(3), sat = day(6);
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Owner', role: 'viewer' }, '+912': { nick: 'Cust', role: 'viewer' }, '+913': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('+911'), c: sign('+912'), x: sign('+913') };
  const call = (m, p, tk, body) => fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async r => [r.status, await r.json()]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    const g = { id: 'gr1abc', name: 'Sky Turf', on: true, rates: { base: 1000, peak: 1500, wkend: 2000 }, peakFrom: 17, slotMin: 60, open: '06:00', close: '22:00', blackout: ['2099-01-01'] };
    let [st, j] = await call('PUT', '/api/shared/grounds/gr1abc', T.o, { data: { g } }); assert.equal(st, 200);
    [st] = await call('POST', '/api/gbook/nope', T.c, {}); assert.equal(st, 404);
    [st] = await call('POST', '/api/gbook/gr1abc', null, { date: wed, start: '10:00', dur: 120, who: 'C', phone: '9000000001' }); assert.equal(st, 401);
    [st, j] = await call('POST', '/api/gbook/gr1abc', T.c, { date: wed, start: '10:00', dur: 120, who: 'Ravi', phone: '9000000001', amt: 1 }); assert.equal(st, 200); assert.equal(j.booking.amt, 2000); assert.equal(j.booking.status, 'requested');   // client amount ignored
    const bid = j.booking.id;
    [st, j] = await call('POST', '/api/gbook/gr1abc', T.x, { date: wed, start: '11:00', dur: 60, who: 'O', phone: '9000000002' }); assert.equal(st, 409);   // clash
    [st] = await call('POST', '/api/gbook/gr1abc', T.x, { date: wed, start: '12:00', dur: 60, who: 'O', phone: '9000000002' }); assert.equal(st, 200);       // adjacent ok
    [st] = await call('POST', '/api/gbook/gr1abc', T.x, { date: '2099-01-01', start: '10:00', dur: 60, who: 'O', phone: '9000000002' }); assert.equal(st, 409); // closed
    [st] = await call('POST', '/api/gbook/gr1abc', T.x, { date: wed, start: '21:00', dur: 120, who: 'O', phone: '9000000002' }); assert.equal(st, 409);          // hours
    [st] = await call('POST', '/api/gbook/gr1abc', T.x, { date: wed, start: '14:00', dur: 45, who: 'O', phone: '9000000002' }); assert.equal(st, 400);          // not a slot multiple
    [st] = await call('POST', '/api/gbook/gr1abc', T.x, { date: wed, start: '14:00', dur: 60, who: 'O', phone: 'abc' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/gbook/gr1abc', T.o, { date: sat, start: '10:00', dur: 120, who: 'Walkin', phone: '9000000003' }); assert.equal(st, 200); assert.equal(j.booking.status, 'confirmed'); assert.equal(j.booking.amt, 4000);
    [st, j] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.c, { status: 'confirmed' }); assert.equal(st, 403);          // customer cannot accept own request
    [st, j] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.o, { status: 'confirmed' }); assert.equal(st, 200); assert.equal(j.booking.status, 'confirmed');
    [st] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.o, { paid: 99999 }); assert.equal(st, 400);
    [st, j] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.o, { paid: 500 }); assert.equal(j.booking.paid, 500);
    [st] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.c, { paid: 2000 }); assert.equal(st, 403);
    [st, j] = await call('GET', '/api/gbook/gr1abc', T.c); assert.equal(j.items.length, 1); assert.equal(j.owner, false);                 // customer sees only theirs
    [st, j] = await call('GET', '/api/gbook/gr1abc', T.o); assert.equal(j.items.length, 3); assert.equal(j.owner, true);
    [st, j] = await call('GET', `/api/gbook/gr1abc?busy=1&date=${wed}`, null); assert.equal(st, 200); assert.equal(j.busy.length, 2); assert.ok(!('who' in j.busy[0]) && !('phone' in j.busy[0]));   // public busy slots, no personal data
    [st, j] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.x, { status: 'cancelled' }); assert.equal(st, 403);
    [st, j] = await call('PUT', `/api/gbook/gr1abc/${bid}`, T.c, { status: 'cancelled' }); assert.equal(j.booking.status, 'cancelled');
    [st] = await call('POST', '/api/gbook/gr1abc', T.x, { date: wed, start: '10:00', dur: 60, who: 'O', phone: '9000000002' }); assert.equal(st, 200);          // freed
    [st, j] = await call('PUT', '/api/shared/grounds/gr1abc', T.x, { data: { g } }); assert.equal(st, 403);                                              // only owner edits listing
  } finally { srv.kill(); }
});
