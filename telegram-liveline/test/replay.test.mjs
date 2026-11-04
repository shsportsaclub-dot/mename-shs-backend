// CricketData batches balls (seen live: 4 balls in one update). The bot must replay them one by one.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { startBot } from '../bot.mjs';
const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(s.address().port)));
const wait = ms => new Promise(r => setTimeout(r, ms));

test('a 4-ball jump is played back ball by ball, in order, with a gap', { timeout: 60000 }, async () => {
  const calls = []; let mid = 1;
  const tg = http.createServer((q, r) => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => {
    const m = q.url.split('/').pop(), raw = Buffer.concat(c).toString('latin1');
    let body = {}; if (/multipart/.test(q.headers['content-type'] || '')) { const f = raw.match(/filename="([^"]+)"/); body = { file: f && f[1] }; } else if (raw) body = JSON.parse(Buffer.concat(c).toString('utf8'));
    calls.push({ m, body, at: Date.now() });
    r.end(JSON.stringify({ ok: true, result: { message_id: ++mid, animation: { file_id: 'F' + mid } } }));
  }); });
  let state = 0;
  const balls = [{ n: 1, inning: 0, over: 0, ball: 1, runs: 1 }, { n: 2, inning: 0, over: 0, ball: 2, runs: 0 },
    { n: 3, inning: 0, over: 0, ball: 3, runs: 4, batsman: { name: 'Asif' } }, { n: 4, inning: 0, over: 0, ball: 4, runs: 0, dismissal: 'c Ali b Khan', batsman: { name: 'Asif' } },
    { n: 5, inning: 0, over: 0, ball: 5, runs: 6, batsman: { name: 'Zeb' } }];
  const mk = () => ({ id: 'r1', name: 'UAE vs Oman', matchType: 'odi', matchStarted: true, matchEnded: false, teamInfo: [{ name: 'UAE', shortname: 'UAE' }, { name: 'Oman', shortname: 'OMA' }],
    score: [state ? { inning: 'UAE Inning 1', r: 11, w: 1, o: '0.5' } : { inning: 'UAE Inning 1', r: 1, w: 0, o: '0.2' }], scorecard: [] });
  const cd = http.createServer((q, r) => {
    if (q.url.includes('match_bbb')) return r.end(JSON.stringify({ status: 'success', data: { bbb: state ? balls : balls.slice(0, 2) } }));
    r.end(JSON.stringify({ status: 'success', data: q.url.includes('current') ? [mk()] : mk() }));
  });
  const tp = await listen(tg), cp = await listen(cd);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-'));
  const bot = startBot({ TELEGRAM_BOT_TOKEN: 'T', CRIC_API_KEY: 'K', TG_BASE: `http://127.0.0.1:${tp}`, CRIC_BASE: `http://127.0.0.1:${cp}`, PORT: String(20500 + (Math.random() * 300 | 0)), POLL_MS: '600000', DATA_FILE: path.join(dir, 'b.json') });
  await bot.boot();
  try {
    bot.db.data.subs['9|r1'] = { chat: 9, match: 'r1', cardId: null };
    await bot.tick(); await wait(300);                  // 1/0 (0.2) remembered, card sent
    state = 1; await bot.tick();                        // provider jumps to 11/1 (0.5): 3 balls at once
    await wait(9000);
    const cards = calls.filter(c => /sendMessage|editMessageText/.test(c.m) && /UAE vs Oman/.test(c.body.text || '')).map(c => c.body.text);
    const seq = cards.map(t => (t.match(/【 (.+?) 】/) || [])[1]).filter(Boolean);
    const order = seq.filter((x, i) => x !== seq[i - 1]);
    assert.deepEqual(order.slice(-3), ['4  FOUR!', 'W  WICKET!', '6  SIX!'], 'card shows each ball in turn: ' + order);
    assert.ok(cards.some(t => /UAE 5\/0<\/b>\s+\(0\.3/.test(t)), 'intermediate score after the four');
    assert.ok(cards.some(t => /UAE 5\/1<\/b>\s+\(0\.4/.test(t)), 'intermediate score after the wicket');
    assert.match(cards.at(-1), /UAE 11\/1<\/b>\s+\(0\.5/);
    const an = calls.filter(c => c.m === 'sendAnimation');
    assert.deepEqual(an.map(c => c.body.file || ''), ['four.mp4', 'wicket.mp4', 'six.mp4']);
    assert.ok(an[1].at - an[0].at >= 1200 && an[2].at - an[1].at >= 1200, 'gap between balls');
    assert.equal(bot.stats.replays, 1);
  } finally { bot.close(); tg.close(); cd.close(); }
});
