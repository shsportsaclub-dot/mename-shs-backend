// Graph tabs: Manhattan, worm, run rate + required rate, partnerships, wagon wheel, scoring shots, win probability.
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
    UI.mid = m.id; UI.view = 'match'; UI.tab = 'graphs'; UI.gtab = undefined; UI.drawer = false; render(); const o = {}, app = () => document.getElementById('app');
    o.pills = [...app().querySelectorAll('.gtabs button')].map(x => x.textContent).join('|'); o.man = app().querySelectorAll('.gr-card svg rect').length;
    for (const k of ['worm', 'rr', 'part', 'wag', 'shots', 'win']) { A.gtab({ v: k }); o[k] = { svg: app().querySelectorAll('.gr-card svg').length, poly: app().querySelectorAll('.gr-card svg polyline').length, rect: app().querySelectorAll('.gr-card svg rect').length, txt: app().querySelector('.gr-card').innerText } }
    A.gtab({ v: 'rr' }); o.dash = !!app().querySelector('.gr-card polyline[stroke-dasharray]'); o.rrpts = [...app().querySelectorAll('.gr-card polyline')][0].getAttribute('points').split(' ').length;
    A.gtab({ v: 'part' }); A.gi({ v: '0' }); o.partRects = app().querySelectorAll('.gr-card svg rect').length; o.hasOdds = /\bOdds\b/.test(app().innerText);
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(/Manhattan\|Worm\|Run rate\|Partnerships\|Wagon wheel\|Scoring shots\|Win %/.test(r.pills), 'pills ' + r.pills); ok(r.man >= 4, 'manhattan bars ' + r.man);
  ok(r.worm.poly >= 2, 'worm lines'); ok(r.rr.poly >= 3 && r.dash && r.rrpts === 5, 'run rate lines + required (pts ' + r.rrpts + ')'); ok(r.part.rect >= 2, 'partnership bars ' + r.part.rect); ok(r.partRects === 2, 'India partnerships = 1 wicket + unbroken: ' + r.partRects);
  ok(r.wag.svg === 1 && r.shots.svg === 1, 'wagon + shots'); ok(/Win probability/i.test(r.win.txt) && !r.hasOdds, 'win % wording'); ok(r.fit, 'no overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: graph tabs');
})();
