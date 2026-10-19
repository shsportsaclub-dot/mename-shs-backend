import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('when CricketData lists a match with ball-by-ball off, the app says so instead of a bare provider error', async () => {
  const mk = (id, bbb) => ({ id, name: 'A vs B', matchType: 'odi', status: 'A opt to bat', venue: 'V', date: '2026-10-19', dateTimeGMT: '2026-10-19T06:00:00', teams: ['A', 'B'], teamInfo: [{ name: 'A', shortname: 'A' }, { name: 'B', shortname: 'B' }], score: [{ r: 150, w: 3, o: 33.3, inning: 'a Inning 1' }], bbbEnabled: bbb, fantasyEnabled: true, matchStarted: true, matchEnded: false });
  const mock = http.createServer((q, r) => {
    r.setHeader('content-type', 'application/json');
    if (q.url.includes('currentMatches')) return r.end(JSON.stringify({ status: 'success', data: [mk('m-off', false), mk('m-on', true)], info: { hitsToday: 5, hitsLimit: 9999999 } }));
    if (q.url.includes('/matches')) return r.end(JSON.stringify({ status: 'success', data: [] }));
    r.end(JSON.stringify({ status: 'failure', reason: 'ERR: Not able to get BBB for match' }));
  }).listen(0);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-')), port = 8271;
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: 'x', CRIC_API_KEY: 'k', CRIC_BASE: 'http://localhost:' + mock.address().port, TRACKER: '0' }, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 1500));
    const live = await (await fetch(`http://localhost:${port}/api/live`)).json();
    assert.equal(live.ok, true);
    const off = live.matches.find(m => m.id === 'm-off'), on = live.matches.find(m => m.id === 'm-on');
    assert.equal(off.bbb, false); assert.equal(on.bbb, true); assert.equal(off.fantasy, true);
    const a = await (await fetch(`http://localhost:${port}/api/cric?ep=match_bbb&id=m-off`)).json();
    const msg = JSON.stringify(a);
    assert.match(msg, /bbbEnabled=false/); assert.match(msg, /Not able to get BBB/);
    const b = await (await fetch(`http://localhost:${port}/api/cric?ep=match_bbb&id=m-on`)).json();
    assert.doesNotMatch(JSON.stringify(b), /bbbEnabled=false/);
  } finally { srv.kill(); mock.close(); }
});
