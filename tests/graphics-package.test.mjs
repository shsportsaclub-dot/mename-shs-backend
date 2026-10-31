import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
test('graphics package manifest is public and versioned', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-')), port = 8276, file = path.join(dir, 'd.json');
  fs.writeFileSync(file, JSON.stringify({ users: {}, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: 'x', TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  try {
    await new Promise(r => setTimeout(r, 1500));
    const j = await (await fetch(`http://127.0.0.1:${port}/api/graphics/package`)).json();
    assert.equal(j.ok, true); assert.equal(j.package.schema, 'sh.graphic/1'); assert.match(j.package.version, /^\d+\.\d+\.\d+$/);
    assert.equal(j.package.templates.length, 14); assert.equal(j.package.effects.length, 5); assert.equal(j.package.output.width, 1920);
    assert.equal(j.package.changelog[0].v, j.package.version);
  } finally { srv.kill(); }
});
