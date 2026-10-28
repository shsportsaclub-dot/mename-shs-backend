const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const N = (t, i) => ({ at: 1000000 + i * 60000, inning: 1, text: t });
    UI.wm = { m: { id: 'q', name: 'RSA v AUS', started: true, ended: false, type: 'test', teams: [{ name: 'South Africa', short: 'RSA' }, { name: 'Australia', short: 'AUS' }], score: [{ inning: 'South Africa Inning 1', r: 329, w: 10, o: 82.3 }] }, mi: {}, tab: 'live', bb: { bbb: [], notes: [N('South Africa 327/7 (80.4 ov) to 328/8 (81 ov): 1 run from 2 legal balls, 1 wicket.', 0), N('South Africa 328/8 (81 ov) to 328/8 (81.3 ov): 0 runs from 3 legal balls.', 1), N('South Africa 328/8 (81.3 ov) to 329/8 (82 ov): 1 run from 3 legal balls.', 2), N('South Africa 329/8 (82 ov) to 329/9 (82.1 ov): 0 runs from 1 legal ball, 1 wicket.', 3), N('South Africa 329/9 (82.1 ov) to 329/10 (82.3 ov): 0 runs from 2 legal balls, 1 wicket.', 4)] },
      sc: { scorecard: [{ inning: 'South Africa Inning 1', batting: [], bowling: [], totals: { R: 329, W: 10, O: 82.3 } }] } };
    UI.view = 'wmatch'; render(); });
  await p.waitForTimeout(1200);
  const t = await p.evaluate(() => document.getElementById('app').innerText);
  ok(/Over 83[^\n]*in progress/.test(t), 'over 83 in progress'); ok(/Over 82 \(R: 1\)/.test(t), 'over 82 R:1'); ok(/Over 81/.test(t), 'over 81 header');
  ok(t.indexOf('Over 83') < t.indexOf('Over 82') && t.indexOf('Over 82') < t.indexOf('Over 81'), 'newest over first');
  ok(/grouped by over, not individual deliveries/.test(t), 'honest note');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: score updates grouped by over');
})();
