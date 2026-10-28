import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('player photos from provider hosts are downloaded once, kept, and served; other hosts refused', async () => {
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(900, 7)]);
  let hits = 0;
  const up = http.createServer((q, r) => { hits++; if (q.url.includes('missing')) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': 'image/png' }); r.end(png); });
  await new Promise(r => up.listen(8281, '127.0.0.1', r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-')), port = 8282, file = path.join(dir, 'd.json');
  fs.writeFileSync(file, JSON.stringify({ users: {}, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: 'x', TRACKER: '0', FACE_HOSTS: '^127\\.0\\.0\\.1$' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, get = u => fetch(B + '/api/face?u=' + encodeURIComponent(u));
  try {
    await new Promise(r => setTimeout(r, 1500));
    let r = await get('http://127.0.0.1:8281/img/players/1.png'); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/png'); assert.equal((await r.arrayBuffer()).byteLength, png.length);
    r = await get('http://127.0.0.1:8281/img/players/1.png'); assert.equal(r.status, 200); assert.equal(hits, 1, 'second request served from disk');
    assert.ok(fs.readdirSync(path.join(dir, 'faces')).length >= 2, 'kept on disk');
    r = await get('http://127.0.0.1:8281/missing.png'); assert.equal(r.status, 404);
    r = await get('http://127.0.0.1:8281/img/placeholder.png'); assert.equal(r.status, 404, 'placeholders refused');
    r = await get('https://example.com/a.png'); assert.equal(r.status, 404, 'non provider host refused');
    r = await get('not a url'); assert.equal(r.status, 400);
  } finally { srv.kill(); up.close(); }
});
