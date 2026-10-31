import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { createIds, PLAYER_RE, MATCH_RE } from '../ids.mjs';

test('formats, monthly and daily sequences, retries, no recycling', () => {
  const db = {}; let t = Date.parse('2026-11-01T06:00:00Z'); let saves = 0;
  const I = createIds({ db: () => db, save: () => saves++, now: () => t, tz: 'Asia/Kolkata' });
  const p1 = I.allocPlayer({ ref: 'a', name: 'Asha' }), p2 = I.allocPlayer({ ref: 'b', name: 'Bala' });
  assert.equal(p1.public_player_id, 'SH-P-202611-000001'); assert.equal(p2.public_player_id, 'SH-P-202611-000002');
  assert.match(p1.public_player_id, PLAYER_RE);
  assert.equal(I.allocPlayer({ ref: 'a', name: 'Asha K' }).public_player_id, p1.public_player_id, 'retry returns the same ID');
  /* the same mobile number in another team or club is the same person */
  const q1 = I.allocPlayer({ phone: '+91 98765 43210', name: 'Ravi', ref: 'team1-p3' }), q2 = I.allocPlayer({ phone: '9876543210', name: 'Ravi K', ref: 'team9-p7' });
  assert.equal(q1.public_player_id, q2.public_player_id); assert.equal(q2.existing, true);
  /* verification keeps the ID */
  const v = I.allocPlayer({ phone: '9876543210', verified: true }); assert.equal(v.public_player_id, q1.public_player_id); assert.equal(v.verification_status, 'verified');
  /* the monthly counter restarts, old IDs untouched */
  t = Date.parse('2026-12-02T06:00:00Z'); assert.equal(I.allocPlayer({ ref: 'c' }).public_player_id, 'SH-P-202612-000001');
  assert.equal(I.allocPlayer({ ref: 'a' }).public_player_id, 'SH-P-202611-000001');
  /* matches: daily sequence, same ID through status changes, sports kept apart */
  t = Date.parse('2026-11-01T06:00:00Z');
  const m1 = I.allocMatch({ ref: 'm1', sport: 'cricket', created: t }), m2 = I.allocMatch({ ref: 'm2', sport: 'cricket', created: t });
  assert.equal(m1.public_match_id, 'SH-M-20261101-000001'); assert.equal(m2.public_match_id, 'SH-M-20261101-000002'); assert.match(m1.public_match_id, MATCH_RE);
  const f1 = I.allocMatch({ ref: 'm1', sport: 'football', created: t }); assert.notEqual(f1.public_match_id, m1.public_match_id, 'same ref in another sport is a different match');
  for (const st of ['live', 'completed', 'abandoned']) assert.equal(I.allocMatch({ ref: 'm1', sport: 'cricket', status: st }).public_match_id, m1.public_match_id);
  assert.equal(I.allocMatch({ ref: 'm1', sport: 'cricket', scheduled_date: '2026-11-09' }).public_match_id, m1.public_match_id, 'rescheduling keeps the ID');
  I.matchStatus('cricket', 'm2', 'cancelled');
  const m3 = I.allocMatch({ ref: 'm3', sport: 'cricket', created: t }); assert.equal(m3.public_match_id, 'SH-M-20261101-000004', 'cancelled IDs are never recycled (000003 went to football)');
  t = Date.parse('2026-11-02T06:00:00Z'); assert.equal(I.allocMatch({ ref: 'm9', created: t }).public_match_id, 'SH-M-20261102-000001');
  /* creation date uses the local calendar day: 20:00 UTC on 1 Nov is already 2 Nov in India */
  t = Date.parse('2026-11-01T20:00:00Z'); assert.equal(I.allocMatch({ ref: 'late', created: t }).public_match_id, 'SH-M-20261102-000002');
  /* external IDs stay separate */
  const e = I.mapExternal({ entity_type: 'player', id: p1.public_player_id, source_provider: 'cricheroes', external_source_id: '555' }); assert.equal(e.entity_type, 'player');
  assert.throws(() => I.mapExternal({ entity_type: 'player', id: p2.public_player_id, source_provider: 'cricheroes', external_source_id: '555' }), /already belongs/);
  assert.equal(I.lookup(p1.public_player_id).external.length, 1);
  assert.ok(saves > 5);
  const all = [...Object.values(db.idReg.players).map(x => x.public_player_id), ...Object.values(db.idReg.matches).map(x => x.public_match_id)]; assert.equal(new Set(all).size, all.length, 'all public IDs unique');
});

test('server routes: sign-up issues the Player ID, batch is idempotent, same number gets the same ID', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ids-')), port = 8321, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Scorer', role: 'scorer' }, '9000000002': { nick: 'Viewer', role: 'viewer' } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); let j = {}; try { j = await r.json(); } catch {} return [r.status, j]; };
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    [st] = await call('POST', '/api/ids/batch', null, { players: [] }); assert.equal(st, 401);
    [st, j] = await call('GET', '/api/ids/me', sign('9000000002')); assert.equal(st, 200); assert.match(j.player_id, PLAYER_RE);
    const mine = j.player_id; [, j] = await call('GET', '/api/ids/me', sign('9000000002')); assert.equal(j.player_id, mine, 'stable');
    const batch = { players: [{ ref: 'p1', name: 'Kiran', phone: '9111122222' }, { ref: 'p2', name: 'Kiran K', phone: '+91 91111 22222' }, { ref: 'p3', name: 'Other', phone: '9000000002' }], matches: [{ ref: 'm1', sport: 'cricket', status: 'live' }] };
    [st, j] = await call('POST', '/api/ids/batch', sign('9000000001'), batch); assert.equal(st, 200);
    assert.equal(j.players.p1.id, j.players.p2.id, 'one person, one ID'); assert.equal(j.players.p3.id, mine, 'a registered player keeps the ID issued at sign-up'); assert.match(j.matches.m1.id, MATCH_RE);
    const first = j.matches.m1.id; [, j] = await call('POST', '/api/ids/batch', sign('9000000001'), { matches: [{ ref: 'm1', sport: 'cricket', status: 'completed' }] }); assert.equal(j.matches.m1.id, first);
    [st, j] = await call('GET', '/api/ids/lookup?id=' + first); assert.equal(st, 200); assert.equal(j.status, 'completed');
    [st] = await call('POST', '/api/ids/external', sign('9000000001'), { entity_type: 'match', id: first, source_provider: 'x', external_source_id: '1' }); assert.equal(st, 403);
    [st] = await call('GET', '/api/ids/lookup?id=SH-P-209901-000001'); assert.equal(st, 404);
  } finally { srv.kill(); }
});
