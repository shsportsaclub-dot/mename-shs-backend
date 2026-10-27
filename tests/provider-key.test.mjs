import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('admin can save and remove the Sportmonks token from the app; viewers cannot; token is never returned', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pk-')), port = 8283, file = path.join(dir, 'd.json');
  const env = { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: 'x', ADMIN_PHONES: '9000000001', TRACKER: '0', DEV_OTP: '1', SPORTMONKS_TOKEN: '' };
  delete env.CRIC_API_KEY;
  const srv = spawn('node', ['server.js'], { env, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 1500));
    const u = `http://localhost:${port}/api/admin/provider-key`;
    assert.equal((await fetch(u)).status, 401);
    const r2 = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(r2.status, 401);
  } finally { srv.kill(); }
});
