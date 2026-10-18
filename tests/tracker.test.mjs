import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const bat = (name, r, b, t = 'batting') => ({ batsman: { name }, r, b, '4s': 0, '6s': 0, 'dismissal-text': t });
const bow = (name, o, r, w, nb = 0, wd = 0) => ({ bowler: { name }, o, m: 0, r, w, nb, wd });
const card = (R, W, O, batting, bowling) => ({ id: 'live1', matchStarted: true, matchEnded: false, score: [], scorecard: [{ inning: 'Pakistan Inning 1', totals: { R, W, O }, batting, bowling }] });
const STEPS = [
  card(166, 4, '30.5', [bat('Hasan', 19, 31), bat('Salman', 30, 32)], [bow('Fernando', '5.5', 31, 0)]),
  card(170, 4, '31', [bat('Hasan', 23, 32), bat('Salman', 30, 32)], [bow('Fernando', '6', 35, 0)]),          // one ball: 4 runs
  card(170, 5, '31.1', [bat('Hasan', 23, 32), bat('Salman', 30, 33, 'c Mendis b Madushanka'), bat('Shadab', 0, 0)], [bow('Fernando', '6', 35, 0), bow('Madushanka', '0.1', 0, 1)]),   // one ball: wicket
];

test('server tracker saves ball records for single-ball changes and serves them as match_bbb', async () => {
  let call = 0;
  const mock = http.createServer((q, r) => {
    const j = x => { r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ status: 'success', data: x })); };
    if (q.url.includes('match_scorecard')) return j(STEPS[Math.min(call++, STEPS.length - 1)]);
    if (q.url.includes('match_info')) return j({ id: 'live1', matchStarted: true, matchEnded: false, teams: ['Pakistan', 'Sri Lanka'], score: [] });
    r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ status: 'failure', reason: 'no bbb on this plan' }));
  }).listen(0);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-')), port = 8241;
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: 'x', CRIC_API_KEY: 'k', CRIC_BASE: 'http://localhost:' + mock.address().port, PAPER_AGENT: '0', RECENT_OPEN_DATA: '0', HISTORY_DIR: dir, TRACK_SECONDS: '1', TRACK_MIN_SECONDS: '1', TRACK_DAILY_CALLS: '50' }, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 1500));
    await fetch(`http://localhost:${port}/api/cric?ep=match_info&id=live1`);          // someone opens the match: tracking starts
    let rows = [];
    for (let i = 0; i < 30 && rows.length < 2; i++) {
      await new Promise(r => setTimeout(r, 700));
      const j = await (await fetch(`http://localhost:${port}/api/cric?ep=match_bbb&id=live1&t=${i}`)).json();
      if (j.ok) rows = j.data.bbb || [];
      if (j.ok) assert.equal(j.data.source, 'Scoring Heroes live tracker');
    }
    assert.equal(rows.length, 2, 'two single-ball changes recorded');
    assert.deepEqual([rows[0].batsman, rows[0].bowler, rows[0].runs, rows[0].over, rows[0].ball], ['Hasan', 'Fernando', 4, 30, 6]);
    assert.deepEqual([rows[1].wicket, rows[1].out, rows[1].kind, rows[1].fielder, rows[1].bowler], [true, 'Salman', 'caught', 'Mendis', 'Madushanka']);
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'd.json'), 'utf8'));
    assert.equal(saved.track.live1.rows.length, 2);               // survives a restart
  } finally { srv.kill(); mock.close(); }
});
