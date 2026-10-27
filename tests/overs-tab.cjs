// Overs tab: with delivery records it lists every over as ball-by-ball lines plus the Over Summary card (bowler, timeline, totals, batsmen).
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 393, height: 900 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
 const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
 await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
  const B = (over, ball, runs, bat, extra) => Object.assign({ inning: 1, team: 'NZ A', over, ball, runs, total_runs: runs, bruns: runs, batsman: bat, bowler: 'Anshul Kamboj' }, extra || {});
  const bbb = [B(23, 1, 0, 'Daryl Mitchell'), B(23, 2, 1, 'Daryl Mitchell'), B(23, 3, 0, 'Tom Blundell'), B(24, 1, 4, 'Daryl Mitchell'), B(24, 2, 1, 'Daryl Mitchell', { wide: true, bruns: 0 }), B(24, 2, 0, 'Tom Blundell', { wicket: true, out: 'Tom Blundell', kind: 'bowled' })];
  UI.wm = { tab: 'ov', m: { id: 'q', name: 'NZ A vs IND A', started: true, ended: false, type: 'test', teams: [{ name: 'New Zealand A', short: 'NZ A' }, { name: 'India A', short: 'IND A' }], score: [{ inning: 'New Zealand A Inning 1', r: 96, w: 4, o: 24.2 }] }, mi: {}, sc: { scorecard: [{ inning: 'New Zealand A Inning 1', totals: { R: 96, W: 4, O: 24.2 }, batting: [], bowling: [{ bowler: { id: 'k', name: 'Anshul Kamboj' }, o: 7.4, m: 2, r: 29, w: 0 }] }] }, bb: { bbb, source: 'test' } }; UI.view = 'wmatch'; render(); });
 await p.waitForTimeout(300); const x = await p.evaluate(() => document.getElementById('app').innerText);
 ok(/Over 25 Summary/.test(x) && /Over 24 Summary/.test(x), 'both overs have summaries'); ok(/BOWLER/.test(x) && /OVER TIMELINE/.test(x) && /BATSMEN IN THIS OVER/.test(x), 'summary parts'); ok(/Anshul Kamboj to Tom Blundell, OUT/.test(x), 'ball lines in the Overs tab'); ok(/Wd/.test(x), 'wide shown as its own delivery');
 ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fits'); ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: overs tab'); })();
