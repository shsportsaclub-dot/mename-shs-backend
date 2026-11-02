import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('avatars: admin-only save/generate via GPU worker, anyone reads by name', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-')), port = 8273, file = path.join(dir, 'd.json'), SECRET = 'x';
  const png = 'data:image/png;base64,' + Buffer.from('pngbytes').toString('base64'), jpg = 'data:image/jpeg;base64,' + Buffer.from('jpgbytes').toString('base64');
  const gpu = http.createServer((q, s) => { let b = ''; q.on('data', c => b += c); q.on('end', () => { s.setHeader('content-type', 'application/json'); if (q.headers.authorization !== 'Bearer k1') { s.statusCode = 401; return s.end('{}'); } s.end(JSON.stringify({ ok: true, img: png })); }); });
  await new Promise(r => gpu.listen(8274, r));
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Admin', role: 'admin' }, '+912': { nick: 'Fan', role: 'viewer' } }, shared: {} }));
  const env = { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' };
  const B = `http://127.0.0.1:${port}`, call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  let srv = spawn('node', ['server.js'], { env, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/avatars/save', sign('+912'), { name: 'Mominul Haque', img: png }); assert.equal(st, 403);
    [st] = await call('POST', '/api/avatars/save', sign('+911'), { name: 'Mominul Haque', img: 'data:text/html;base64,AAAA' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/avatars/save', sign('+911'), { name: 'Mominul Haque', img: png }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/avatars?names=' + encodeURIComponent('Mominul Haque|Nobody')); assert.equal(j.avatars['mominul haque'], png); assert.equal(Object.keys(j.avatars).length, 1);
    [st] = await call('POST', '/api/avatars/generate', sign('+911'), { name: 'Shamar Joseph', photo: jpg }); assert.equal(st, 503);
    srv.kill(); await new Promise(r => setTimeout(r, 400));
    srv = spawn('node', ['server.js'], { env: { ...env, AVATAR_GPU_URL: 'http://127.0.0.1:8274', AVATAR_GPU_KEY: 'k1' }, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1500));
    [st] = await call('POST', '/api/avatars/generate', sign('+912'), { name: 'Shamar Joseph', photo: jpg }); assert.equal(st, 403);
    [st] = await call('POST', '/api/avatars/generate', sign('+911'), { name: 'Shamar Joseph', photo: 'x' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/avatars/generate', sign('+911'), { name: 'Shamar Joseph', photo: jpg, colour: '#2563eb', team: 'West Indies' }); assert.equal(st, 200); assert.equal(j.img, png);
    [st, j] = await call('GET', '/api/avatars?names=Shamar%20Joseph'); assert.equal(j.avatars['shamar joseph'], png);
    [st] = await call('POST', '/api/avatars/delete', sign('+911'), { name: 'Shamar Joseph' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/avatars?names=Shamar%20Joseph'); assert.equal(Object.keys(j.avatars).length, 0);
  } finally { srv.kill(); gpu.close(); }
});
