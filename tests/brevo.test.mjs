import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('email OTP goes out through the Brevo HTTPS API with the verified sender', async () => {
  const seen = [];
  const mock = http.createServer((q, r) => { let b = ''; q.on('data', c => b += c); q.on('end', () => { seen.push({ url: q.url, key: q.headers['api-key'], body: JSON.parse(b) }); r.writeHead(201, { 'content-type': 'application/json' }); r.end('{"messageId":"x"}'); }); }).listen(0);
  const port = mock.address().port, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-'));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: '8231', DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: 'x', PAPER_AGENT: '0', RECENT_OPEN_DATA: '0', HISTORY_DIR: dir, EMAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'k-123', BREVO_BASE: 'http://localhost:' + port, EMAIL_FROM: 'SH Sports <sender@example.com>' }, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 1500));
    const r = await fetch('http://localhost:8231/api/email/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'fan@example.com' }) });
    const j = await r.json();
    assert.equal(j.ok, true); assert.equal(j.devCode, undefined);          // a real provider never returns the code
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, '/v3/smtp/email'); assert.equal(seen[0].key, 'k-123');
    assert.deepEqual(seen[0].body.sender, { name: 'SH Sports', email: 'sender@example.com' });
    assert.equal(seen[0].body.to[0].email, 'fan@example.com');
    assert.match(seen[0].body.htmlContent, /\b\d{6}\b/);
  } finally { srv.kill(); mock.close(); }
});
