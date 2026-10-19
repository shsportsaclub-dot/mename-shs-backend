// ePaper v2: brand masthead, local edition from own matches, poster from article.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'A', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {};
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'Lions', short: 'LIO', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Hawks', short: 'HAW', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 2, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players });
    startInnings(m, 0, 'p0', 'p1', 'p11'); for (const r of [4, 6, 1, 2, 4, 0, 6, 1, 1, 0, 4, 2]) { const inn = m.innings[0]; if (inn.cur.bl == null) inn.cur.bl = 'p11'; ball(m, { r }); }
    S.brand.name = 'Sky Club'; UI.view = 'epaper'; UI.ep2.ed = 'global'; render(); o.gTabs = !!document.querySelector('[data-a=ep2Ed]'); o.gName = /sky club daily/i.test(document.getElementById('app').innerText);
    A.ep2Ed({ v: 'local' }); const t = document.getElementById('app').innerText; o.local = /Sky Club Local/i.test(t) && /Top run-scorers/i.test(t); o.top = /Player 0/.test(t); o.fit = document.documentElement.scrollWidth <= innerWidth;
    A.ep2Poster({ k: 'nokey' }); o.noCrash = UI.view === 'epaper'; return o;
  });
  ok(r.gTabs && r.gName, 'global brand ' + JSON.stringify(r)); ok(r.local, 'local edition'); ok(r.top, 'top scorer'); ok(r.fit, 'overflow'); ok(r.noCrash, 'poster no crash'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: epaper v2');
})();
