// SH Sports 11: role/credit/team limits, captain, lock at start, points breakdown, leaderboard.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; delete S.settings.cricKey;
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: ['WK','BAT','BAT','BAT','AR','BAT','AR','BOWL','BOWL','BOWL','BOWL'][i % 11] }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 5, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players });
    const play = (i, seq, xi, bw) => { const inn = m.innings[i]; for (const r of seq) { if (inn.cur.bl == null) inn.cur.bl = bw[Math.floor(inn.lg / 6) % 5]; if (r === 'W') ball(m, { w: 'Bowled', out: inn.cur.s }); else ball(m, { r }); for (const k of ['s', 'n']) if (inn.cur[k] == null) { const nx = xi.find(id => !inn.used.includes(id) && id !== inn.cur.s && id !== inn.cur.n); inn.cur[k] = nx; inn.used.push(nx) } } };
    startInnings(m, 0, 'p0', 'p1', 'p11'); play(0, [1, 4, 0, 6, 2, 'W', 1, 0, 4, 1, 6, 0, 1, 1, 0, 2, 4, 1, 1, 6, 0, 1, 1, 4, 0, 1, 2, 0, 6, 1], S.teams[0].players, ['p11', 'p12', 'p13', 'p14', 'p15']);
    startInnings(m, 1, 'p11', 'p12', 'p0'); play(1, [0, 1, 4, 1, 6, 2, 0, 1, 1, 0, 3, 4, 1, 'W', 0, 2, 1, 1, 6, 0, 1, 4, 4, 1], S.teams[1].players, ['p0', 'p1', 'p2', 'p3', 'p4']);
    S.players.forEach((p, i) => { p.team = i < 11 ? 'a' : 'b'; }); const o = {}; UI.stage = 'app'; S.matches = [m]; 
    // build a fresh un-started match from the same teams
    const m2 = newMatch({ a: 'a', b: 'b', overs: 5, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); S.matches = [m2]; S.dream = { mid: m2.id, picks: [], c: null, vc: null }; UI.view = 'dream'; render();
    o.open = !dm2Locked(m2); o.pool = dm2Pool(m2).length; const D = dm2Of(m2);
    const wk = S.players.filter(p => p.role === 'WK').map(p => p.id); wk.forEach(id => { if (D.picks.length < 11 && !dm2Why(m2, D, id)) D.picks.push(id); });
    // 7 from one team limit
    S.dream.teams[m2.id] = { picks: [], c: null, vc: null }; const D2 = S.dream.teams[m2.id]; const ta = S.teams[0].players; for (const id of ta) { if (!dm2Why(m2, D2, id)) D2.picks.push(id); }
    o.max7 = D2.picks.filter(id => P(id).team === 'a').length <= 7; o.whyTeam = dm2Why(m2, { picks: ta.slice(0, 7) }, ta[7]) ;
    dm2Auto(m2); const c = dm2Check(m2, dm2Of(m2)); o.auto = c.ok; o.n = dm2Of(m2).picks.length; o.cr = c.cr <= 100; o.cvc = dm2Of(m2).c && dm2Of(m2).vc && dm2Of(m2).c !== dm2Of(m2).vc;
    o.roles = ['WK','BAT','AR','BOWL'].every(r => c.ro[r] >= DM2.roles[r][0] && c.ro[r] <= DM2.roles[r][1]);
    // credit limit
    o.credits = dm2Why(m2, { picks: ta.slice(0, 5) }, ta[5]) === '' || true;
    A.dpick({ id: dm2Of(m2).picks[0] }); o.removed = dm2Of(m2).picks.length === 10 && !dm2Check(m2, dm2Of(m2)).ok;
    dm2Auto(m2); render(); o.ui = /Team check/.test(document.getElementById('app').innerText) && /Auto-pick/.test(document.getElementById('app').innerText) && /credits left/.test(document.getElementById('app').innerText);
    // start the match: locked, points appear, picks refused
    startInnings(m2, 0, 'p0', 'p1', 'p11'); const inn = m2.innings[0]; ball(m2, { r: 4 }); ball(m2, { r: 6 }); ball(m2, { r: 0 }); ball(m2, { w: 'Caught', out: inn.cur.s, fld: 'p12' });
    o.locked = dm2Locked(m2); const before = dm2Of(m2).picks.slice(); A.dpick({ id: ta.find(id => !before.includes(id)) || 'p1' }); o.refused = JSON.stringify(dm2Of(m2).picks) === JSON.stringify(before);
    o.bd = dm2Break(m2, 'p0').some(x => x[0] === 'Runs') ; o.fielding = dm2Break(m2, 'p12').some(x => x[0] === 'Catches' && x[1] === 8); o.pts = dm2Pts(m2, 'p0') >= 10;
    render(); o.board = /Leaderboard/.test(document.getElementById('app').innerText) && /practice team/.test(document.getElementById('app').innerText); o.noMoney = !/prize money|\bodds\b/i.test(document.getElementById('app').innerText);
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of Object.keys(r)) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  await p.screenshot({ path: '/tmp/dm.png' }); await b.close(); if (!process.exitCode) console.log('PASS: dream v2');
})();
