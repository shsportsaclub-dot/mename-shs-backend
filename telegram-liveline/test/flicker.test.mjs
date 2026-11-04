// CricketData sometimes returns an older copy of the score. The bot must not jump back and re-alert.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { startBot } from '../bot.mjs';
const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(s.address().port)));

test('a single stale (backwards) provider reading is ignored; a repeated one is accepted', async () => {
  const calls = [];
  const tg = http.createServer((q, r) => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => { const m = q.url.split('/').pop(); const t = Buffer.concat(c).toString(); calls.push({ m, t }); r.end(JSON.stringify({ ok: true, result: { message_id: calls.length, animation: { file_id: 'F' } } })); }); });
  let cur = ['223', 8, '49.4'];
  const mk = () => ({ id: 'u', name: 'UAE vs Oman', matchType: 'odi', matchStarted: true, matchEnded: false, score: [{ inning: 'UAE Inning 1', r: +cur[0], w: cur[1], o: cur[2] }], scorecard: [] });
  const cd = http.createServer((q, r) => r.end(JSON.stringify({ status: 'success', data: q.url.includes('current') ? [mk()] : mk() })));
  const tp = await listen(tg), cp = await listen(cd);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-'));
  const bot = startBot({ TELEGRAM_BOT_TOKEN: 'T', CRIC_API_KEY: 'K', TG_BASE: `http://127.0.0.1:${tp}`, CRIC_BASE: `http://127.0.0.1:${cp}`, PORT: String(19000 + (Math.random() * 500 | 0)), POLL_MS: '600000', DATA_FILE: path.join(dir, 'b.json'), ANIMATIONS: '0' });
  await bot.boot();
  try {
    bot.db.data.subs['1|u'] = { chat: 1, match: 'u', cardId: null };
    await bot.tick();                          // 223/8 (49.4) remembered
    cur = ['229', 8, '50']; await bot.tick();  // +6 to 50.0  (2 balls)
    const alertsAfterForward = calls.filter(c => c.m === 'sendMessage').length;
    cur = ['223', 8, '49.4']; await bot.tick(); // stale copy -> ignored
    cur = ['229', 8, '50']; await bot.tick();   // back to the real score -> no change, no duplicate alert
    assert.equal(calls.filter(c => c.m === 'sendMessage').length, alertsAfterForward, 'no duplicate alerts from flicker');
    assert.equal(bot.stats.flicker, 1);
    cur = ['227', 8, '50']; await bot.tick(); cur = ['227', 8, '50']; await bot.tick();   // a real correction (repeated) is accepted
    await new Promise(r => setTimeout(r, 1300));
    const lastCard = calls.filter(c => /editMessageText|sendMessage/.test(c.m)).map(c => c.t).filter(t => /UAE/.test(t)).at(-1);
    assert.match(lastCard, /227\/8/);
  } finally { bot.close(); tg.close(); cd.close(); }
});
