import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const pause = ms => new Promise(r => setTimeout(r, ms));
const root = fileURLToPath(new URL('../', import.meta.url));

test('HTTP app loads Neon env, saves a match, and restores it after restart (SQL fixture)', { timeout: 20000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-neon-'));
  const fixture = path.join(dir, 'remote.json');
  const secret = 'isolated-test-secret';
  const phone = 'test-user';
  fs.writeFileSync(fixture, JSON.stringify({ db: JSON.stringify({ users: { [phone]: { name: 'Test', role: 'admin' } }, shared: {} }) }));
  fs.writeFileSync(path.join(dir, '.env.local'), 'DATABASE_URL=postgresql://fixture:fixture@fixture.neon.tech/neondb\n');
  // Lower-precedence .env must not shadow Neon's env or the runtime PORT.
  fs.writeFileSync(path.join(dir, '.env'), 'DATABASE_URL=invalid\nPORT=1\n');
  const env = { ...process.env, PORT: '18983', SESSION_SECRET: secret, DATA_FILE: path.join(dir, 'local.json'), NEON_FIXTURE_FILE: fixture, TRACKER: '0', TRACK_AUTO_MATCHES: '0', PAPER_AGENT: '0', RECENT_OPEN_DATA: '0', HISTORY_AUTOIMPORT: '0', HISTORY_DIR: path.join(dir, 'history'), CRIC_API_KEY: '', SPORTMONKS_TOKEN: '' };
  delete env.DATABASE_URL;
  const base = 'http://127.0.0.1:18983';
  let child, logs = '';
  const stop = async () => { if (child && child.exitCode === null) { child.kill(); await once(child, 'exit'); } };
  const start = async () => {
    child = spawn(process.execPath, ['--import', path.join(root, 'tests/neon-fetch-fixture.mjs'), path.join(root, 'server.js')], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', b => logs += b); child.stderr.on('data', b => logs += b);
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { const r = await fetch(base + '/health'); if (r.ok) return r.json(); } catch {}
      await pause(50);
    }
    throw new Error('App startup timeout: ' + logs);
  };
  try {
    assert.deepEqual((await start()).database, { configured: true, connected: true });
    const page = await fetch(base + '/'); assert.equal(page.status, 200); assert.match(await page.text(), /Scoring Heroes/i);
    const body = Buffer.from(JSON.stringify({ p: phone, e: Date.now() + 60000 })).toString('base64url');
    const token = body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const save = await fetch(base + '/api/shared/matches/neon-test-match', { method: 'PUT', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ data: { score: 42 } }) });
    assert.equal(save.status, 200);
    for (let i = 0; i < 60; i++) { if (JSON.parse(JSON.parse(fs.readFileSync(fixture)).db).shared.matches?.['neon-test-match']) break; await pause(50); }
    assert.equal(JSON.parse(JSON.parse(fs.readFileSync(fixture)).db).shared.matches['neon-test-match'].data.score, 42);
    await stop(); fs.rmSync(path.join(dir, 'local.json'), { force: true });
    assert.equal((await start()).database.connected, true);
    const restored = await (await fetch(base + '/api/shared/matches/neon-test-match')).json();
    assert.equal(restored.item.data.score, 42);
    await stop();
    env.NEON_FIXTURE_FAIL = '1';
    assert.deepEqual((await start()).database, { configured: true, connected: false });
  } finally { await stop(); fs.rmSync(dir, { recursive: true, force: true }); }
});
