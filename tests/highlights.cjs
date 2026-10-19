// Match highlights come only from recorded balls: wickets, fours, sixes, 50, 100, team milestones, biggest over.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players, venue: 'QA', date: '2026-10-19' });
    startInnings(m, 0, 'p0', 'p1', 'p11'); const inn = m.innings[0];
    const bowl = () => { if (inn.cur.bl == null) inn.cur.bl = 'p' + (11 + (Math.floor(inn.lg / 6) % 5)) };
    for (let k = 0; k < 17; k++) { bowl(); inn.cur.s = 'p0'; inn.cur.n = 'p1'; ball(m, { r: 6 }) }          // 102 by p0: 50 and 100
    bowl(); inn.cur.s = 'p0'; inn.cur.n = 'p1'; ball(m, { r: 4 }); bowl(); inn.cur.s = 'p0'; inn.cur.n = 'p1'; ball(m, { w: 'Bowled', out: 'p0' }); inn.cur.s = inn.cur.s || 'p2'; if (!inn.used.includes('p2')) inn.used.push('p2');
    const H = shHighlights(m); const o = {};
    o.six = H.filter(x => x.k === '6').length; o.four = H.filter(x => x.k === '4').length; o.wk = H.filter(x => x.t === 'wk').length;
    o.ms50 = H.filter(x => x.k === '50').length; o.ms100 = H.filter(x => x.k === '100').length; o.team = H.filter(x => x.t === 'tm').map(x => x.k).join(',');
    o.over = H.some(x => x.t === 'ov'); o.sum = shHlSummary(m).join(' ');
    // an overthrow boundary is not a batter four
    const m2 = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m2, 0, 'p0', 'p1', 'p11'); UI.ot = { n: 4, b: true }; ball(m2, { r: 0 });
    o.otFour = shHighlights(m2).filter(x => x.t === 'bd').length;
    UI.hl = { id: m.id, f: 'all' }; UI.view = 'highlights'; render(); o.ui = document.getElementById('app').innerText;
    A.hlF({ v: 'wk' }); o.uiWk = document.getElementById('app').innerText; o.fit = document.documentElement.scrollWidth <= innerWidth;
    return o;
  });
  ok(r.six === 17 && r.four === 1 && r.wk === 1, 'counts ' + JSON.stringify(r)); ok(r.ms50 === 1 && r.ms100 === 1, 'milestones'); ok(r.team === 'T50,T100', 'team milestones: ' + r.team); ok(r.over, 'biggest over'); ok(/Top scorer Player 0 106/.test(r.sum), 'summary: ' + r.sum);
  ok(r.otFour === 0, 'overthrow boundary is not a four'); ok(/Match highlights/.test(r.ui) && /reaches a century/.test(r.ui), 'ui'); ok(/WICKET: Player 0 out for 106/.test(r.uiWk) && !/reaches a century/.test(r.uiWk), 'wicket filter: ' + r.uiWk.slice(0, 300)); ok(r.fit, 'fits');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: highlights');
})();
