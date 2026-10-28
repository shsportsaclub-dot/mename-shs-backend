const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const T = (a, t) => ({ at: 1, inning: 1, text: t });
    UI.wm = { m: { id: 'q', name: 'RSA v AUS', started: true, ended: false, type: 'test', teams: [{ name: 'South Africa', short: 'RSA' }, { name: 'Australia', short: 'AUS' }], score: [{ inning: 'South Africa Inning 1', r: 329, w: 10, o: 82.3 }] }, mi: {}, tab: 'gr',
      sc: { scorecard: [{ inning: 'South Africa Inning 1', batting: [], bowling: [], totals: { R: 329, W: 10, O: 82.3 } }] },
      bb: { bbb: [], notes: [T(0, 'South Africa 274/6 (67 ov) to 274/6 (67.3 ov): 0 runs from 3 legal balls.'), T(0, 'South Africa 274/6 (67.3 ov) to 280/6 (68.2 ov): 6 runs from 5 legal balls.'), T(0, 'South Africa 327/7 (80.4 ov) to 328/8 (81 ov): 1 run from 2 legal balls, 1 wicket.'), T(0, 'South Africa 329/9 (82.2 ov) to 329/10 (82.3 ov): 0 runs from 1 legal ball, 1 wicket.')] } };
    UI.view = 'wmatch'; render(); });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const a = document.getElementById('app'); const pl = [...a.querySelectorAll('polyline')].map(x => x.getAttribute('points').split(' ').length); return { pl, txt: a.innerText, sc: a.querySelector('nav button[data-a="wmScore"]')?.className } });
  ok(r.pl.some(n => n >= 4), 'graph has real points ' + r.pl); ok(/real score updates seen live, starting at 67 ov/.test(r.txt), 'honest note'); ok(!/only joins 0 to the final/.test(r.txt), 'no straight line note'); ok(await p.evaluate(() => document.querySelector('nav button[data-v="sh11"]').className) === 'sc-tab', 'Heroes 11 tab has no box, helmet icon only'); ok(!!(await p.evaluate(() => document.querySelector('nav button[data-v="sh11"] img'))), 'helmet icon kept');
  ok(r.sc === undefined, 'viewer has no Scorer tab ' + r.sc);
  await p.evaluate(() => { S.user.role = 'scorer'; render(); }); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => document.querySelector('nav button[data-a="wmScore"]'))), 'no Scorer tab even for scorer account');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: observed graph');
})();
