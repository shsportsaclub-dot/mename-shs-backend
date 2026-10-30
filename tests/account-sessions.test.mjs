import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('sign out of all devices and account closure/reopen', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-')), port = 8274, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = (ph, i) => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, ...(i ? { i } : {}) })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  const salt = 'abcd', ph = crypto.scryptSync('1234', salt, 32).toString('hex');
  fs.writeFileSync(file, JSON.stringify({ users: { 'e:me@x.com': { nick: 'Me', role: 'viewer', salt, ph, phone: 'e:me@x.com' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`;
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    const phoneTok = sign('e:me@x.com'), other = sign('e:me@x.com');
    let st, j;
    [st, j] = await call('POST', '/api/me/signout-all', null); assert.equal(st, 401);
    [st, j] = await call('POST', '/api/me/signout-all', phoneTok); assert.equal(st, 200); const fresh = j.token; await new Promise(r => setTimeout(r, 5));
    await new Promise(r => setTimeout(r, 5));
    [st] = await call('POST', '/api/grounds', other, { name: 'Abc Ground', lat: 1, lng: 1 }); assert.equal(st, 401);      // old device signed out
    [st, j] = await call('POST', '/api/me/signout-all', fresh); assert.equal(st, 200); const cur = j.token;                // current device stays signed in
    [st, j] = await call('POST', '/api/me/close', cur, { confirm: 'no' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/me/close', cur, { confirm: 'CLOSE', pin: '9999' }); assert.equal(j.ok, false);
    [st, j] = await call('POST', '/api/me/close', cur, { confirm: 'CLOSE', pin: '1234' }); assert.equal(j.ok, true);
    [st] = await call('POST', '/api/me/signout-all', cur); assert.equal(st, 401);                                      // closed: token refused
    [st, j] = await call('POST', '/api/auth/login', null, { phone: 'me@x.com', pin: '1234' }); assert.equal(j.ok, true);     // signing in again reopens
    [st] = await call('POST', '/api/me/signout-all', j.token); assert.equal(st, 200);
  } finally { srv.kill(); }
});
