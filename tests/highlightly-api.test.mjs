import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
let calls = 0;
const mock = http.createServer((req, res) => { calls++; res.setHeader('content-type', 'application/json'); if (req.headers['x-rapidapi-key'] !== 'hlkey12345678901234') { res.statusCode = 401; return res.end(JSON.stringify({ message: 'bad key' })); }
  res.end(JSON.stringify({ data: [{ id: 9, league: 'NBA', date: '2026-10-28T01:00:00.000Z', homeTeam: { id: 1, displayName: 'Denver Nuggets', abbreviation: 'DEN' }, awayTeam: { id: 2, displayName: 'Lakers', abbreviation: 'LAL' }, state: { description: 'In progress', score: { homeTeam: [20, 22], awayTeam: [18] } } }] })); });
await new Promise(r => mock.listen(0, r));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-')), PORT = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT), DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: 'x'.repeat(32), TRACKER: '0', HIGHLIGHTLY_KEY: 'hlkey12345678901234', HIGHLIGHTLY_BASE: 'http://127.0.0.1:' + mock.address().port, HIGHLIGHTLY_DAILY_BUDGET: '2' }, stdio: 'ignore' });
const get = async p => { for (let i = 0; i < 40; i++) { try { const r = await fetch('http://127.0.0.1:' + PORT + p); return [r.status, await r.json()]; } catch { await new Promise(r => setTimeout(r, 250)); } } throw new Error('no server'); };
test('list is normalised, cached, budgeted; bad sport refused', async () => {
  let [s, j] = await get('/api/sx/live?sport=basketball'); assert.equal(s, 200); assert.equal(j.ok, true); assert.equal(j.matches[0].home.score, 42); assert.equal(j.matches[0].live, true);
  const n = calls; [s, j] = await get('/api/sx/live?sport=basketball'); assert.equal(calls, n, 'second request served from cache');
  [s] = await get('/api/sx/live?sport=cricket'); assert.equal(s, 400);
  await get('/api/sx/live?sport=hockey'); [s, j] = await get('/api/sx/live?sport=volleyball'); assert.equal(j.ok, false); assert.match(j.error, /daily limit/);
});
test.after(() => { srv.kill(); mock.close(); });
