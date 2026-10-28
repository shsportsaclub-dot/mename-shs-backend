// CricketData + Sportmonks together: CricketData lists every match, Sportmonks supplies ball by ball for the matches it has.
import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hy-')), today = new Date().toISOString().slice(0, 10);
const json = (res, o) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
const cd = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'), ep = u.pathname.split('/').pop();
  const m = (id, a, b, bbb) => ({ id, name: a + ' vs ' + b, matchType: 'odi', status: 'Live', venue: 'V', date: today, dateTimeGMT: today + 'T04:00:00', matchStarted: true, matchEnded: false, teamInfo: [{ name: a, shortname: a.slice(0, 3) }, { name: b, shortname: b.slice(0, 3) }], score: [], bbbEnabled: bbb });
  if (ep === 'currentMatches') return json(res, { status: 'success', data: [m('cd-1', 'India Women', 'Zimbabwe Women', false), m('cd-2', 'Nepal', 'Oman', false)], info: { hitsToday: 1, hitsLimit: 9999999 } });
  if (ep === 'matches') return json(res, { status: 'success', data: [] });
  json(res, { status: 'failure', reason: 'ERR: Not able to get BBB for match' }); });
const sm = http.createServer((req, res) => { const u = new URL(req.url, 'http://x');
  const f = { id: 77, status: 'LIVE', type: 'ODI', starting_at: today + ' 04:00:00', localteam: { data: { id: 1, name: 'India Women', code: 'IND' } }, visitorteam: { data: { id: 2, name: 'Zimbabwe Women', code: 'ZIM' } }, runs: [], balls: [{ id: 1, team_id: 2, scoreboard: 'S1', ball: 8.2, over: 8, score: { runs: 1 }, batsman: { data: { fullname: 'Bat A' } }, bowler: { data: { fullname: 'Bowl B' } } }, { id: 2, team_id: 2, scoreboard: 'S1', ball: 8.3, over: 8, score: { runs: 4 }, batsman: { data: { fullname: 'Bat A' } }, bowler: { data: { fullname: 'Bowl B' } } }] };
  json(res, { data: /fixtures\/77/.test(u.pathname) ? f : [f] }); });
await new Promise(r => cd.listen(0, r)); await new Promise(r => sm.listen(0, r));
const PORT = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT), DATA_FILE: path.join(dir, 'd.json'), LIVE_FILE: path.join(dir, 'live.json'), SESSION_SECRET: 'x'.repeat(32), TRACKER: '0', CRIC_API_KEY: 'k', CRIC_BASE: 'http://127.0.0.1:' + cd.address().port, SPORTMONKS_TOKEN: 't', SPORTMONKS_BASE: 'http://127.0.0.1:' + sm.address().port }, stdio: 'ignore' });
const get = async p => { for (let i = 0; i < 40; i++) { try { const r = await fetch('http://127.0.0.1:' + PORT + p); return [r.status, await r.json()]; } catch { await new Promise(r => setTimeout(r, 250)); } } throw new Error('no server'); };
test('matches stay from CricketData; the one Sportmonks has is marked ball-by-ball and served from Sportmonks', async () => {
  const [, j] = await get('/api/live'); assert.equal(j.ok, true);
  const a = j.matches.find(m => m.id === 'cd-1'), b = j.matches.find(m => m.id === 'cd-2');
  assert.ok(a && b, 'both CricketData matches are listed'); assert.equal(a.bbb, true); assert.equal(a.bbbSrc, 'sportmonks'); assert.notEqual(b.bbb, true);
  const [s, bb] = await get('/api/cric?ep=match_bbb&id=cd-1'); assert.equal(s, 200); assert.equal(bb.data.source, 'Sportmonks'); assert.equal(bb.data.bbb.length, 2); assert.equal(bb.data.bbb[1].bruns ?? bb.data.bbb[1].runs, 4);
  const [s2, nb] = await get('/api/cric?ep=match_bbb&id=cd-2'); assert.notEqual(nb?.data?.source, 'Sportmonks');
});
test.after(() => { srv.kill(); cd.close(); sm.close(); });
