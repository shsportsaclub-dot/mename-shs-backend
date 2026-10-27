// Provider sometimes labels the chasing innings "TeamA,TeamB Inning N": it must resolve to the team that has not batted yet, so the score, status and tracker intervals name one team.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1138, height: 800 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
 const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
 await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
  UI.wm = { tab: 'ov', m: { id: 'ire', name: 'Namibia v Ireland', started: true, ended: false, status: 'Namibia,Ireland need 123 runs from 93 balls', type: 'odi', overs: 50, teams: [{ name: 'Ireland', short: 'IRE' }, { name: 'Namibia', short: 'NAM' }], score: [{ inning: 'Namibia Inning 1', r: 316, w: 7, o: 50 }, { inning: 'Namibia,Ireland Inning 1', r: 194, w: 5, o: 34.3 }] }, mi: {}, sc: { scorecard: [] }, bb: { bbb: [] } }; UI.view = 'wmatch'; render(); });
 await p.waitForTimeout(300); const x = await p.evaluate(() => document.getElementById('app').innerText);
 ok(/Ireland need 123 runs from 93 balls/.test(x) && !/Namibia,Ireland/.test(x), 'status names one team'); ok(/194\/5/.test(x) && !/Yet to bat/.test(x), 'chasing team shows its score');
 ok(await p.evaluate(() => getComputedStyle(document.querySelector('.sh-pulse-empty')).backgroundColor !== 'rgb(255, 255, 255)'), 'empty state is dark');
 ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: inning label'); })();
