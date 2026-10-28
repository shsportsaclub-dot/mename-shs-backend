// Football routes: not connected message, token handling in the admin box, and the live endpoint through a mock provider.
import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-'));
const mock = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); res.setHeader('content-type', 'application/json');
  if (u.searchParams.get('api_token') !== 'footballtoken1234567890') { res.statusCode = 401; return res.end(JSON.stringify({ message: 'Unauthenticated' })); }
  const f = { id: 5, name: 'A vs B', starting_at: '2026-10-28 10:00:00', state_id: 2, state: { short_name: '1H' }, participants: [{ id: 1, name: 'A', meta: { location: 'home' } }, { id: 2, name: 'B', meta: { location: 'away' } }], scores: [{ description: 'CURRENT', score: { goals: 1, participant: 'home' }, participant_id: 1 }], periods: [{ ticking: true, minutes: 23 }] };
  res.end(JSON.stringify({ data: u.pathname.endsWith('/inplay') ? [f] : u.pathname.includes('/fixtures/date') ? [] : f })); });
await new Promise(r => mock.listen(0, r)); const mp = mock.address().port;
const PORT = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT), DATA_FILE: path.join(dir, 'd.json'), FOOTBALL_TOKEN: 'footballtoken1234567890', FOOTBALL_BASE: 'http://127.0.0.1:' + mp, SESSION_SECRET: 'x'.repeat(32), TRACKER: '0', RECENT_OPEN_DATA: '0' }, stdio: 'ignore' });
const get = async p => { for (let i = 0; i < 40; i++) { try { const r = await fetch('http://127.0.0.1:' + PORT + p); return [r.status, await r.json()]; } catch { await new Promise(r => setTimeout(r, 250)); } } throw new Error('server did not start'); };
test('live list and match detail come from the football provider', async () => {
  const [s, j] = await get('/api/fb/live'); assert.equal(s, 200); assert.equal(j.ok, true); assert.equal(j.matches.length, 1); assert.equal(j.matches[0].home.goals, 1); assert.equal(j.matches[0].minute, 23);
  const [s2, m] = await get('/api/fb/match?id=fb5'); assert.equal(s2, 200); assert.equal(m.match.id, 'fb5');
  const [s3] = await get('/api/fb/match?id=abc'); assert.equal(s3, 400);
});
test.after(() => { srv.kill(); mock.close(); });
