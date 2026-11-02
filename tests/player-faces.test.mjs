import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('player face photos: only an admin can add, anyone can read for the names they ask', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-')), port = 8272, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Admin', role: 'admin' }, '+912': { nick: 'Fan', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const B = `http://127.0.0.1:${port}`, call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  const img = 'data:image/jpeg;base64,' + Buffer.from('jpegbytes').toString('base64');
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/faces', sign('+912'), { name: 'Mominul Haque', img }); assert.equal(st, 403);
    [st] = await call('POST', '/api/faces', null, { name: 'Mominul Haque', img }); assert.equal(st, 403);
    [st] = await call('POST', '/api/faces', sign('+911'), { name: 'Mominul Haque', img: 'data:text/html;base64,AAAA' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/faces', sign('+911'), { name: 'Mominul Haque', img }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/faces?names=' + encodeURIComponent('Mominul Haque|Nobody Here')); assert.equal(st, 200); assert.equal(j.faces['mominul haque'], img); assert.equal(Object.keys(j.faces).length, 1);
    [st] = await call('POST', '/api/faces/delete', sign('+912'), { name: 'Mominul Haque' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/faces/delete', sign('+911'), { name: 'Mominul Haque' }); assert.equal(st, 200);
    [st, j] = await call('GET', '/api/faces?names=Mominul%20Haque'); assert.equal(Object.keys(j.faces).length, 0);
  } finally { srv.kill(); }
});
