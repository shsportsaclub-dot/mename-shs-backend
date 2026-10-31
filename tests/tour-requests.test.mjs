import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('tournament team approval: request, duplicates, only organiser decides, reason on reject', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tr-')), port = 8273, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Org', role: 'viewer' }, '+912': { nick: 'Mgr1', role: 'viewer' }, '+913': { nick: 'Mgr2', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('+911'), a: sign('+912'), b: sign('+913') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('GET', '/api/tours/info?tid=nope'); assert.equal(st, 404);
    [st] = await call('PUT', '/api/shared/tours/tour-1', T.o, { data: { t: { id: 'tour-1', name: 'Summer Cup', overs: 20, teams: ['a'], feeCharge: 'py0123456789' }, teams: {} } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/tours/info?tid=tour-1'); assert.equal(j.tour.name, 'Summer Cup'); assert.equal(j.tour.organizer, 'Org'); assert.equal(j.tour.fee, 'py0123456789');
    [st] = await call('POST', '/api/tours/join', null, { tid: 'tour-1', name: 'Lions' }); assert.equal(st, 401);
    [st] = await call('POST', '/api/tours/join', T.a, { tid: 'tour-1', name: 'L' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/tours/join', T.a, { tid: 'tour-1', name: 'Lions <b>', short: 'lio', city: 'Hyd' }); assert.equal(st, 200); const rid = j.id;
    [st] = await call('POST', '/api/tours/join', T.a, { tid: 'tour-1', name: 'Lions <b>' }); assert.equal(st, 409);   // own duplicate while waiting
    [st] = await call('POST', '/api/tours/join', T.b, { tid: 'tour-1', name: 'Lions <b>' }); assert.equal(st, 409);   // same name from someone else
    [st, j] = await call('GET', '/api/tours/requests?tid=tour-1', T.b); assert.equal(j.owner, false); assert.equal(j.items.length, 0);
    [st, j] = await call('GET', '/api/tours/requests?tid=tour-1', T.o); assert.equal(j.owner, true); assert.equal(j.items.length, 1); assert.ok(!/[<>]/.test(j.items[0].name)); assert.equal(j.items[0].short, 'LIO');
    [st] = await call('POST', '/api/tours/decide', T.a, { tid: 'tour-1', rid, status: 'approved' }); assert.equal(st, 403);   // a team manager cannot approve themselves
    [st] = await call('POST', '/api/tours/decide', T.o, { tid: 'tour-1', rid, status: 'rejected' }); assert.equal(st, 400);   // reason needed
    [st, j] = await call('POST', '/api/tours/decide', T.o, { tid: 'tour-1', rid, status: 'rejected', reason: 'Entry full' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/tours/requests?tid=tour-1', T.a); assert.equal(j.items[0].status, 'rejected'); assert.equal(j.items[0].reason, 'Entry full');
    [st] = await call('POST', '/api/tours/join', T.a, { tid: 'tour-1', name: 'Lions <b>' }); assert.equal(st, 200);          // may apply again after rejection
    [st, j] = await call('GET', '/api/tours/requests?tid=tour-1', T.o); const r2 = j.items[0].id;
    [st, j] = await call('POST', '/api/tours/decide', T.o, { tid: 'tour-1', rid: r2, status: 'approved' }); assert.equal(st, 200); assert.equal(j.item.status, 'approved');
  } finally { srv.kill(); }
});
