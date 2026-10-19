// Rankings: World / Country / State / City scopes filter correctly.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'A', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {};
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT', team: i < 11 ? 'a' : 'b', loc: i < 11 ? 'Hyderabad' : 'Pune' }));
    S.teams = [{ id: 'a', name: 'Lions', short: 'LIO', color: '#235bbb', state: 'Telangana', country: 'India', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Hawks', short: 'HAW', color: '#c9a400', state: 'Maharashtra', country: 'India', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 2, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m, 0, 'p0', 'p1', 'p11'); for (const r of [4, 6, 1, 2, 4, 0, 6, 1]) { const inn = m.innings[0]; if (inn.cur.bl == null) inn.cur.bl = 'p11'; ball(m, { r }); }
    m.status = 'done'; if (!S.matches.includes(m)) S.matches.push(m); UI.view = 'rankings'; const t = () => document.getElementById('app').innerText;
    UI.rk = { scope: 'all', g: 'men', cat: 'bat', state: '', country: '', city: '' }; render(); o.scopes = [...document.querySelectorAll('[data-k=scope]')].map(x => x.textContent).join('|'); o.world = /Player 0/.test(t());
    UI.rk.scope = 'country'; UI.rk.country = 'India'; render(); o.country = /Player 0/.test(t()); UI.rk.country = 'Nowhere'; render(); o.noCountry = !/Player 0/.test(t());
    UI.rk.scope = 'state'; UI.rk.state = 'Maharashtra'; render(); o.stateOut = !/Player 0/.test(t()); UI.rk.state = 'Telangana'; render(); o.stateIn = /Player 0/.test(t());
    UI.rk.scope = 'city'; UI.rk.city = 'Pune'; render(); o.cityOut = !/Player 0/.test(t()); UI.rk.city = 'hyderabad'; render(); o.cityIn = /Player 0/.test(t()); o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.scopes === 'World|Country|State|City', 'scopes ' + r.scopes); ok(r.world && r.country && r.noCountry && r.stateOut && r.stateIn && r.cityOut && r.cityIn, JSON.stringify(r)); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: rankings scopes');
})();
