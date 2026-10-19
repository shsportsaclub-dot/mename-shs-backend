// Player profile analytics from real scored balls (synthetic fixture match), plus honest empty state and Follow.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'scorer', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: i % 11 === 0 ? 'WK' : 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#e8b800', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players });
    startInnings(m, 0, 'p0', 'p1', 'p11'); [4, 6, 1, 0, 2, 4].forEach(r => ball(m, { r })); commit();
    UI.pp = { id: 'p0', tab: 'info' }; UI.view = 'player'; render();
    const withData = document.getElementById('app').innerText;
    UI.pp = { id: 'p20', tab: 'info' }; render(); const empty = document.getElementById('app').innerText;
    UI.pp = { id: 'p0', tab: 'info' }; render(); const svg = !!document.querySelector('svg[aria-label="Last innings runs"]');
    A.ppFollow({ id: 'p0' }); render(); const following = document.getElementById('app').innerText.includes('Following');
    document.body.style.overflowX = ''; return { withData, empty, svg, following, fit: document.documentElement.scrollWidth <= innerWidth };
  });
  ok(/ANALYTICS/.test(r.withData) && /Matches/.test(r.withData) && /Runs/.test(r.withData) && /11/.test(r.withData) && /366\.7/.test(r.withData), 'strip with 11 runs, SR 366.7: ' + r.withData.slice(0, 300));
  ok(r.svg, 'last innings graph'); ok(r.following, 'follow toggles'); ok(r.fit, 'fits 360px');
  ok(/No matches scored in this app/.test(r.empty), 'honest empty state');
  ok(!errs.length, 'errors ' + errs.join(';'));
  await p.evaluate(() => { UI.pp = { id: 'p0', tab: 'info' }; render(); window.scrollTo(0, 0) }); await p.screenshot({ path: '/tmp/out/pp.png' });
  if (!process.exitCode) console.log('PASS: player analytics'); await b.close();
})();
