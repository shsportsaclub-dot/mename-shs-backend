import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('team join requests: public team card, signed-in request, owner-only review', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tr-')), port = 8272, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Captain', role: 'viewer' }, '+912': { nick: 'Sonu', role: 'viewer' }, '+913': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('+911'), p: sign('+912'), x: sign('+913') };
  const call = (m, p, tk, body) => fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async r => [r.status, await r.json().catch(() => ({}))]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    let [st, j] = await call('POST', '/api/teamreq/team-lions', T.p, { name: 'Sonu' }); assert.equal(st, 404, 'team must be published first');
    [st] = await call('PUT', '/api/shared/teams/team-lions', T.o, { data: { t: { id: 'team-lions', name: 'Hapur Lions', short: 'HPL', color: '#2563eb', level: 'club', players: ['secret'], phone: '9999999999' } } }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/shared/teams/team-lions'); assert.equal(st, 200); assert.equal(j.item.data.t.name, 'Hapur Lions'); assert.ok(!('players' in j.item.data.t) && !('phone' in j.item.data.t), 'only the public card is stored');
    [st] = await call('PUT', '/api/shared/teams/team-bad', T.o, { data: { t: { id: 'team-bad', name: '', short: 'X' } } }); assert.equal(st, 400);
    [st] = await call('POST', '/api/teamreq/team-lions', null, { name: 'Sonu' }); assert.equal(st, 401);
    [st, j] = await call('POST', '/api/teamreq/team-lions', T.p, { name: 'Sonu', phone: '9000000002', msg: 'Opening batter' }); assert.equal(st, 200); const rid = j.id;
    [st] = await call('POST', '/api/teamreq/team-lions', T.p, { name: 'Sonu' }); assert.equal(st, 409, 'one pending request per person');
    [st, j] = await call('GET', '/api/teamreq/team-lions', T.o); assert.equal(j.owner, true); assert.equal(j.items.length, 1); assert.equal(j.items[0].phone, '9000000002');
    [st, j] = await call('GET', '/api/teamreq/team-lions', T.x); assert.equal(j.owner, false); assert.equal(j.mine.length, 0, 'strangers do not see requests');
    [st, j] = await call('GET', '/api/teamreq/team-lions', T.p); assert.equal(j.mine.length, 1); assert.ok(!('phone' in j.mine[0]));
    [st] = await call('PUT', `/api/teamreq/team-lions/${rid}`, T.p, { status: 'accepted' }); assert.equal(st, 403, 'requester cannot accept own request');
    [st] = await call('PUT', `/api/teamreq/team-lions/${rid}`, T.o, { status: 'maybe' }); assert.equal(st, 400);
    [st] = await call('PUT', `/api/teamreq/team-lions/${rid}`, T.o, { status: 'accepted' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/teamreq/team-lions', T.p); assert.equal(j.mine[0].status, 'accepted');
    [st] = await call('PUT', '/api/shared/teams/team-lions', T.x, { data: { t: { id: 'team-lions', name: 'Hijack', short: 'HJK' } } }); assert.equal(st, 403);
  } finally { srv.kill(); }
});
