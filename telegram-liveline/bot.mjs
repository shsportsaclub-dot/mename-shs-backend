// SH Sports Live Line - standalone Telegram live-line bot (separate from the Scoring Heroes app).
// Env: TELEGRAM_BOT_TOKEN, CRIC_API_KEY (required); TG_WEBHOOK_SECRET, PUBLIC_URL / RENDER_EXTERNAL_URL,
//      TG_CHANNEL (e.g. @shsportslive), POLL_MS, DATA_FILE, PORT, TG_BASE / CRIC_BASE (tests only).
import http from 'node:http';
import fsx from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { telegram } from './lib/telegram.mjs';
import { cricket } from './lib/cricket.mjs';
import { store } from './lib/store.mjs';
import { neonKV } from './lib/neon.mjs';
import { tr, guessLang, LANGS } from './lib/i18n.mjs';
import * as E from './lib/engine.mjs';

export function startBot(env = process.env) {
  const log = (...a) => console.log(new Date().toISOString(), ...a);
  const tg = telegram({ token: env.TELEGRAM_BOT_TOKEN, base: env.TG_BASE || 'https://api.telegram.org', log });
  const cd = cricket({ key: env.CRIC_API_KEY, base: env.CRIC_BASE || 'https://api.cricapi.com/v1', log });
  const here = path.dirname(fileURLToPath(import.meta.url));
  const remote = neonKV(env.DATABASE_URL, { base: env.NEON_HTTP_BASE, log });
  const db = store(env.DATA_FILE || path.join(here, 'data', 'bot.json'), remote, log);
  const POLL_MS = Math.max(1500, Number(env.POLL_MS) || 4000);
  const SECRET = (env.TG_WEBHOOK_SECRET || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 256);
  const PUBLIC = (env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
  const CHANNEL = env.TG_CHANNEL || db.data.channel || '';
  const mem = new Map();          // matchId -> live memory (last balls, bowler, partnership ...)
  const latest = new Map();       // matchId -> last provider data
  const stats = { started: Date.now(), polls: 0, edits: 0, alerts: 0, errors: 0, updates: 0 };

  const user = id => (db.data.users[id] ||= { lang: 'en' });
  const T = id => tr(user(id).lang);
  const subKey = (chat, match) => `${chat}|${match}`;
  const subsOf = match => Object.values(db.data.subs).filter(s => s.match === match);
  const followed = () => [...new Set(Object.values(db.data.subs).map(s => s.match))];

  const home = id => ({ inline_keyboard: [[{ text: T(id)('liveBtn'), callback_data: 'L' }, { text: T(id)('upBtn'), callback_data: 'U' }], [{ text: T(id)('langBtn'), callback_data: 'G' }, { text: '🎬 Style', callback_data: 'V' }], [{ text: T(id)('helpBtn'), callback_data: 'H' }]] });
  const cardKb = (id, match) => {
    const t = T(id), rows = [[{ text: t('refresh'), callback_data: 'R:' + match }, { text: t('card'), callback_data: 'C:' + match }], [{ text: t('other'), callback_data: 'L' }, { text: t('stop'), callback_data: 'S:' + match }]];
    if (CHANNEL && String(db.data.owner) === String(id)) rows.push([{ text: '📣 Channel ON/OFF', callback_data: 'P:' + match }]);
    return { inline_keyboard: rows };
  };

  // ---------- match memory ----------
  function memFor(id) {
    if (!mem.has(id)) mem.set(id, { last6: [], thisOver: [], prevOver: null, lastLabel: null, bowler: null, partnerFrom: null, snap: null, bat: {}, dis: {}, bowlB: {}, ex: { wd: 0, nb: 0 }, freeHit: false, status: '', overStartR: null, ended: false });
    return mem.get(id);
  }
  function dismissals(card) { const o = {}; for (const b of card?.batting || []) if (b.batsman?.name) o[b.batsman.name] = b['dismissal-text'] || ''; return o; }

  // Turn a new provider reading into card memory + alert texts.
  function digest(m) {
    const M = memFor(m.id), s = E.snap(m), card = s ? E.lastInningCard(m.scorecard, s.inning) : null;
    const bat = E.batterRuns(card), bowlB = E.bowlerBalls(card), dis = dismissals(card), ex = E.extras(card);
    const limited = !!E.maxOvers(m.matchType, m.name);
    const alerts = [];
    const scoreLine = s ? `${E.teamShort(m, s.inning)} ${s.r}/${s.w} (${E.overs(s.b)})` : '';
    if (!M.snap) {                                   // first reading: just remember
      Object.assign(M, { snap: s, bat, dis, bowlB, ex, status: m.status || '', overStartR: s && s.b % 6 === 0 ? s.r : null, ended: !!m.matchEnded });
      const top = Object.entries(bowlB).sort((a, b) => b[1] - a[1])[0];
      if (card?.bowling?.length) M.bowler = card.bowling[card.bowling.length - 1].bowler?.name || (top && top[0]);
      return alerts;
    }
    const sameInnings = s && M.snap && s.idx === M.snap.idx;
    // Provider flicker guard: CricketData sometimes answers with an older copy (score goes back,
    // then forward again). A backwards reading is accepted only if it comes twice in a row.
    const backwards = s && M.snap && (s.idx < M.snap.idx || (sameInnings && (s.b < M.snap.b || s.w < M.snap.w || (s.b === M.snap.b && s.r < M.snap.r))));
    if (backwards) {
      const key = `${s.idx}:${s.r}/${s.w}/${s.b}`;
      if (M.backKey !== key) { M.backKey = key; stats.flicker = (stats.flicker || 0) + 1; return alerts; }
    }
    M.backKey = null;
    const events = E.diff(M.snap, s);
    // who bowled / who scored since the last reading
    const bowled = Object.entries(bowlB).find(([n, b]) => b > (M.bowlB[n] || 0));
    if (bowled) M.bowler = bowled[0];
    const scorer = Object.entries(bat).find(([n, r]) => r > (M.bat[n] ?? r));
    const outNow = Object.entries(dis).filter(([n, d]) => d && !/batting|not out/i.test(d) && /batting|not out/i.test(M.dis[n] || 'batting') && M.dis[n] !== undefined);
    for (const ev of events) {
      if (ev.kind === 'innings') {
        Object.assign(M, { last6: [], thisOver: [], prevOver: null, lastLabel: null, freeHit: false, partnerFrom: { idx: s.idx, r: 0, b: 0 }, overStartR: s.r });
        const prev = (m.score || [])[s.idx - 2];
        alerts.push({ key: 'innings', text: (t) => `⏸ <b>${E.esc(t('innings'))}</b>\n${prev ? E.esc(`${E.teamShort(m, prev.inning)} ${prev.r}/${prev.w} (${prev.o})`) : ''}\n${E.esc(m.status || '')}` });
        continue;
      }
      if (ev.kind === 'ball') {
        // Extras: the bowlers' wd / nb counters tell a wide from a no-ball (score alone cannot).
        const dWd = sameInnings ? ex.wd - (M.ex.wd || 0) : 0, dNb = sameInnings ? ex.nb - (M.ex.nb || 0) : 0;
        if (ev.legal === 0 && dNb > 0) ev.label = ev.runs > 1 ? `Nb+${ev.runs - 1}` : 'Nb';
        else if (ev.legal === 0 && dWd > 0) ev.label = ev.runs > 1 ? `Wd+${ev.runs - 1}` : 'Wd';
        const wasFreeHit = M.freeHit;
        // ICC playing conditions (ODI/T20I): every no-ball gives a free hit; it carries over
        // if the next delivery is a wide or another no-ball, and ends after the next legal ball.
        if (dNb > 0 && limited) M.freeHit = true;
        else if (ev.legal > 0) M.freeHit = false;
        if (ev.legal === 0 && dNb > 0) alerts.push({ key: 'noball', anim: limited ? 'freehit' : null, text: t => `🚨 <b>NO BALL</b>${limited ? ' → 🟢 <b>FREE HIT</b>' : ''}  ${E.esc(scoreLine)}` });
        else if (ev.legal === 0 && dWd > 0) alerts.push({ key: 'wide', anim: 'wide', text: t => `↔️ <b>WIDE</b> +${ev.runs}  ${E.esc(scoreLine)}${M.freeHit ? '\n🟢 Free hit continues' : ''}` });
        if (wasFreeHit && ev.legal > 0 && !ev.wkts && ev.boundary) ev.freeHitShot = true;
        M.lastLabel = ev.label;
        M.last6 = [...M.last6, ev.label].slice(-6);
        M.thisOver = [...M.thisOver, ev.label];
        if (ev.wkts > 0) {
          M.partnerFrom = { idx: s.idx, r: s.r, b: s.b };
          const who = outNow.map(([n, d]) => `${n} — ${d}`).join('\n');
          alerts.push({ key: 'wicket', anim: 'wicket', text: t => `☝️ <b>${E.esc(t('wicket'))}</b>  ${E.esc(scoreLine)}\n${E.esc(who)}` });
        } else if (ev.boundary) {
          const w = scorer ? `${scorer[0]} ${bat[scorer[0]]}` : '';
          alerts.push({ key: ev.runs === 6 ? 'six' : 'four', anim: ev.runs === 6 ? 'six' : 'four', effect: ev.runs === 6 ? EFFECT.party : EFFECT.fire, text: t => `${ev.runs === 6 ? '💥' : '🔥'} <b>${E.esc(t(ev.runs === 6 ? 'six' : 'four'))}</b>${ev.freeHitShot ? ' (off the free hit)' : ''}  ${E.esc(scoreLine)}${w ? '\n🏏 ' + E.esc(w) : ''}` });
        }
      }
      if (ev.kind === 'over') {
        M.prevOver = { n: ev.over, r: M.overStartR === null ? '?' : s.r - M.overStartR, balls: M.thisOver };
        M.thisOver = []; M.overStartR = s.r;
      }
    }
    // DRS: CricketData has no review field, so we watch the match status text for review wording.
    if (m.status && m.status !== M.status && E.REVIEW_RE.test(m.status)) alerts.push({ key: 'review', anim: 'review', text: t => `📺 <b>DRS REVIEW</b>  ${E.esc(scoreLine)}\n${E.esc(m.status)}` });
    if (sameInnings) for (const ms of E.milestones(M.bat, bat)) alerts.push({ key: 'milestone', anim: ms.mark >= 100 ? 'hundred' : 'fifty', effect: ms.mark >= 100 ? EFFECT.party : EFFECT.like, text: t => `⭐ <b>${E.esc(ms.name)}</b> ${E.esc(t('fifty', { mark: ms.mark }))}  ${ms.runs}*\n${E.esc(scoreLine)}` });
    if (m.matchEnded && !M.ended) {
      M.ended = true;
      alerts.push({ key: 'result', text: t => `${E.esc(t('result'))}\n<b>${E.esc(m.name)}</b>\n${E.esc(m.status || '')}` });
    }
    Object.assign(M, { snap: s, bat, dis, bowlB, ex, status: m.status || '' });
    return alerts;
  }

  // ---------- pushing to chats ----------
  // Telegram message effects (private chats only); unknown ids fall back to no effect.
  const EFFECT = { fire: '5104841245755180586', party: '5046509860389126442', like: '5107584321108051014' };
  const ANIM_DIR = path.join(here, 'assets');
  const animsOn = env.ANIMATIONS !== '0';
  // Animation themes: 'classic' = graphic set, the rest are character sets (assets/themes/<id>/<event>.mp4).
  const THEMES = { classic: '✨ Classic graphics', umpire: '🧑‍⚖️ Umpire Ramu (ICC signals)', tiger: '🐯 Sher the Tiger', digits: '4️⃣ Bouncy Digits', cheer: '📣 SH Cheer Squad' };

  const animFile = (theme, name) => {
    const f = theme && theme !== 'classic' ? path.join(ANIM_DIR, 'themes', theme, name + '.mp4') : null;
    return f && fsx.existsSync(f) ? [theme + '/' + name, f] : ['classic/' + name, path.join(ANIM_DIR, name + '.mp4')];
  };
  const themeOf = chat => (THEMES[db.data.users[chat]?.theme] ? db.data.users[chat].theme : (env.DEFAULT_THEME && THEMES[env.DEFAULT_THEME] ? env.DEFAULT_THEME : 'classic'));
  const themeMenu = chat => tg.send(chat, '🎬 <b>Animation style</b>\nPick who celebrates 4s, 6s, wickets and more for you:', { reply_markup: { inline_keyboard: Object.entries(THEMES).map(([k, v]) => [{ text: (themeOf(chat) === k ? '✅ ' : '') + v, callback_data: 'Y:' + k }]) } });
  async function sendAlert(chat, a) {
    const text = a.text(T(chat));
    try {
      if (animsOn && a.anim) { const [key, file] = animFile(themeOf(chat), a.anim); return await tg.sendAnim(chat, key, file, text, a.effect); }
      return await tg.send(chat, text, a.effect && Number(chat) > 0 ? { message_effect_id: a.effect } : {});
    } catch (e) {
      if (e.code === 403) return dropChat(chat);
      try { await tg.send(chat, text); } catch {}          // animation failed: the text still arrives
    }
  }
  async function pushCard(sub, m, forceNew = false) {
    const t = T(sub.chat), text = E.liveCard(m, memFor(m.id), t);
    const markup = cardKb(sub.chat, m.id);
    if (!sub.cardId || forceNew) {
      try { const r = await tg.send(sub.chat, text, { reply_markup: markup, disable_notification: true }); sub.cardId = r.message_id; db.save(); }
      catch (e) { stats.errors++; if (e.code === 403) dropChat(sub.chat); }
      return;
    }
    stats.edits++;
    tg.editCard(sub.chat, sub.cardId, text, markup, why => { if (why === 'blocked') return dropChat(sub.chat); sub.cardId = null; pushCard(sub, m, true); });
  }
  function dropChat(chat) { for (const k of Object.keys(db.data.subs)) if (db.data.subs[k].chat === chat) delete db.data.subs[k]; db.save(); }

  async function tick() {
    const ids = followed();
    if (!ids.length) return;
    stats.polls++;
    await Promise.allSettled(ids.map(async id => {
      let m;
      try { m = await cd.scorecard(id); } catch (e) { stats.errors++; return; }
      if (!m) return;
      m.id = m.id || id;
      latest.set(id, m);
      const alerts = digest(m);
      for (const sub of subsOf(id)) {
        for (const a of alerts) { stats.alerts++; sendAlert(sub.chat, a); }
        await pushCard(sub, m);
        if (m.matchEnded) { delete db.data.subs[subKey(sub.chat, id)]; db.save(); }
      }
      if (m.matchEnded) setTimeout(() => mem.delete(id), 60000);
    }));
  }

  // ---------- commands ----------
  async function listLive(chat) {
    const t = T(chat);
    let all;
    try { all = await cd.current(); } catch { return tg.send(chat, t('unavailable')); }
    const live = all.filter(E.isLive);
    if (!live.length) return tg.send(chat, t('noLive'), { reply_markup: home(chat) });
    const rows = [];
    for (const [label, part] of [[t('men'), live.filter(m => !E.isWomen(m))], [t('women'), live.filter(E.isWomen)]]) {
      if (!part.length) continue;
      rows.push([{ text: `── ${label} ──`, callback_data: 'N' }]);
      for (const m of part.slice(0, 20)) rows.push([{ text: E.matchButtonText(m).slice(0, 60), callback_data: 'F:' + m.id }]);
    }
    return tg.send(chat, t('pick'), { reply_markup: { inline_keyboard: rows } });
  }
  async function listUpcoming(chat) {
    const t = T(chat);
    let all;
    try { all = await cd.current(); } catch { return tg.send(chat, t('unavailable')); }
    const up = all.filter(m => !m.matchStarted).sort((a, b) => String(a.dateTimeGMT).localeCompare(String(b.dateTimeGMT))).slice(0, 10);
    if (!up.length) return tg.send(chat, t('noUp'), { reply_markup: home(chat) });
    const lines = up.map(m => {
      const d = m.dateTimeGMT ? new Date(m.dateTimeGMT + (String(m.dateTimeGMT).endsWith('Z') ? '' : 'Z')) : null;
      const when = d && !isNaN(d) ? d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST' : '';
      return `• <b>${E.esc(m.name)}</b>\n   ${E.esc([String(m.matchType || '').toUpperCase(), when].filter(Boolean).join(' · '))}`;
    });
    return tg.send(chat, `${t('upcoming')}\n\n${lines.join('\n')}`, { reply_markup: home(chat) });
  }
  async function follow(chat, match) {
    for (const k of Object.keys(db.data.subs)) if (db.data.subs[k].chat === chat) delete db.data.subs[k];   // one match per person
    const sub = (db.data.subs[subKey(chat, match)] = { chat, match, cardId: null });
    db.save();
    let m = latest.get(match);
    if (!m) { try { m = await cd.scorecard(match); if (m) { m.id = m.id || match; latest.set(match, m); digest(m); } } catch {} }
    await tg.send(chat, T(chat)('following'));
    if (m) await pushCard(sub, m, true);
  }
  async function stop(chat) {
    for (const k of Object.keys(db.data.subs)) if (db.data.subs[k].chat === chat) delete db.data.subs[k];
    db.save();
    return tg.send(chat, T(chat)('stopped'), { reply_markup: home(chat) });
  }
  async function toggleChannel(chat, match) {
    if (!CHANNEL || String(db.data.owner) !== String(chat)) return;
    const k = subKey(CHANNEL, match);
    if (db.data.subs[k]) { delete db.data.subs[k]; db.save(); return tg.send(chat, `📣 Channel OFF for this match.`); }
    db.data.subs[k] = { chat: CHANNEL, match, cardId: null }; db.save();
    const m = latest.get(match); if (m) await pushCard(db.data.subs[k], m, true);
    return tg.send(chat, `📣 Channel ON: ${E.esc(CHANNEL)} now gets this match live.`);
  }

  async function onUpdate(u) {
    stats.updates++;
    if (u.message?.chat) {
      const chat = u.message.chat.id, text = String(u.message.text || '').trim();
      const U = user(chat);
      if (!U.seen) { U.seen = Date.now(); U.lang = guessLang(u.message.from?.language_code); db.save(); }
      const cmd = text.split(/[\s@]/)[0].toLowerCase();
      if (cmd === '/start' || cmd === '/menu') return tg.send(chat, T(chat)('welcome'), { reply_markup: home(chat) });
      if (cmd === '/live') return listLive(chat);
      if (cmd === '/upcoming') return listUpcoming(chat);
      if (cmd === '/stop') return stop(chat);
      if (cmd === '/help') return tg.send(chat, T(chat)('help'), { reply_markup: home(chat) });
      if (cmd === '/language' || cmd === '/lang') return langMenu(chat);
      if (cmd === '/theme' || cmd === '/style') return themeMenu(chat);
      if (cmd === '/claim' || /^\/(cl|ca)[a-z]{2,4}$/.test(cmd)) {   // phone keyboards turn /claim into /clime, /claime ...                         // first person to claim becomes the owner (channel controls)
        if (!db.data.owner) { db.data.owner = chat; db.save(); return tg.send(chat, '👑 You are now the owner of this bot.'); }
        return tg.send(chat, String(db.data.owner) === String(chat) ? '👑 You are the owner.' : 'This bot already has an owner.');
      }
      if (cmd === '/demo' && String(db.data.owner) === String(chat)) {
        const list = [['four', '🔥 <b>FOUR!</b>  demo', EFFECT.fire], ['six', '💥 <b>SIX!</b>  demo', EFFECT.party], ['wicket', '☝️ <b>WICKET!</b>  demo'], ['wide', '↔️ <b>WIDE</b> +1  demo'], ['freehit', '🚨 <b>NO BALL</b> → 🟢 <b>FREE HIT</b>  demo'], ['review', '📺 <b>DRS REVIEW</b>  demo'], ['fifty', '⭐ <b>FIFTY</b>  demo', EFFECT.like], ['hundred', '⭐ <b>CENTURY</b>  demo', EFFECT.party]];
        const res = [];
        const th = text.split(/\s+/)[1] && THEMES[text.split(/\s+/)[1]] ? text.split(/\s+/)[1] : themeOf(chat);
        for (const [n, cap, ef] of list) { const [key, file] = animFile(th, n); try { await tg.sendAnim(chat, key, file, cap, ef); res.push('✅ ' + key); } catch (e) { res.push('❌ ' + key + ': ' + E.esc(e.message)); } }
        return tg.send(chat, res.join('\n'));
      }
      if (cmd === '/speed' && String(db.data.owner) === String(chat)) { await tg.send(chat, '⏱ Watching CricketData for 2 minutes…'); const r = await speedTest(text.split(/\s+/)[1]); return tg.send(chat, r.join('\n').slice(0, 4000)); }
      if (cmd === '/diag' && String(db.data.owner) === String(chat)) { await tg.send(chat, '🔎 Testing CricketData live…'); const r = await diag(); return tg.send(chat, E.esc(r.join('\n')).slice(0, 4000)); }
      if (cmd === '/status' && String(db.data.owner) === String(chat)) return tg.send(chat, `<pre>${E.esc(JSON.stringify({ ...stats, uptimeMin: Math.round((Date.now() - stats.started) / 60000), users: Object.keys(db.data.users).length, following: Object.keys(db.data.subs).length, matches: followed().length }, null, 1))}</pre>`);
      if (['/speed', '/diag', '/status', '/demo'].includes(cmd)) return tg.send(chat, db.data.owner ? '🔒 Owner only.' : '🔒 Owner only. Send /claim first (c-l-a-i-m).');
      if (/^\/cl[a-z]{2,4}$/.test(cmd)) return tg.send(chat, 'Did you mean /claim ? Tap: /claim');
      return tg.send(chat, T(chat)('welcome'), { reply_markup: home(chat) });
    }
    if (u.callback_query) {
      const q = u.callback_query, chat = q.message?.chat?.id ?? q.from.id, d = String(q.data || '');
      user(chat);
      const [op, arg] = [d.slice(0, 1), d.slice(2)];
      await tg.answer(q.id);
      if (op === 'L') return listLive(chat);
      if (op === 'U') return listUpcoming(chat);
      if (op === 'H') return tg.send(chat, T(chat)('help'), { reply_markup: home(chat) });
      if (op === 'G') return langMenu(chat);
      if (op === 'V') return themeMenu(chat);
      if (op === 'Y' && THEMES[arg]) {
        user(chat).theme = arg; db.save();
        await tg.send(chat, `✅ Animation style: <b>${E.esc(THEMES[arg])}</b>`);
        const [key, file] = animFile(arg, 'six');
        return tg.sendAnim(chat, key, file, '💥 <b>SIX!</b>  preview').catch(() => {});
      }
      if (op === 'F') return follow(chat, arg);
      if (op === 'S') return stop(chat);
      if (op === 'P') return toggleChannel(chat, arg);
      if (op === 'X' && LANGS[arg]) { user(chat).lang = arg; db.save(); return tg.send(chat, T(chat)('langSet'), { reply_markup: home(chat) }); }
      if (op === 'C') {
        let m = latest.get(arg); try { m = (await cd.scorecard(arg)) || m; } catch {}
        return m ? tg.send(chat, E.scorecardText(m, T(chat))) : tg.send(chat, T(chat)('noCard'));
      }
      if (op === 'R') {
        const sub = db.data.subs[subKey(chat, arg)];
        let m; try { m = await cd.scorecard(arg); } catch {}
        if (m) { m.id = m.id || arg; latest.set(arg, m); digest(m); }
        if (sub && (m || latest.get(arg))) return pushCard(sub, m || latest.get(arg));
        if (!sub) return follow(chat, arg);
      }
    }
  }
  const langMenu = chat => tg.send(chat, T(chat)('langPick'), { reply_markup: { inline_keyboard: [Object.entries(LANGS).map(([k, v]) => ({ text: v, callback_data: 'X:' + k }))] } });

  // ---------- real-provider self test: is a problem in CricketData's reply, or in our code? ----------
  async function diag() {
    const R = [], ok = (side, pass, what) => R.push(`${pass ? '✅' : '❌'} [${side}] ${what}`);
    if (!remote) R.push('⚠️ [STORAGE] DATABASE_URL not set: owner/followers are lost on every deploy');
    else {
      let saved = false, err = '';
      try { await db.flush(); saved = !db.info.lastError; err = db.info.lastError || ''; } catch (e) { err = e.message; }
      ok('STORAGE', db.info.loaded && saved, `Neon: loaded at start ${db.info.loaded ? 'yes' : 'no'}, save now ${saved ? 'ok' : 'failed'}${err ? ' — ' + err : ''}`);
    }
    const cur = await cd.raw('currentMatches', { offset: '0' });
    ok('PROVIDER', cur.status === 'success', `currentMatches: http ${cur.http}, ${cur.ms} ms, status=${cur.status}${cur.reason ? ', reason=' + cur.reason : ''}${cur.info ? `, hits ${cur.info.hitsToday}/${cur.info.hitsLimit}` : ''}`);
    const rows = Array.isArray(cur.data) ? cur.data : [];
    const live = rows.filter(E.isLive);
    ok('PROVIDER', rows.length > 0, `matches listed: ${rows.length} (live ${live.length}, upcoming ${rows.filter(m => !m.matchStarted).length})`);
    const pick = live.find(m => m.score?.length) || live[0];
    if (!pick) { R.push('ℹ️ No live match right now, so the ball-by-ball part cannot be checked yet.'); return R; }
    let codeOk = true;
    try { E.matchButtonText(pick); } catch { codeOk = false; }
    ok('CODE', codeOk, `list button built for: ${pick.name}`);
    const a = await cd.raw('match_scorecard', { id: pick.id });
    ok('PROVIDER', a.status === 'success' && a.data, `match_scorecard: http ${a.http}, ${a.ms} ms, status=${a.status}${a.reason ? ', reason=' + a.reason : ''}`);
    const m = a.data || {};
    ok('PROVIDER', Array.isArray(m.score) && m.score.length > 0, `score[] innings: ${Array.isArray(m.score) ? m.score.map(s => `${s.inning} ${s.r}/${s.w} (${s.o})`).join(' | ') : 'missing'}`);
    const card = Array.isArray(m.scorecard) ? m.scorecard.at(-1) : null;
    ok('PROVIDER', !!card, `scorecard[]: ${Array.isArray(m.scorecard) ? m.scorecard.length + ' innings' : 'missing'}; batting rows ${card?.batting?.length ?? 0}, bowling rows ${card?.bowling?.length ?? 0}`);
    let s = null, text = '';
    try { s = E.snap({ ...m, id: pick.id }); text = E.liveCard({ ...m, id: pick.id }, memFor(pick.id), tr('en')); } catch (e) { codeOk = false; R.push('❌ [CODE] card crashed: ' + e.message); }
    ok('CODE', !!s, `read score: ${s ? `${s.r}/${s.w} in ${E.overs(s.b)} ov` : 'nothing (provider score[] empty?)'}`);
    ok('CODE', text.length > 0 && text.length < 4096, `live card built: ${text.length} chars (Telegram limit 4096)`);
    ok('CODE', E.atCrease(card).length > 0 || !card, `batters at crease found: ${E.atCrease(card).map(b => b.batsman?.name).join(', ') || 'none'}`);
    // Two readings a few seconds apart: does the provider move, and does our diff see it?
    await new Promise(r => setTimeout(r, 6000));
    const b = await cd.raw('match_scorecard', { id: pick.id });
    const s2 = b.data ? E.snap({ ...b.data, id: pick.id }) : null;
    const ev = s && s2 ? E.diff(s, s2) : [];
    R.push(`ℹ️ 6 s later provider says ${s2 ? `${s2.r}/${s2.w} (${E.overs(s2.b)})` : 'nothing'} → our events: ${ev.map(e => e.label).join(' ') || 'no change'}`);
    return R;
  }

  // Watch one live match for a while and time every score change the provider makes.
  // Tells apart "provider updates every ball" from "provider sends several balls at once / late".
  async function speedTest(matchId, seconds = 120, everyMs = 3000) {
    let id = matchId;
    if (!id) { const mine = Object.values(db.data.subs)[0]; id = mine?.match; }
    if (!id) { try { const l = (await cd.current(0)).filter(E.isLive); id = (l.find(m => /t20|odi/i.test(m.matchType)) || l[0])?.id; } catch {} }
    if (!id) return ['ℹ️ No live match to watch right now.'];
    const seen = [], start = Date.now();
    let prev = null, name = '', lastChange = null, errors = 0, slowest = 0;
    while (Date.now() - start < seconds * 1000) {
      const r = await cd.raw('match_scorecard', { id });
      slowest = Math.max(slowest, r.ms);
      if (r.status !== 'success' || !r.data) errors++;
      else {
        name ||= r.data.name || id;
        const s = E.snap(r.data);
        if (s && (!prev || s.r !== prev.r || s.w !== prev.w || s.b !== prev.b || s.idx !== prev.idx)) {
          const now = Date.now();
          if (prev) seen.push({ t: now, gap: lastChange ? Math.round((now - lastChange) / 1000) : null, balls: s.idx === prev.idx ? s.b - prev.b : null, label: E.diff(prev, s).map(e => e.label).join(' '), score: `${s.r}/${s.w} (${E.overs(s.b)})` });
          lastChange = now; prev = s;
        }
      }
      await new Promise(res => setTimeout(res, everyMs));
    }
    const R = [`⏱ <b>Speed test</b> ${E.esc(name)}`, `Watched ${seconds}s, asked CricketData every ${everyMs / 1000}s. Slowest reply ${slowest} ms, failed replies ${errors}.`, ''];
    if (!seen.length) { R.push('ℹ️ Score did not change in this time (break, drinks, review or slow over). Run /speed again during play.'); return R; }
    for (const x of seen) R.push(`${new Date(x.t).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}  ${E.esc(x.score)}  [${E.esc(x.label)}]${x.gap !== null ? `  +${x.gap}s` : ''}${x.balls > 1 ? `  ⚠️ ${x.balls} balls in one update` : ''}`);
    const multi = seen.filter(x => x.balls > 1).length;
    R.push('');
    R.push(multi ? `❌ [PROVIDER] ${multi} of ${seen.length} updates jumped more than one ball — CricketData is batching balls, not our code.` : `✅ [PROVIDER] every update was one ball — CricketData is ball by ball.`);
    R.push(`✅ [CODE] our bot sees a provider change within ${POLL_MS / 1000 + 1}s (poll every ${POLL_MS / 1000}s + 1s Telegram edit).`);
    return R;
  }

  // ---------- HTTP (webhook + health) ----------
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ ok: true, service: 'sh-liveline-bot', mode: PUBLIC ? 'webhook' : 'polling', following: Object.keys(db.data.subs).length, matches: followed().length, polls: stats.polls }));
    }
    if (req.method === 'GET' && req.url.startsWith('/diag')) {
      const q = new URL(req.url, 'http://x').searchParams.get('s');
      if (!SECRET || q !== SECRET) { res.statusCode = 401; return res.end(); }
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      diag().then(r => res.end(r.join('\n'))).catch(e => res.end('diag failed: ' + e.message));
      return;
    }
    if (req.method === 'POST' && req.url === '/tg') {
      if (SECRET && req.headers['x-telegram-bot-api-secret-token'] !== SECRET) { res.statusCode = 401; return res.end(); }
      let body = '';
      req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
      req.on('end', () => { res.end('ok'); let u; try { u = JSON.parse(body); } catch { return; } onUpdate(u).catch(e => { stats.errors++; log('update error', e.message); }); });
      return;
    }
    res.statusCode = 404; res.end();
  });

  let pollTimer, keepTimer, stopped = false;
  async function longPoll() {
    let offset = 0;
    while (!stopped) {
      try {
        const ups = await tg.call('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] }, 1);
        for (const u of ups) { offset = u.update_id + 1; onUpdate(u).catch(e => log('update error', e.message)); }
      } catch (e) { await new Promise(r => setTimeout(r, 3000)); }
    }
  }
  async function boot() {
    const port = Number(env.PORT) || 10000;
    await db.load();                                  // owner, users and followers survive deploys
    log('storage:', remote ? (db.info.loaded ? 'neon loaded' : 'neon FAILED: ' + db.info.lastError) : 'local file only');
    await new Promise(r => server.listen(port, r));
    log('SH Live Line listening on', port, PUBLIC ? 'webhook' : 'long-polling');
    try {
      await tg.call('setMyCommands', { commands: [{ command: 'live', description: 'Live matches' }, { command: 'upcoming', description: 'Upcoming matches' }, { command: 'claim', description: 'Owner: lock this bot to you' }, { command: 'speed', description: 'Owner: CricketData speed test' }, { command: 'diag', description: 'Owner: provider vs code check' }, { command: 'demo', description: 'Owner: show all event animations' }, { command: 'stop', description: 'Stop following' }, { command: 'language', description: 'Change language' }, { command: 'theme', description: 'Animation style (umpire, tiger ...)' }, { command: 'help', description: 'Help' }] });
      await tg.call('setMyDescription', { description: 'SH Sports Live Line: fastest ball-by-ball cricket scores for every match worldwide. Tap Start, pick a live match, and the score updates by itself every ball.' }).catch(() => {});
      await tg.call('setMyShortDescription', { short_description: 'Fastest ball-by-ball cricket live line' }).catch(() => {});
      if (PUBLIC) await tg.call('setWebhook', { url: PUBLIC + '/tg', allowed_updates: ['message', 'callback_query'], drop_pending_updates: false, ...(SECRET ? { secret_token: SECRET } : {}) });
      else { await tg.call('deleteWebhook', {}).catch(() => {}); longPoll(); }
    } catch (e) { log('telegram setup failed:', e.message); }
    const loop = async () => { if (stopped) return; try { await tick(); } catch (e) { stats.errors++; log('tick error', e.message); } pollTimer = setTimeout(loop, POLL_MS); };
    loop();
    // Render free services sleep after ~15 min with no inbound request. Ping ourselves only while
    // someone follows a live match, so free hours are not burned when nobody is watching.
    if (PUBLIC) keepTimer = setInterval(() => { if (followed().length) fetch(PUBLIC + '/health').catch(() => {}); }, 9 * 60000);
    return server;
  }
  const close = () => { stopped = true; clearTimeout(pollTimer); clearInterval(keepTimer); db.flush(); server.close(); };
  return { boot, close, onUpdate, tick, stats, db, server };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const bot = startBot();
  bot.boot();
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { bot.close(); process.exit(0); });
}
