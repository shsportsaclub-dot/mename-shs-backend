// Graphs tab: worm with wicket markers, team switch, batter picker (out batters included), bowler over-by-over with boundaries and wicket photos, no overflow.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 393, height: 852 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const bbt = []; const R = [0, 1, 4, 0, 2, 0, 6, 1]; for (let o = 0; o < 6; o++) for (let k = 1; k <= 6; k++) { const w = o === 2 && k === 3; bbt.push({ inning: 1, over: o, ball: k, runs: w ? 0 : R[(o + k) % 8], bruns: w ? 0 : R[(o + k) % 8], wicket: w, out: w ? 'Tim Seifert' : undefined, batsman: ['Tim Seifert', 'Finn Allen'][k % 2], bowler: 'Mukesh Kumar' }); }
    const bat = (n, r, bl, f, s, t = 'batting') => ({ batsman: { id: n, name: n }, r, b: bl, '4s': f, '6s': s, 'dismissal-text': t });
    UI.wm = { tab: 'gr', m: { id: 'g1', name: 'A v B', started: true, ended: false, type: 't20', teams: [{ name: 'Alpha', short: 'ALP' }, { name: 'Beta', short: 'BET' }], score: [{ inning: 'Alpha Inning 1', r: 70, w: 1, o: 6 }] }, mi: {}, sc: { scorecard: [{ inning: 'Alpha Inning 1', batting: [bat('Tim Seifert', 12, 14, 2, 0, 'c X b Mukesh Kumar'), bat('Finn Allen', 40, 22, 3, 3)], bowling: [{ bowler: { id: 'm', name: 'Mukesh Kumar' }, o: 6, m: 0, r: 70, w: 1 }] }] }, bb: { bbb: bbt, source: 't' } }; UI.view = 'wmatch'; render(); });
  const t = () => p.evaluate(() => document.getElementById('app').innerText);
  let x = await t(); ok(/RUNS COMPARISON/i.test(x) && /Tim Seifert/.test(x) && /Finn Allen/.test(x), 'worm + batters incl out');
  ok(await p.locator('.rp [data-a="grMk"]').count() === 1, 'wicket marker');
  ok(/OVER CHART/i.test(x) && await p.locator('.rp svg rect[fill="#ffffff"]').count() > 0 && await p.locator('.rp svg rect[fill="#e3122d"]').count() > 0 && await p.locator('.rp svg rect[fill="#1de9a0"]').count() > 0, 'over-by-over ball blocks: dot white, six green, wicket red');
  await p.locator('.rp h3:has-text("Over by over")').scrollIntoViewIfNeeded(); await p.locator('.rp h3:has-text("Over chart")').locator('xpath=..').screenshot({ path: '/tmp/ovc.png' });
  await p.locator('.rp [data-a="grMk"]').click(); x = await t(); ok(/Tim Seifert\s*out/i.test(x) && /b Mukesh Kumar/.test(x), 'marker info: ' + x.slice(x.indexOf('RUNS'), x.indexOf('RUNS') + 160));
  await p.locator('.rp [data-a="grSel"][data-v="Tim Seifert"]').click(); x = await t(); ok(/TIM SEIFERT — 12 \(14\)/i.test(x) && /c X b Mukesh Kumar/.test(x), 'out batter graph');
  await p.locator('.rp [data-a="grTab"][data-v="bowl"]').click(); x = await t(); ok(/MUKESH KUMAR · 6-0-70-1/i.test(x) && /\d+ R/.test(x), 'bowler overs');
  ok(await p.locator('.rp .gch .wp').count() === 1, 'wicket shows batter picture in bowler over');
  await p.locator('.rp [data-a="grTab"][data-v="man"]').click(); ok(/MANHATTAN/i.test(await t()), 'manhattan');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fits');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: graphs tab');
})();
