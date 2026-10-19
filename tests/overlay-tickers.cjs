// OBS overlay: split team-colour bug and FOUR / SIX / OUT / FIFTY banners that appear on the new ball only.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 640, height: 360 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players });
    startInnings(m, 0, 'p0', 'p1', 'p11'); S.stream.mid = m.id; UI.ovFx = null;
    const o = {}, show = k => { const h = overlayHTML(); const d = document.createElement('div'); d.innerHTML = h; o[k] = { fx: (d.querySelector('.ovfx') || {}).innerText || '', split: /linear-gradient\(90deg,#235bbbf2/.test(h) }; };
    show('init'); ball(m, { r: 4 }); show('four'); show('four2'); ball(m, { r: 6 }); show('six'); ball(m, { r: 1 }); show('single');
    ball(m, { w: 'bowled' }); show('out');
    for (let i = 0; i < 3; i++) ball(m, { r: 1 }); show('x');
    return o;
  });
  ok(r.init.fx === '' && r.init.split, 'no banner on first load, split colours: ' + JSON.stringify(r.init));
  ok(/FOUR!/.test(r.four.fx), 'four'); ok(/FOUR!/.test(r.four2.fx), 'banner stays during its 4.5s window');
  ok(/SIX!/.test(r.six.fx), 'six'); ok(r.single.fx === '', 'single: no banner'); ok(/OUT!/.test(r.out.fx), 'out');
  ok(!errs.length, 'errors ' + errs.join(';'));
  // milestone + visual
  await p.evaluate(() => { UI.ovFx = null; const m = S.matches[S.matches.length - 1]; overlayHTML(); ball(m, { r: 6 }); });
  await p.evaluate(() => { document.body.classList.add('ovpage'); document.getElementById('app').innerHTML = overlayHTML(); const r = document.getElementById('app'); r.style.maxWidth = 'none'; r.style.padding = '0'; });
  await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/out/ov.png' });
  if (!process.exitCode) console.log('PASS: overlay tickers'); await b.close();
})();
