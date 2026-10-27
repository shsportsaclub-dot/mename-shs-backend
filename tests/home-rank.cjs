// Home ranking: viewer's country first, then most viewers; Men/Women filter.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    const t = n => ({ name: n }), mk = (id, a, c, x) => ({ id, name: a + ' vs ' + c, teams: [t(a), t(c)], ...(x || {}) });
    const L = [mk('a', 'Australia', 'England'), mk('b', 'Kenya', 'Uganda'), mk('c', 'India', 'Pakistan'), mk('d', 'India Women', 'England Women'), mk('e', 'Oman', 'Nepal')];
    UI.iso = 'IN'; UI.vw = { b: 90, e: 10 }; UI.mwf = 'all';
    const all = mwRank(L).map(m => m.id).join('');
    UI.mwf = 'women'; const w = mwRank(L).map(m => m.id).join('');
    UI.mwf = 'men'; const m = mwRank(L).map(m => m.id).join('');
    UI.iso = 'ZZ'; UI.mwf = 'all'; const noCountry = mwRank(L).map(m => m.id).join('');
    return { all, w, m, noCountry };
  });
  ok(r.all.slice(0, 2) === 'cd', 'India matches first: ' + r.all);
  ok(r.all.slice(2, 4) === 'be', 'then by viewers: ' + r.all);
  ok(r.w === 'd', 'women only: ' + r.w);
  ok(!r.m.includes('d') && r.m.length === 4, 'men only: ' + r.m);
  ok(r.noCountry.slice(0, 2) === 'be', 'viewers first without country: ' + r.noCountry);
  ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: home rank');
})();
