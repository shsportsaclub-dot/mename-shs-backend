import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('9897520402 is an admin (existing account promoted, others stay viewers)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-')), port = 8311, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9, i: Date.now() })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '9000000001': { nick: 'A', role: 'admin' }, '9897520402': { nick: 'Boss', role: 'viewer' }, '9000000002': { nick: 'V', role: 'viewer' } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: 'ignore' });
  const get = async ph => (await fetch(`http://127.0.0.1:${port}/api/admin/scorers`, { headers: { authorization: 'Bearer ' + sign(ph) } })).status;
  try { await new Promise(r => setTimeout(r, 1500)); assert.equal(await get('9897520402'), 200); assert.equal(await get('9000000002'), 403); }
  finally { srv.kill(); }
});
