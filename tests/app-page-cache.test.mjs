// The 2.5 MB app page is compressed and revalidated with an ETag, so repeat visits cost a 304 instead of megabytes of Render bandwidth.
import test from 'node:test'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
test('app page: brotli/gzip, ETag, 304', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-')), port = 8291, file = path.join(dir, 'd.json'); fs.writeFileSync(file, JSON.stringify({ users: {}, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: 'x', TRACKER: '0' }, stdio: 'ignore' });
  const get = (h) => new Promise((res, rej) => http.get({ host: '127.0.0.1', port, path: '/', headers: h }, r => { let n = 0; r.on('data', c => n += c.length); r.on('end', () => res({ status: r.statusCode, h: r.headers, n })); }).on('error', rej));
  try {
    await new Promise(r => setTimeout(r, 1800));
    const plain = await get({}); assert.equal(plain.status, 200); assert.ok(plain.n > 1.5e6);
    const br = await get({ 'accept-encoding': 'br, gzip' }); assert.equal(br.h['content-encoding'], 'br'); assert.ok(br.n < plain.n * 0.8, `compressed ${br.n} vs ${plain.n}`);
    const gz = await get({ 'accept-encoding': 'gzip' }); assert.equal(gz.h['content-encoding'], 'gzip');
    assert.equal(br.h['cache-control'], 'no-cache'); assert.ok(br.h.etag);
    const nm = await get({ 'accept-encoding': 'br', 'if-none-match': br.h.etag }); assert.equal(nm.status, 304); assert.equal(nm.n, 0);
  } finally { srv.kill(); }
});
