import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('boards: found, admins, affiliation request, approve/reject/revoke, permissions', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-')), port = 8274, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Founder', role: 'viewer' }, '+912': { nick: 'Sec', role: 'viewer' }, '+913': { nick: 'Club', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { f: sign('+911'), s: sign('+912'), c: sign('+913') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/boards/create', null, { name: 'Hyd League' }); assert.equal(st, 401);
    [st] = await call('POST', '/api/boards/create', T.f, { name: 'ab' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/boards/create', T.f, { name: 'Hyd <i>League', city: 'Hyd', level: 'district' }); assert.equal(st, 200); const id = j.id;
    [st] = await call('POST', '/api/boards/create', T.s, { name: 'hyd <i>league' }); assert.equal(st, 409);
    [st, j] = await call('GET', '/api/boards?q=hyd'); assert.equal(j.items.length, 1); assert.ok(!/[<>]/.test(j.items[0].name));
    [st] = await call('POST', '/api/boards/admin', T.s, { id, phone: '+912' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/boards/admin', T.f, { id, phone: '+999' }); assert.equal(st, 404);
    [st] = await call('POST', '/api/boards/admin', T.f, { id, phone: '+912' }); assert.equal(st, 200);
    [st] = await call('POST', '/api/boards/affiliate', T.c, { id, kind: 'team', name: 'Lions CC' }); assert.equal(st, 200);
    [st] = await call('POST', '/api/boards/affiliate', T.c, { id, kind: 'team', name: 'lions cc' }); assert.equal(st, 409);
    [st, j] = await call('GET', '/api/boards/detail?id=' + id, T.c); assert.equal(j.admin, false); assert.equal(j.pending.length, 0); assert.equal(j.mine.length, 1);
    [st, j] = await call('GET', '/api/boards/detail?id=' + id, T.s); assert.equal(j.admin, true); assert.equal(j.pending.length, 1); const rid = j.pending[0].id;
    [st] = await call('POST', '/api/boards/decide', T.c, { id, rid, status: 'approved' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/boards/decide', T.s, { id, rid, status: 'rejected' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/boards/decide', T.s, { id, rid, status: 'approved' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/boards/detail?id=' + id); assert.equal(j.members.length, 1); assert.equal(j.board.members, 1); assert.equal(j.admin, false);
    [st] = await call('POST', '/api/boards/decide', T.s, { id, rid, status: 'revoked' }); assert.equal(st, 400);   // reason needed
    [st] = await call('POST', '/api/boards/decide', T.s, { id, rid, status: 'revoked', reason: 'Fees unpaid' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/boards/detail?id=' + id); assert.equal(j.members.length, 0);
    [st] = await call('POST', '/api/boards/affiliate', T.c, { id, kind: 'tour', name: 'Summer Cup' }); assert.equal(st, 200);
    [st] = await call('POST', '/api/boards/admin', T.f, { id, phone: '+912', remove: true }); assert.equal(st, 200);
    [st] = await call('POST', '/api/boards/decide', T.s, { id, rid, status: 'approved' }); assert.equal(st, 403);
  } finally { srv.kill(); }
});
