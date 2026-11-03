import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('player card accepts a full permanent ID (SH-P-YYYYMM-NNNNNN, 18 chars) and /api/intro/player 404s an unknown ID', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcs-')), port = 8279, file = path.join(dir, 'd.json'), SECRET = 'x';
  const tok = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'Hemanth', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  try {
    const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 40; i++) { try { await fetch(B + '/api/health'); break; } catch { await new Promise(r => setTimeout(r, 250)); } }
    const put = await fetch(B + '/api/shared/players/p_abc', { method: 'PUT', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok('9000000001') }, body: JSON.stringify({ data: { c: { id: 'p_abc', name: 'Hemanth', shid: 'SH-P-202610-000001', m: 90, r: 377, w: 61, hs: 115, f50: 2, f100: 1 } } }) });
    assert.equal(put.status, 200);
    const got = await (await fetch(B + '/api/shared/players/p_abc')).json(); assert.equal(got.item.data.c.shid, 'SH-P-202610-000001');
    assert.equal((await fetch(B + '/api/intro/player?id=SH-P-202610-000099')).status, 404);
  } finally { srv.kill(); }
});

test('shared player link carries a link-preview title and description (og tags)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pco-')), port = 8280, file = path.join(dir, 'd.json');
  fs.writeFileSync(file, JSON.stringify({ users: {}, shared: { players: { p_og1: { data: { c: { id: 'p_og1', name: 'Hemanth "H" <b>', role: 'AR', team: 'Hapur Titans', m: 90, r: 377, w: 61 } }, updated: 1, owner: 'x' } } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: 'x', TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  try {
    const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 40; i++) { try { await fetch(B + '/api/health'); break; } catch { await new Promise(r => setTimeout(r, 250)); } }
    const h = await (await fetch(B + '/?player=p_og1', { headers: { 'accept-encoding': 'identity' } })).text();
    assert.match(h, /og:title" content="Hemanth &quot;H&quot; &lt;b&gt; · Scoring Heroes"/); assert.match(h, /90 matches · 377 runs · 61 wickets/); assert.match(h, /og:image" content="https:\/\/127\.0\.0\.1:8280\/icon-512\.png"/);
    const g = await (await fetch(B + '/?player=nope123', { headers: { 'accept-encoding': 'identity' } })).text(); assert.ok(!/og:title/.test(g));
  } finally { srv.kill(); }
});
