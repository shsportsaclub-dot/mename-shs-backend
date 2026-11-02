import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('graphics control API: take, poll, clear, validation', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gfx-')), port = 8291;
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: path.join(dir, 'd.json'), ADMIN_SECRET: 'x' }, stdio: 'ignore' });
  const get = (u, o) => new Promise((res, rej) => { const q = http.request({ host: '127.0.0.1', port, path: u, method: o && o.method || 'GET', headers: { 'content-type': 'application/json' } }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res([r.statusCode, JSON.parse(b || '{}')])); }); q.on('error', rej); if (o && o.body) q.write(JSON.stringify(o.body)); q.end(); });
  try {
    for (let i = 0; i < 40; i++) { try { await get('/api/gfx/poll?k=abcdefgh1'); break; } catch { await new Promise(r => setTimeout(r, 250)); } }
    const K = 'abcdefgh12345678';
    assert.equal((await get('/api/gfx/take?k=bad&kind=g3_six'))[0], 403);
    assert.equal((await get('/api/gfx/take?k=' + K + '&kind=Bad-Kind'))[0], 400);
    const first = await get('/api/gfx/poll?k=' + K); assert.equal(first[1].seq, 0);
    const t1 = await get('/api/gfx/take?k=' + K + '&kind=g3_six&title=Rohit%20Sharma&sub=76%20(41)'); assert.equal(t1[0], 200); assert.equal(t1[1].id, 1);
    const t2 = await get('/api/gfx/take', { method: 'POST', body: { k: K, kind: 'lb_runs', data: { head: 'Top', rows: [{ n: 'A', v: '9', sub: 'x' }], photo: 'javascript:alert(1)' } } }); assert.equal(t2[1].id, 2);
    const p = await get('/api/gfx/poll?k=' + K + '&after=0'); assert.equal(p[1].items.length, 2);
    assert.equal(p[1].items[0].data.title, 'Rohit Sharma'); assert.equal(p[1].items[1].data.photo, undefined);
    assert.equal((await get('/api/gfx/poll?k=' + K + '&after=2'))[1].items.length, 0);
    assert.equal((await get('/api/gfx/poll?k=OTHERKEY12345678&after=0'))[1].items.length, 0);
  } finally { srv.kill(); }
});
