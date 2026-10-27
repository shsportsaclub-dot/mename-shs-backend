// Heroes 11 hub (points only): home cards, Live/Final Top 11 from the scorecard, player breakup, team-wise, overs-wise, graph, points system; no money.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 430, height: 1000 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
 const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
 await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
  const bt = (n, r, bl, f, s, t) => ({ batsman: { id: n, name: n }, r, b: bl, '4s': f, '6s': s, 'dismissal-text': t });
  const bbb = []; for (let o = 0; o < 20; o++) for (let k = 1; k <= 6; k++) bbb.push({ inning: 1, over: o, ball: k, runs: (o + k) % 5 === 0 ? 4 : (o + k) % 3 === 0 ? 0 : 1, bruns: (o + k) % 5 === 0 ? 4 : (o + k) % 3 === 0 ? 0 : 1, batsman: o % 2 ? 'S Mandhana' : 'H Kaur', bowler: 'K Ind', wicket: o === 3 && k === 2, out: 'S Mandhana', kind: 'caught', fielder: 'L Zim' });
  UI.wm = { tab: 'sh11', m: { id: 'q', name: 'India Women vs Zimbabwe Women', started: true, ended: true, status: 'India Women won by 121 runs', type: 't20', overs: 20, teams: [{ name: 'India Women', short: 'INDW' }, { name: 'Zimbabwe Women', short: 'ZIMW' }], score: [{ inning: 'India Women Inning 1', r: 200, w: 4, o: 20 }, { inning: 'Zimbabwe Women Inning 1', r: 90, w: 10, o: 15 }] }, mi: {}, sc: { scorecard: [
   { inning: 'India Women Inning 1', batting: [bt('S Mandhana', 90, 50, 10, 2, 'c L Zim b K Ind'), bt('H Kaur', 0, 3, 0, 0, 'b Z One'), bt('R Ghosh', 30, 12, 2, 2, 'not out')], bowling: [{ bowler: { id: 'z', name: 'Z One' }, o: 4, m: 0, r: 40, w: 1, eco: 10 }] },
   { inning: 'Zimbabwe Women Inning 1', batting: [bt('L Zim', 40, 30, 3, 0, 'b A'), bt('M Zim', 5, 9, 0, 0, 'c S Mandhana b K Ind')], bowling: [{ bowler: { id: 'k', name: 'K Ind' }, o: 4, m: 1, r: 14, w: 4, eco: 3.5 }] }] }, bb: { bbb } }; UI.view = 'wmatch'; render(); });
 const t = () => p.evaluate(() => document.getElementById('app').innerText);
 let x = await t(); ok(/My Heroes 11/.test(x) && /Final Top 11/.test(x) && /Team-wise Top 11/.test(x) && /Overs-wise Impact/.test(x) && /Points Graph/.test(x) && /Points System/.test(x), 'home cards'); ok(!/₹|entry fee|prize|contest/i.test(x.replace(/No money, no entry fee, no prizes\./, '')), 'no money wording');
 await p.locator('.h16h [data-v="live"]').click(); x = await t(); ok(/S Mandhana/.test(x) && /K Ind/.test(x), 'top 11 lists players');
 await p.locator('.h16r', { hasText: 'K Ind' }).first().click(); x = await t(); ok(/Wickets/.test(x) && /4 × 25/.test(x) && /Maidens/.test(x) && /Total points/.test(x), 'breakup ' + x.slice(0, 300));
 ok(/Catch/.test(await (async () => { await p.evaluate(() => A.h16go({ v: 'live' })); await p.locator('.h16r', { hasText: 'L Zim' }).first().click(); return t(); })()), 'catch credited to fielder from dismissal text');
 await p.evaluate(() => { A.h16go({ v: 'live' }); A.h16lv({ v: 'best' }); }); x = await t(); ok(/Best valid Heroes 11 follows/.test(x) && await p.locator('.h16r').count() <= 11, 'best valid 11');
 await p.evaluate(() => A.h16go({ v: 'cmp' })); x = await t(); ok(/not saved a team/.test(x), 'compare asks for a team first');
 await p.evaluate(() => { const r = shRoster(UI.wm); shElevenSelections['q'] = { ids: r.slice(0, 5).map(z => z.id), c: r[0].id, vc: r[1].id }; A.h16go({ v: 'cmp' }); }); x = await t(); ok(/My team points/.test(x) && /Top 11 points/.test(x) && /\(C\)/.test(x), 'my team vs top 11 ' + x.slice(0, 200));
 await p.evaluate(() => { delete shElevenSelections['q']; A.h16go({ v: 'team' }); }); x = await t(); ok(/India Women|INDW/.test(x), 'team-wise'); await p.locator('.h16s button').nth(1).click(); ok(await p.locator('.h16r').count() > 0, 'team filter');
 await p.evaluate(() => A.h16go({ v: 'ovr' })); x = await t(); ok(/Powerplay \(1-6\)/.test(x) && /Death \(16-20\)/.test(x) && await p.locator('.h16r').count() > 0, 'overs-wise');
 await p.evaluate(() => A.h16go({ v: 'gr' })); ok(await p.locator('.h16 svg polyline').count() >= 2, 'graph');
 await p.evaluate(() => A.h16go({ v: 'rules' })); x = await t(); ok(/Wicket \(not run out\)/.test(x) && /\+25/.test(x), 'rules');
 ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fits'); await p.evaluate(() => A.h16go({ v: 'live' })); await p.screenshot({ path: '/tmp/h16.png' });
 ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: heroes 11 hub'); })();
