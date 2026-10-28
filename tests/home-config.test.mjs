// Home extras: admin-only config for banners, social links and pinned posts; public read; validation.
import test from 'node:test'; import assert from 'node:assert/strict'; import crypto from 'node:crypto'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('home config: public read, admin-only write, validation', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hc-')), port = 8281, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Boss', role: 'admin' }, '+912': { nick: 'V', role: 'viewer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const call = (m, p, tk, body) => fetch('http://127.0.0.1:' + port + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }).then(async a => [a.status, await a.json()]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    let [s, j] = await call('GET', '/api/home-config'); assert.equal(s, 200); assert.deepEqual(j.ads, []); assert.equal(j.youtube, false);
    [s] = await call('POST', '/api/admin/home-config', null, { act: 'links' }); assert.equal(s, 401);
    [s] = await call('POST', '/api/admin/home-config', sign('+912'), { act: 'links' }); assert.equal(s, 403);
    const A = sign('+911'), px = 'data:image/png;base64,iVBORw0KGgo=';
    [s, j] = await call('POST', '/api/admin/home-config', A, { act: 'addAd', img: px, link: 'https://example.com/x', title: 'Spons' }); assert.equal(s, 200); assert.equal(j.ads.length, 1);
    [s] = await call('POST', '/api/admin/home-config', A, { act: 'addAd', img: 'http://bad', link: '' }); assert.equal(s, 400);
    const id = j.ads[0].id; [s, j] = await call('POST', '/api/admin/home-config', A, { act: 'rmAd', id }); assert.equal(j.ads.length, 0);
    [s, j] = await call('POST', '/api/admin/home-config', A, { act: 'links', youtube: 'https://youtube.com/@x', instagram: 'javascript:alert(1)' }); assert.deepEqual(Object.keys(j.links), ['youtube']);
    [s] = await call('POST', '/api/admin/home-config', A, { act: 'addPin', title: 'Post', link: 'ftp://x' }); assert.equal(s, 400);
    [s, j] = await call('POST', '/api/admin/home-config', A, { act: 'addPin', title: 'Post', link: 'https://instagram.com/p/abc' }); assert.equal(j.pins.length, 1);
    [s, j] = await call('POST', '/api/admin/home-config', A, { act: 'yt', yt: 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv' }); assert.equal(j.youtube, true);
    [s] = await call('POST', '/api/admin/home-config', A, { act: 'yt', yt: 'not a channel' }); assert.equal(s, 400);
    [s, j] = await call('GET', '/api/home-config'); assert.equal(j.pins.length, 1); assert.equal(j.youtube, true);
  } finally { srv.kill(); }
});
