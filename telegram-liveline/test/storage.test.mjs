// Owner, users and followers must survive a restart (Render free wipes the disk) via Neon.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { startBot } from '../bot.mjs';
const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(s.address().port)));
const wait = ms => new Promise(r => setTimeout(r, ms));

test('state is saved to Neon and restored by a fresh instance with an empty disk', async () => {
  const kv = new Map(), seen = [];
  const neon = http.createServer((q, r) => { let b = ''; q.on('data', c => b += c); q.on('end', () => {
    seen.push(q.headers['neon-connection-string']);
    const { query, params } = JSON.parse(b);
    r.setHeader('content-type', 'application/json');
    if (/^CREATE TABLE/.test(query)) return r.end(JSON.stringify({ command: 'CREATE', rows: [] }));
    if (/^SELECT v FROM tg_liveline_state/.test(query)) return r.end(JSON.stringify({ command: 'SELECT', rows: kv.has(params[0]) ? [{ v: kv.get(params[0]) }] : [] }));
    if (/^INSERT INTO tg_liveline_state/.test(query)) { kv.set(params[0], params[1]); return r.end(JSON.stringify({ command: 'INSERT', rows: [] })); }
    r.statusCode = 400; r.end(JSON.stringify({ message: 'bad query' }));
  }); });
  const tg = http.createServer((q, r) => { q.resume(); q.on('end', () => r.end(JSON.stringify({ ok: true, result: { message_id: 1 } }))); });
  const cd = http.createServer((q, r) => r.end(JSON.stringify({ status: 'success', data: [] })));
  const np = await listen(neon), tp = await listen(tg), cp = await listen(cd);
  const env = dir => ({ TELEGRAM_BOT_TOKEN: 'T', CRIC_API_KEY: 'K', TG_BASE: `http://127.0.0.1:${tp}`, CRIC_BASE: `http://127.0.0.1:${cp}`, PORT: String(19500 + (Math.random() * 400 | 0)), POLL_MS: '600000', DATA_FILE: path.join(dir, 'b.json'), DATABASE_URL: 'postgresql://u:p@ep-x-pooler.example.neon.tech/db?sslmode=require', NEON_HTTP_BASE: `http://127.0.0.1:${np}/sql` });
  try {
    const a = startBot(env(fs.mkdtempSync(path.join(os.tmpdir(), 'sa-'))));
    await a.boot();
    await a.onUpdate({ message: { chat: { id: 42 }, from: { language_code: 'te' }, text: '/claim' } });
    a.db.data.subs['42|m9'] = { chat: 42, match: 'm9', cardId: 7 }; a.db.save();
    await wait(1800); a.close(); await wait(300);
    assert.ok(kv.has('state'), 'state saved to Neon');
    assert.ok(seen.every(h => /^postgresql:\/\//.test(h)), 'connection string sent in the Neon header');
    const b = startBot(env(fs.mkdtempSync(path.join(os.tmpdir(), 'sb-'))));     // new disk, like a Render redeploy
    await b.boot();
    try {
      assert.equal(b.db.info.loaded, true);
      assert.equal(String(b.db.data.owner), '42', 'owner survives');
      assert.equal(b.db.data.subs['42|m9']?.match, 'm9', 'followers survive');
      assert.equal(b.db.data.users['42']?.lang, 'te', 'language survives');
    } finally { b.close(); }
  } finally { neon.close(); tg.close(); cd.close(); }
});

test('Neon down: bot still starts and works from the local file', async () => {
  const tg = http.createServer((q, r) => { q.resume(); q.on('end', () => r.end(JSON.stringify({ ok: true, result: { message_id: 1 } }))); });
  const tp = await listen(tg);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-'));
  const bot = startBot({ TELEGRAM_BOT_TOKEN: 'T', CRIC_API_KEY: 'K', TG_BASE: `http://127.0.0.1:${tp}`, CRIC_BASE: 'http://127.0.0.1:9', PORT: String(19950 + (Math.random() * 40 | 0)), POLL_MS: '600000', DATA_FILE: path.join(dir, 'b.json'), DATABASE_URL: 'postgresql://u:p@h.neon.tech/db', NEON_HTTP_BASE: 'http://127.0.0.1:9/sql' });
  await bot.boot();
  try {
    assert.equal(bot.db.info.loaded, false); assert.ok(bot.db.info.lastError);
    await bot.onUpdate({ message: { chat: { id: 5 }, text: '/claim' } });
    assert.equal(String(bot.db.data.owner), '5');
  } finally { bot.close(); tg.close(); }
});
