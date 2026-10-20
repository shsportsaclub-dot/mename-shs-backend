// Manhattan: both teams side by side per over in two colours with lines; also for provider ball data.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; delete S.settings.cricKey;
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 5, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players });
    const play = (i, seq, xi, bw) => { const inn = m.innings[i]; for (const r of seq) { if (inn.cur.bl == null) inn.cur.bl = bw[Math.floor(inn.lg / 6) % 5]; if (r === 'W') ball(m, { w: 'Bowled', out: inn.cur.s }); else ball(m, { r }); for (const k of ['s', 'n']) if (inn.cur[k] == null) { const nx = xi.find(id => !inn.used.includes(id) && id !== inn.cur.s && id !== inn.cur.n); inn.cur[k] = nx; inn.used.push(nx) } } };
    startInnings(m, 0, 'p0', 'p1', 'p11'); play(0, [1, 4, 0, 6, 2, 'W', 1, 0, 4, 1, 6, 0, 1, 1, 0, 2, 4, 1, 1, 6, 0, 1, 1, 4, 0, 1, 2, 0, 6, 1], S.teams[0].players, ['p11', 'p12', 'p13', 'p14', 'p15']);
    startInnings(m, 1, 'p11', 'p12', 'p0'); play(1, [0, 1, 4, 1, 6, 2, 0, 1, 1, 0, 3, 4, 1, 'W', 0, 2, 1, 1, 6, 0, 1, 4, 4, 1], S.teams[1].players, ['p0', 'p1', 'p2', 'p3', 'p4']);
    UI.mid = m.id; UI.view = 'match'; UI.tab = 'graphs'; UI.gtab = 'man'; UI.drawer = false; render(); const o = {}, svg = document.querySelector('.gr-card svg');
    o.fills = [...new Set([...svg.querySelectorAll('rect')].map(r => r.getAttribute('fill')))].filter(f => f && f[0] === '#'); o.lines = svg.querySelectorAll('polyline').length; o.dots = svg.querySelectorAll('circle').length;
    const ov1 = calc(m, 0).pov.filter(Boolean).length, ov2 = calc(m, 1).pov.filter(Boolean).length; o.bars = [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('rx') === '1.5').length; o.expBars = ov1 + ov2;
    const bb = []; for (let inn = 1; inn <= 2; inn++) for (let ov = 0; ov < 3; ov++) for (let b = 1; b <= 6; b++) bb.push({ inning: inn, over: ov, ball: b, total_runs: (b + ov + inn) % 5, wicket: b === 3 && ov === 1 });
    const W = { bb, sc: { scorecard: [{ inning: 'Sydney Sixers Women Inning 1' }, { inning: 'Sydney Thunder Women Inning 1' }] }, m: { overs: 20 } }; const h = shWorldManhattan(W); const d = document.createElement('div'); d.innerHTML = h; o.wBars = d.querySelectorAll('rect[rx="1.5"]').length; o.wLines = d.querySelectorAll('polyline').length; o.wName = /Sydney Sixers/.test(h) && /Sydney Thunder/.test(h);
    o.empty = shWorldManhattan({ bb: [], sc: { scorecard: [] }, m: {} }) === '';
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.fills.length === 2, 'two colours ' + JSON.stringify(r)); ok(r.lines === 2, 'two lines'); ok(r.dots >= 1, 'wicket dots'); ok(r.bars === r.expBars && r.bars >= 8, 'bars ' + r.bars + '/' + r.expBars);
  ok(r.wBars === 6 && r.wLines === 2 && r.wName, 'provider ' + JSON.stringify(r)); ok(r.empty, 'no data => nothing invented'); ok(r.fit, 'fit'); ok(!errs.length, errs.join(';'));
  await p.screenshot({ path: '/tmp/man.png' }); await b.close(); if (!process.exitCode) console.log('PASS: graph both');
})();
