const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const run = async (w, bats) => { await p.evaluate(([w, bats]) => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'q' + w, name: 'RSA v AUS', started: true, ended: false, type: 'test', teams: [{ name: 'South Africa', short: 'RSA' }, { name: 'Australia', short: 'AUS' }], score: [{ inning: 'South Africa Inning 1', r: 329, w, o: 82.3 }] }, mi: {}, bb: null,
      sc: { scorecard: [{ inning: 'South Africa Inning 1', batting: bats.map((n, i) => ({ batsman: { id: 'b' + i, name: n }, r: 0, b: 7, '4s': 0, '6s': 0, 'dismissal-text': 'batting' })), bowling: [], totals: { R: 329, W: w, O: 82.3 } }] } };
    UI.view = 'wmatch'; UI.wm.tab = 'live'; render(); }, [w, bats]); await p.waitForTimeout(1200); const tx = await p.evaluate(() => document.getElementById('app').innerText); if (process.env.DBG) console.log(tx.slice(200, 1500)); return tx };
  let t = await run(10, ['Simon Harmer']); ok(/Innings complete/i.test(t) && /All out/.test(t), 'all out label');
  t = await run(6, ['Simon Harmer']); ok(/Not published by the data provider/.test(t) && /Second batter/.test(t), 'missing 2nd batter');
  t = await run(6, ['A One', 'B Two']); ok(!/Second batter/.test(t) && /A One/.test(t) && /B Two/.test(t), 'normal pair');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: one-batter states');
})();
