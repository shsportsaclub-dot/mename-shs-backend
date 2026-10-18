import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('admin probe shows what the CricketData key really returns (plan hits, ball by ball reply)', async () => {
  const mock = http.createServer((q, r) => {
    const info = { hitsToday: 12, hitsLimit: 2000 };
    r.setHeader('content-type', 'application/json');
    if (q.url.includes('currentMatches') || q.url.includes('/matches')) return r.end(JSON.stringify({ status: 'success', info, data: [{ id: 'live1', name: 'PAK v SL', matchType: 'odi', status: 'Live', matchStarted: true, matchEnded: false, teams: ['Pakistan', 'Sri Lanka'], score: [] }] }));
    if (q.url.includes('match_bbb')) return r.end(JSON.stringify({ status: 'success', info, data: { bbb: [{ n: 1, over: 0, ball: 1, runs: 4 }] } }));
    r.end(JSON.stringify({ status: 'failure', reason: 'Not on your plan', info }));
  }).listen(0);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-')), port = 8242, secret = 'sec';
  fs.writeFileSync(path.join(dir, 'd.json'), JSON.stringify({ users: { p1: { phone: 'p1', role: 'admin' } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: secret, CRIC_API_KEY: 'k', CRIC_BASE: 'http://localhost:' + mock.address().port, TRACKER: '0', RECENT_OPEN_DATA: '0', HISTORY_DIR: dir }, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 2500));
    const body = Buffer.from(JSON.stringify({ p: 'p1', e: Date.now() + 1e9 })).toString('base64url'), tok = body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const r = await (await fetch(`http://localhost:${port}/api/admin/probe`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: '{}' })).json();
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.match(r.fixture, /match_bbb: status=success/);
    assert.match(r.fixture, /hits today: 12 of 2000/);
    assert.match(r.fixture, /match_scorecard: status=failure · reason: Not on your plan/);
    assert.match(r.fixture, /rows: 1/);
    assert.ok(!r.fixture.includes('apikey') && !JSON.stringify(r).includes('"k"'));
  } finally { srv.kill(); mock.close(); }
});
