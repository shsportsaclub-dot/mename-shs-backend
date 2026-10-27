// Ball by Ball / Over Summary: every delivery (extras too), who faced, runs/wkts/extras, running total, batsmen in over, This Over chips.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 1400 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const B = (over, ball, runs, bruns, bat, extra) => Object.assign({ inning: 1, team: 'NZ A', over, ball, runs, total_runs: runs, bruns, batsman: bat, bowler: 'Anshul Kamboj' }, extra || {});
    const bbb = [B(23, 1, 0, 0, 'Daryl Mitchell'), B(23, 2, 1, 1, 'Daryl Mitchell'), B(23, 3, 0, 0, 'Tom Blundell'), B(23, 4, 0, 0, 'Tom Blundell'), B(23, 5, 0, 0, 'Tom Blundell'), B(23, 6, 0, 0, 'Tom Blundell'),
      B(24, 1, 0, 0, 'Daryl Mitchell'), B(24, 2, 1, 0, 'Daryl Mitchell', { wide: true }), B(24, 2, 4, 4, 'Tom Blundell'), B(24, 3, 1, 0, 'Tom Blundell', { noball: true }), B(24, 3, 0, 0, 'Tom Blundell', { wicket: true, out: 'Tom Blundell', kind: 'bowled' }), B(24, 4, 0, 0, 'Daryl Mitchell')];
    UI.wm = { m: { id: 'q', name: 'New Zealand A vs India A', started: true, ended: false, type: 'test', teams: [{ name: 'New Zealand A', short: 'NZ A' }, { name: 'India A', short: 'IND A' }], score: [{ inning: 'New Zealand A Inning 1', r: 96, w: 4, o: 24.4 }] }, mi: {}, sc: { scorecard: [{ inning: 'New Zealand A Inning 1', totals: { R: 96, W: 4, O: 24.4 }, batting: [{ batsman: { id: 'a', name: 'Tom Blundell' }, r: 8, b: 9, '4s': 1, '6s': 0, 'dismissal-text': 'batting' }, { batsman: { id: 'b', name: 'Daryl Mitchell' }, r: 37, b: 67, '4s': 5, '6s': 0, 'dismissal-text': 'batting' }], bowling: [{ bowler: { id: 'k', name: 'Anshul Kamboj' }, o: 7.4, m: 2, r: 29, w: 0, eco: 3.8 }] }] }, bb: { bbb, source: 'test' } };
    UI.view = 'wmatch'; UI.wm.tab = 'live'; render(); });
  await p.evaluate(() => { A.cmv({ v: 'bbb' }); });
  await p.waitForTimeout(300);
  const t = await p.evaluate(() => { const s = [...document.querySelectorAll('.ar12')]; return { n: s.length, txt: s.map(x => x.innerText.replace(/\s+/g, ' ')), cells: s.map(x => x.querySelectorAll('.a12c').length), fit: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(t.n >= 2, 'two summaries ' + t.n);
  ok(/Over 25 Summary/.test(t.txt[0]) && /Runs: 6/.test(t.txt[0]) && /Balls: 4/.test(t.txt[0]) && /Wickets: 1/.test(t.txt[0]) && /Extras: 2/.test(t.txt[0]), 'over 25 numbers ' + t.txt[0]);
  ok(/96-4 \(24\.4\)/.test(t.txt[0]), 'total ' + t.txt[0]);
  ok(t.cells[0] === 8, 'extras get own cells + 2 pending ' + t.cells[0]);
  ok(/Wd/.test(t.txt[0]) && /Nb/.test(t.txt[0]), 'Wd/Nb cells');
  ok(/Over 24 Summary/.test(t.txt[1]) && /Runs: 1/.test(t.txt[1]) && /Balls: 6/.test(t.txt[1]) && /90-3 \(24\.0\)/.test(t.txt[1]), 'over 24 ' + t.txt[1]);
  ok(/Batsmen in this over:/.test(t.txt[0]) && /This Over:/.test(t.txt[0]), 'footer');
  ok(t.fit, 'fits');
  await p.screenshot({ path: '/tmp/ovsum.png' });
  await p.evaluate(() => { A.cmv({ v: 'ovs' }); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('.rp .cl') && document.querySelectorAll('.ar12').length >= 2), 'summary-only mode');
  await p.evaluate(() => { A.cmv({ v: 'comm' }); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!document.querySelector('.rp .cl') && !document.querySelector('.ar12')), 'plain commentary mode');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: over summary');
})();
