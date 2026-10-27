// Graphs without ball-by-ball (finished match, scorecard only): total match overview, all-batters bars, bowler bars.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 430, height: 900 } }), errs=[]; p.on('pageerror', e => errs.push(e.message));
 await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
 const bat = (n, r, bl, f, s, t) => ({ batsman: { id: n, name: n }, r, b: bl, '4s': f, '6s': s, 'dismissal-text': t });
 await p.evaluate(([bat0]) => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
  const bt = (n, r, bl, f, s, t) => ({ batsman: { id: n, name: n }, r, b: bl, '4s': f, '6s': s, 'dismissal-text': t });
  UI.wm = { tab: 'gr', m: { id: 'q', name: 'India Women vs Zimbabwe Women', started: true, ended: true, status: 'India Women won by 121 runs', type: 'odi', overs: 50, teams: [{ name: 'India Women', short: 'INDW' }, { name: 'Zimbabwe Women', short: 'ZIMW' }], score: [{ inning: 'India Women Inning 1', r: 328, w: 6, o: 50 }, { inning: 'Zimbabwe Women Inning 1', r: 207, w: 10, o: 48.5 }] }, mi: {}, sc: { scorecard: [
   { inning: 'India Women Inning 1', batting: [bt('S Mandhana', 90, 80, 10, 2, 'c X b Y'), bt('H Kaur', 60, 50, 5, 1, 'not out')], bowling: [{ bowler: { id: 'z', name: 'Z One' }, o: 10, m: 0, r: 60, w: 2, eco: 6 }] },
   { inning: 'Zimbabwe Women Inning 1', batting: [bt('L Zim', 40, 60, 3, 0, 'b A')], bowling: [{ bowler: { id: 'k', name: 'K Ind' }, o: 10, m: 1, r: 30, w: 4, eco: 3 }] }] }, bb: null }; UI.view = 'wmatch'; render(); }, [0]);
 await p.waitForTimeout(300);
 const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
 let x = await p.evaluate(() => document.getElementById('app').innerText);
 ok(/TOTAL MATCH OVERVIEW/i.test(x) && /Run rate/.test(x) && /Best bowler/.test(x), 'overview'); ok(/ALL BATTERS/i.test(x) && /S Mandhana/.test(x), 'all batters bars');
 await p.evaluate(() => A.grTab({ v: 'bowl' })); await p.waitForTimeout(200); x = await p.evaluate(() => document.getElementById('app').innerText);
 ok(/Z ONE · 10-0-60-2/i.test(x) && /60 runs/.test(x) && /Economy/.test(x), 'bowler bar without ball data');
 ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: graphs scorecard-only'); })();
