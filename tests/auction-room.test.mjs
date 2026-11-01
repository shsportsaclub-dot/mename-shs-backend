import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('auction bid room: team codes, ordered bids, purse and eligibility checks, organiser mirrors pending bids', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-')), port = 8311, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Org', role: 'viewer' }, '9000000002': { nick: 'Other', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { o: sign('9000000001'), x: sign('9000000002') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); let j = {}; try { j = await r.json(); } catch {} return [r.status, j]; };
  try {
    await new Promise(r => setTimeout(r, 1500)); let st, j;
    [st] = await call('GET', '/api/aucroom/au9'); assert.equal(st, 404);            // not published
    [st] = await call('PUT', '/api/shared/auc/au9', T.o, { data: { a: { id: 'au9', name: 'Room', teams: [], players: [] } } }); assert.equal(st, 200);
    [st] = await call('POST', '/api/aucroom/au9/sync', T.x, { teams: [], ladder: [] }); assert.equal(st, 403);   // only the organiser
    const teams = [{ id: 't1', name: 'Lions', short: 'LI', purse: 1000, max: 600 }, { id: 't2', name: 'Tigers', short: 'TI', purse: 1000, max: 150 }, { id: 't3', name: 'Bears', short: 'BE', purse: 1000, max: 900, ok: false, why: 'Quota full' }];
    [st, j] = await call('POST', '/api/aucroom/au9/sync', T.o, { open: true, cur: { id: 'p1', name: 'Rohit', role: 'BAT', base: 100 }, bid: null, bidTeam: null, ladder: [100, 120, 140, 160, 180, 200], teams }); assert.equal(st, 200);
    const codes = j.codes; assert.ok(codes.t1 && codes.t2 && codes.t1 !== codes.t2);
    [st, j] = await call('GET', '/api/aucroom/au9'); assert.equal(j.room.next, 100); assert.ok(!JSON.stringify(j).includes(codes.t1), 'codes never public');
    [st] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't1', code: 'WRONG1' }); assert.equal(st, 403);
    [st, j] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't1', code: codes.t1 }); assert.equal(st, 200); assert.equal(j.room.bid, 100); assert.equal(j.room.bidTeam, 't1'); assert.equal(j.room.next, 120);
    [st] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't1', code: codes.t1 }); assert.equal(st, 409);   // already leading
    [st] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't3', code: codes.t3 || 'x' }); assert.ok([403, 409].includes(st));
    [st, j] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't2', code: codes.t2, ver: 0 }); assert.equal(st, 409);   // stale screen
    [st, j] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't2', code: codes.t2 }); assert.equal(st, 200); assert.equal(j.room.bid, 120);
    [st, j] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't1', code: codes.t1 }); assert.equal(j.room.bid, 140);
    [st, j] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't2', code: codes.t2 }); assert.equal(st, 409); assert.match(j.error, /purse/);   // 160 is above Tigers' limit of 150
    const ver = j.room.ver;
    [st, j] = await call('POST', '/api/aucroom/au9/sync', T.o, { open: true, ver: ver - 1, cur: { id: 'p1', name: 'Rohit', role: 'BAT', base: 100 }, bid: 100, bidTeam: 't1', ladder: [120], teams }); assert.equal(st, 409);   // organiser has not seen the owner bids yet
    assert.equal(j.pending.length, 3); assert.deepEqual(j.pending.map(x => x.amt), [100, 120, 140]);
    [st, j] = await call('POST', '/api/aucroom/au9/pending', T.o, {}); assert.equal(j.pending.length, 0); assert.equal(j.ver, ver);
    [st, j] = await call('POST', '/api/aucroom/au9/sync', T.o, { open: false, ver, cur: null, bid: null, bidTeam: null, ladder: [], teams }); assert.equal(st, 200);   // next player not yet on the block
    [st, j] = await call('POST', '/api/aucroom/au9/bid', null, { team: 't1', code: codes.t1 }); assert.equal(st, 409);
  } catch (e) { throw e; } finally { srv.kill(); }
});
