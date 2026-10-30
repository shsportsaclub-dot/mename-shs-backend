import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('teams and players registry: unique team names, player search by name/mobile, no duplicate mobile, creator rights, verified by account, captain/remove', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rg-')), port = 8279, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+919000000001': { nick: 'Cap', role: 'viewer', e164: '+919000000001' }, '+919000000002': { nick: 'Other', role: 'viewer', e164: '+919000000002' }, '+919000000003': { nick: 'Ravi', role: 'viewer', e164: '+919876543210' }, '+919000000009': { nick: 'Boss', role: 'admin', e164: '+919000000009' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, T = { c: sign('+919000000001'), o: sign('+919000000002'), a: sign('+919000000009') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/reg/teams', null, { name: 'Hyderabad Hawks' }); assert.equal(st, 401);
    [st, j] = await call('POST', '/api/reg/teams', T.c, { name: 'Hyderabad Hawks', city: 'Hyderabad', level: 'club', country: 'India', color: '#ff0000', preset: 2 }); assert.equal(st, 200); const tid = j.team.id; assert.equal(j.team.short, 'HYD');
    [st, j] = await call('POST', '/api/reg/teams', T.o, { name: ' hyderabad  HAWKS! ' }); assert.equal(st, 409); assert.equal(j.existing.id, tid); assert.equal(j.mine, false);   // unique like a handle
    [st] = await call('PUT', '/api/reg/teams', T.o, { id: tid, logo: 'data:image/png;base64,AAAA' }); assert.equal(st, 403);                       // only creator/admin change logo
    [st, j] = await call('PUT', '/api/reg/teams', T.c, { id: tid, logo: 'data:image/png;base64,iVBORw0KGgo=', city: 'Secunderabad' }); assert.equal(st, 200); assert.ok(j.team.logo); assert.equal(j.team.city, 'Secunderabad');
    [st, j] = await call('PUT', '/api/reg/teams', T.c, { id: tid, logo: 'javascript:alert(1)' }); assert.equal(j.team.logo, null);                    // bad logo rejected
    // players
    [st] = await call('POST', '/api/reg/players', T.o, { name: 'X', team: tid }); assert.equal(st, 400);
    [st] = await call('POST', '/api/reg/players', T.o, { name: 'Intruder', phone: '9111111111', team: tid }); assert.equal(st, 403);              // not the team's admin
    [st, j] = await call('POST', '/api/reg/players', T.c, { name: 'Ravi Kumar', phone: '+91 98765 43210', role: 'WK', bat: 'Left-hand', jersey: 7, team: tid }); assert.equal(st, 200); const pid = j.player.id; assert.equal(j.existing, false); assert.equal(j.player.verified, true); assert.equal(j.player.role, 'WK');   // account with same mobile exists
    assert.ok(!JSON.stringify(j).includes('9876543210'));   // number never leaks
    [st, j] = await call('POST', '/api/reg/players', T.c, { name: 'Ravi K', phone: '9876543210' }); assert.equal(j.existing, true); assert.equal(j.player.id, pid);   // no duplicate player
    [st, j] = await call('POST', '/api/reg/players', T.c, { name: 'Sai Teja', phone: '9222222222', team: tid }); assert.equal(j.player.verified, false);   // unverified until the person registers
    [st, j] = await call('GET', '/api/reg/players?q=sai'); assert.equal(j.items.length, 1); assert.equal(j.items[0].name, 'Sai Teja');
    [st, j] = await call('GET', '/api/reg/players?q=' + encodeURIComponent('98765 43210')); assert.equal(j.items.length, 1); assert.equal(j.items[0].mobile.slice(-4), '3210'); assert.deepEqual(j.items[0].teams, ['Hyderabad Hawks']);
    [st, j] = await call('GET', '/api/reg/players?q=' + encodeURIComponent('Ravi')); assert.equal(j.items.length, 1);
    // search by ID code and public profile / my ID card
    [st, j] = await call('GET', '/api/reg/players?q=' + j.items[0].code.toLowerCase()); assert.equal(j.items.length, 1); assert.equal(j.items[0].name, 'Ravi Kumar'); const code = j.items[0].code; assert.match(code, /^SH[0-9A-F]{8}$/);
    [st, j] = await call('GET', '/api/reg/player?id=' + code); assert.equal(st, 200); assert.equal(j.player.id, pid); assert.ok(!JSON.stringify(j).includes('9876543210'));
    [st] = await call('GET', '/api/reg/player?id=nope'); assert.equal(st, 404);
    [st, j] = await call('GET', '/api/reg/me', T.c); assert.equal(st, 200); const mine = j.player.id; [st, j] = await call('GET', '/api/reg/me', T.c); assert.equal(j.player.id, mine); assert.equal(j.player.verified, true);
    [st, j] = await call('GET', '/api/reg/me', T.n || T.o); assert.notEqual(j.player.id, mine);
    // captain and remove
    [st] = await call('POST', '/api/reg/members', T.o, { team: tid, player: pid, act: 'captain' }); assert.equal(st, 403);
    [st, j] = await call('POST', '/api/reg/members', T.c, { team: tid, player: pid, act: 'captain' }); assert.equal(j.team.captain, pid);
    [st, j] = await call('POST', '/api/reg/members', T.a, { team: tid, player: pid, act: 'remove' }); assert.equal(st, 200); assert.equal(j.team.n, 1); assert.equal(j.team.captain, '');   // admin may
    [st, j] = await call('GET', '/api/reg/players?q=ravi'); assert.equal(j.items.length, 1);   // history/profile stays after removal
    [st, j] = await call('GET', '/api/reg/team?id=' + tid); assert.equal(j.team.players.length, 1);
    [st, j] = await call('GET', '/api/reg/teams?q=hawks'); assert.equal(j.items.length, 1);
    // squad cap
    for (let i = 0; i < 29; i++) { [st] = await call('POST', '/api/reg/players', T.c, { name: 'Filler ' + i, team: tid }); }
    [st, j] = await call('POST', '/api/reg/players', T.c, { name: 'One Too Many', team: tid }); assert.equal(st, 409);
  } finally { srv.kill(); }
});
