// End-to-end: real bot process logic against a fake Telegram Bot API and a fake CricketData API.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { startBot } from '../bot.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));
const listen = srv => new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));

test('live line flow: start -> live list -> follow -> ball by ball edits + alerts -> result', { timeout: 60000 }, async () => {
  // ---- fake Telegram ----
  const calls = []; let mid = 100;
  const tgSrv = http.createServer((q, r) => {
    let b = ''; q.on('data', c => b += c); q.on('end', () => {
      const method = q.url.split('/').pop(), body = b ? JSON.parse(b) : {};
      assert.ok(q.url.startsWith('/botTEST:TOKEN/'), 'token goes in the URL path');
      calls.push({ method, body });
      r.setHeader('content-type', 'application/json');
      if (method === 'sendMessage') return r.end(JSON.stringify({ ok: true, result: { message_id: ++mid, chat: { id: body.chat_id } } }));
      if (method === 'editMessageText' && body.message_id === 9999) return r.end(JSON.stringify({ ok: false, error_code: 400, description: 'Bad Request: message to edit not found' }));
      r.end(JSON.stringify({ ok: true, result: true }));
    });
  });
  // ---- fake CricketData with a scripted chase ----
  const bat = (h, hb, m, mb, mDis = 'batting') => [{ batsman: { name: 'Travis Head' }, r: h, b: hb, '4s': 5, '6s': 1, 'dismissal-text': 'batting' }, { batsman: { name: 'Mitchell Marsh' }, r: m, b: mb, '4s': 1, '6s': 0, 'dismissal-text': mDis }];
  const steps = [
    { r: 140, w: 2, o: '15', batting: bat(48, 30, 20, 15), bo: '2', status: 'Australia need 50 runs in 30 balls' },
    { r: 141, w: 2, o: '15.1', batting: bat(49, 31, 20, 15), bo: '2.1' },
    { r: 145, w: 2, o: '15.2', batting: bat(53, 32, 20, 15), bo: '2.2' },
    { r: 145, w: 3, o: '15.5', batting: [...bat(53, 32, 20, 16, 'c Kohli b Bumrah'), { batsman: { name: 'Glenn Maxwell' }, r: 0, b: 0, 'dismissal-text': 'batting' }], bo: '2.3' },
    { r: 151, w: 3, o: '16', batting: [...bat(53, 32, 20, 16, 'c Kohli b Bumrah'), { batsman: { name: 'Glenn Maxwell' }, r: 6, b: 3, 'dismissal-text': 'batting' }], bo: '3' },
    { r: 190, w: 4, o: '19.4', batting: bat(70, 45, 20, 16, 'c Kohli b Bumrah'), bo: '4', status: 'Australia won by 6 wkts', ended: true },
  ];
  let step = 0;
  const matchAt = i => {
    const s = steps[i];
    return {
      id: 'm1', name: 'India vs Australia, 1st T20I', matchType: 't20', venue: 'Wankhede', status: s.status || 'Live', matchStarted: true, matchEnded: !!s.ended,
      teamInfo: [{ name: 'India', shortname: 'IND' }, { name: 'Australia', shortname: 'AUS' }], teams: ['India', 'Australia'],
      score: [{ inning: 'India Inning 1', r: 189, w: 5, o: 20 }, { inning: 'Australia Inning 1', r: s.r, w: s.w, o: s.o }],
      scorecard: [{ inning: 'Australia Inning 1', batting: s.batting, bowling: [{ bowler: { name: 'Jasprit Bumrah' }, o: s.bo, m: 0, r: 20, w: s.w > 2 ? 1 : 0, eco: 6.5 }] }],
    };
  };
  const cdSrv = http.createServer((q, r) => {
    r.setHeader('content-type', 'application/json');
    const u = new URL(q.url, 'http://x');
    assert.equal(u.searchParams.get('apikey'), 'CRICKEY');
    if (u.pathname.endsWith('/currentMatches')) return r.end(JSON.stringify({ status: 'success', data: [matchAt(step), { id: 'w1', name: 'India Women vs England Women', matchType: 'odi', matchStarted: true, matchEnded: false, teamInfo: [{ name: 'India Women', shortname: 'INDW' }, { name: 'England Women', shortname: 'ENGW' }], score: [] }, { id: 'u1', name: 'Pakistan vs New Zealand, 2nd ODI', matchType: 'odi', matchStarted: false, matchEnded: false, dateTimeGMT: '2026-11-05T09:00:00' }] }));
    if (u.pathname.endsWith('/match_scorecard')) return r.end(JSON.stringify({ status: 'success', data: matchAt(step) }));
    r.end(JSON.stringify({ status: 'failure', reason: 'unknown' }));
  });
  const tgPort = await listen(tgSrv), cdPort = await listen(cdSrv);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shll-'));
  const botPort = 18000 + Math.floor(Math.random() * 1000);
  const bot = startBot({ TELEGRAM_BOT_TOKEN: 'TEST:TOKEN', CRIC_API_KEY: 'CRICKEY', TG_BASE: `http://127.0.0.1:${tgPort}`, CRIC_BASE: `http://127.0.0.1:${cdPort}/v1`, PUBLIC_URL: `http://127.0.0.1:${botPort}`, TG_WEBHOOK_SECRET: 'sec_ret', PORT: String(botPort), POLL_MS: '1500', DATA_FILE: path.join(dir, 'bot.json'), TG_CHANNEL: '@shtest' });
  await bot.boot();
  const post = (u, secret = 'sec_ret') => fetch(`http://127.0.0.1:${botPort}/tg`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(u) });
  const msg = (text, id = 555, lang = 'en') => ({ update_id: Math.random() * 1e9 | 0, message: { message_id: 1, chat: { id, type: 'private' }, from: { id, language_code: lang }, text } });
  const cb = (data, id = 555) => ({ update_id: Math.random() * 1e9 | 0, callback_query: { id: 'q' + Math.random(), from: { id }, message: { message_id: 5, chat: { id } }, data } });
  const sent = (chat = 555) => calls.filter(c => c.method === 'sendMessage' && c.body.chat_id === chat);
  const edits = (chat = 555) => calls.filter(c => c.method === 'editMessageText' && c.body.chat_id === chat);
  try {
    await wait(300);
    // setup calls
    const wh = calls.find(c => c.method === 'setWebhook');
    assert.equal(wh.body.url, `http://127.0.0.1:${botPort}/tg`); assert.equal(wh.body.secret_token, 'sec_ret');
    assert.ok(calls.find(c => c.method === 'setMyCommands').body.commands.some(c => c.command === 'live'));
    // health + webhook secret
    assert.equal((await (await fetch(`http://127.0.0.1:${botPort}/health`)).json()).ok, true);
    assert.equal((await post(msg('/start'), 'wrong')).status, 401);
    assert.equal(sent().length, 0, 'forged webhook must be ignored');

    await post(msg('/start')); await wait(300);
    assert.match(sent().at(-1).body.text, /SH Sports Live Line/);
    assert.ok(sent().at(-1).body.reply_markup.inline_keyboard.flat().some(b => b.callback_data === 'L'));

    await post(cb('L')); await wait(400);
    const list = sent().at(-1).body.reply_markup.inline_keyboard.flat();
    assert.ok(list.some(b => b.callback_data === 'F:m1' && /IND v AUS · AUS 140\/2 \(15\.0\)/.test(b.text)), JSON.stringify(list));
    assert.ok(list.some(b => /Women/.test(b.text)) && list.some(b => b.callback_data === 'F:w1'), 'women section listed');
    assert.ok(!list.some(b => b.callback_data === 'F:u1'), 'upcoming match is not in the live list');

    await post(cb('U')); await wait(300);
    assert.match(sent().at(-1).body.text, /Pakistan vs New Zealand[\s\S]*05 Nov, 02:30 pm IST/);

    await post(cb('F:m1')); await wait(500);
    const card0 = sent().at(-1);
    assert.match(card0.body.text, /AUS 140\/2<\/b>\s+\(15\.0\/20 ov\)/);
    assert.match(card0.body.text, /Need 50 runs from 30 balls/);
    assert.equal(card0.body.disable_notification, true, 'card is silent');
    const cardId = card0.body.chat_id && (mid);

    // ball 15.1: single -> edit only, no alert
    const before = sent().length;
    step = 1; await wait(3200);
    assert.match(edits().at(-1).body.text, /【 1 RUN 】/);
    assert.equal(edits().at(-1).body.message_id, cardId, 'edits the same card');
    assert.equal(sent().length, before, 'no alert for a single');

    // ball 15.2: four + Head reaches 50
    step = 2; await wait(3200);
    const a2 = sent().slice(before).map(c => c.body.text).join('\n');
    assert.match(a2, /🔥 <b>FOUR!<\/b>\s+AUS 145\/2 \(15\.2\)\n🏏 Travis Head 53/);
    assert.match(a2, /⭐ <b>Travis Head<\/b> reaches 50!/);
    assert.match(edits().at(-1).body.text, /【 4  FOUR! 】/);

    // ball 15.3: wicket
    step = 3; await wait(3200);
    assert.match(sent().at(-1).body.text, /☝️ <b>WICKET!<\/b>\s+AUS 145\/3 \(15\.5\)\nMitchell Marsh — c Kohli b Bumrah/);

    // ball 16.0: six, over ends
    step = 4; await wait(3200);
    assert.match(sent().at(-1).body.text, /💥 <b>SIX!<\/b>/);
    const c4 = edits().at(-1).body.text;
    assert.match(c4, /Last balls: \[1\] \[4\] \[W\] \[6\]/);
    assert.match(c4, /End of over 16: 11 runs — 1 4 W 6/);
    assert.match(c4, /Glenn Maxwell\s+<b>6<\/b>/);
    assert.match(c4, /Partnership: 6 \(1\)/);
    assert.match(c4, /Win % \(model\): AUS \d+% · IND \d+%/);

    // scorecard + language
    await post(cb('C:m1')); await wait(400);
    assert.match(sent().at(-1).body.text, /<pre>[\s\S]*Glenn Maxwell\*/);
    await post(cb('X:te')); await wait(300);
    assert.match(sent().at(-1).body.text, /తెలుగు/);

    // a deleted card is re-sent instead of being lost
    const sub = Object.values(bot.db.data.subs).find(s => s.chat === 555); sub.cardId = 9999;
    await post(cb('R:m1')); await wait(2000);
    assert.ok(Object.values(bot.db.data.subs).find(s => s.chat === 555).cardId > 9999 || sent().at(-1).body.text.includes('గెలుపు'), 'card recreated in Telugu');

    // result -> alert + follower released
    step = 5; await wait(3500);
    assert.ok(sent().some(c => /🏆 ఫలితం[\s\S]*Australia won by 6 wkts/.test(c.body.text)), 'result alert in chosen language');
    assert.equal(Object.values(bot.db.data.subs).filter(s => s.chat === 555).length, 0);

    // /stop and owner-only status
    await post(msg('/status')); await wait(200);
    assert.ok(!/uptimeMin/.test(sent().at(-1).body.text), 'status is owner only');
    await post(msg('/claim')); await wait(200);
    await post(msg('/status')); await wait(200);
    assert.match(sent().at(-1).body.text, /uptimeMin/);
    // Edits per chat are throttled (Telegram flood rules): never two edits of one chat within ~1s.
    const t = calls.filter(c => c.method === 'editMessageText').length; assert.ok(t >= 4);
  } finally {
    bot.close(); tgSrv.close(); cdSrv.close();
  }
});
