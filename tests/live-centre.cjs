// SH Live Centre v2: score header, result headline, ICC powerplay phases, batters/bowler/partnership, 4/6/W burst.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const mk = ov => { const m = newMatch({ a: 'a', b: 'b', overs: ov, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players, venue: 'QA Ground', date: '2026-10-19' }); m.rules={...m.rules,fieldingProfile:ov===50?'icc-men-odi':ov===20?'icc-men-t20':'custom'}; startInnings(m, 0, 'p0', 'p1', 'p11'); return m };
    const bowl = (m, k) => { const inn = m.innings[m.cur]; if (inn.cur.bl == null) inn.cur.bl = 'p' + (11 + (Math.floor(inn.lg / 6) % 5)); };
    const show = (m, tab) => { UI.mid = m.id; UI.view = 'match'; UI.tab = tab || 'live'; UI.drawer = false; render(); return document.getElementById('app'); };
    const o = {};
    // 1) live first innings, T20
    const m = mk(20); for (const x of [1, 4, 0, 2, 1, 1]) { bowl(m); ball(m, { r: x }) }
    let app = show(m); o.head = (app.querySelector('.lc-head')?.innerText || '') + ' ' + (app.querySelector('.sh-pulse-metrics')?.innerText || ''); o.state = app.querySelector('.lc-state')?.textContent; o.phase = app.querySelector('.lc-ph')?.innerText || '';
    o.bat = [...app.querySelectorAll('.lc-live table')][0]?.innerText || ''; o.over = app.querySelector('.lc-ov')?.innerText || '';
    // 2) burst only on a NEW ball after the first observation
    o.burst0 = !!document.querySelector('.lc-burst');
    bowl(m); ball(m, { r: 6 }); app = show(m); o.six = !!document.querySelector('.lc-burst.lc-six'); o.sixTxt = document.querySelector('.lc-bt')?.textContent;
    bowl(m); ball(m, { r: 4 }); app = show(m); o.four = !!document.querySelector('.lc-burst.lc-four');
    bowl(m); ball(m, { w: 'Bowled', out: m.innings[0].cur.s }); const inn0 = m.innings[0]; if (!inn0.cur.s) { inn0.cur.s = 'p2'; if (!inn0.used.includes('p2')) inn0.used.push('p2') } app = show(m); o.wkt = !!document.querySelector('.lc-burst.lc-wicket'); o.lastW = app.querySelector('.lc-live')?.innerText.includes('Last wicket');
    // 3) after the burst's life it is gone
    await new Promise(r => setTimeout(r, 2800)); render(); o.gone = !document.querySelector('.lc-burst');
    // 4) ODI phases
    const od = mk(50); bowl(od); ball(od, { r: 1 }); app = show(od); o.odi1 = app.querySelector('.lc-ph')?.innerText || '';
    for (let i = 0; i < 70; i++) { bowl(od); ball(od, { r: i % 7 === 0 ? 4 : 1 }) } app = show(od); o.odi2 = app.querySelector('.lc-ph')?.innerText || ''; o.phaseTable = [...app.querySelectorAll('.lc-box h4')].find(e=>/Innings phases/i.test(e.innerText))?.innerText;
    // 5) result headline at the top
    const t = mk(1); for (let i = 0; i < 6; i++) { bowl(t); ball(t, { r: 1 }) } o.brk = t.status; app = show(t); o.brkHead = app.querySelector('.lc-head')?.innerText || '';
    startInnings(t, 1, 'p11', 'p12', 'p0'); for (let i = 0; i < 6 && t.status !== 'done'; i++) { bowl(t); ball(t, { r: 6 }) } o.endStatus = t.status; o.result = t.result; app = show(t); o.endHead = app.querySelector('.lc-head')?.innerText || ''; o.won = !!app.querySelector('.lc-t.won'); o.res = !!app.querySelector('.lc-line.res');
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.state === 'LIVE' && /India/.test(r.head) && /CRR/.test(r.head), 'header ' + r.head); ok(/POWERPLAY/.test(r.phase) && /2 fielders/.test(r.phase), 'T20 PP chip: ' + r.phase);
  ok(/Player 0/.test(r.bat) && /\*/.test(r.bat), 'batters ' + r.bat); ok(/This over/.test(r.over), 'this over');
  ok(!r.burst0, 'no burst on first view'); ok(r.six && r.sixTxt === 'SIX!', 'six burst'); ok(r.four, 'four burst'); ok(r.wkt && r.lastW, 'wicket burst + last wicket'); ok(r.gone, 'burst ends');
  ok(/POWERPLAY 1/.test(r.odi1) && /2 fielders/.test(r.odi1), 'ODI PP1 ' + r.odi1); ok(/POWERPLAY 2/.test(r.odi2) && /4 fielders/.test(r.odi2), 'ODI PP2 ' + r.odi2); ok(/phases/i.test(r.phaseTable || ''), 'phase table');
  ok(r.brk === 'break' && /Australia need 7/.test(r.brkHead), 'break head: ' + r.brkHead); ok(r.endStatus === 'done' && r.won && r.res && /won/i.test(r.endHead), 'result headline: ' + r.endHead + ' / ' + r.result); ok(r.fit, 'no overflow');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: live centre');
})();
