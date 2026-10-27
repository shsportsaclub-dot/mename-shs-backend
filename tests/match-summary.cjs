// Finished match: live column becomes a Match Summary (result article, Man of the Match only when official, best bowler/batter, impact player) with ePaper + social share.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 430, height: 1100 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
 const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
 const set = mom => p.evaluate(mom => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.sumArts = [];
  const bt = (n, r, bl, f, s, t) => ({ batsman: { id: n, name: n }, r, b: bl, '4s': f, '6s': s, 'dismissal-text': t });
  UI.wm = { m: { id: 'q', name: 'India Women vs Zimbabwe Women, 2nd ODI', venue: 'Mumbai', started: true, ended: true, status: 'India Women won by 121 runs', type: 'odi', overs: 50, teams: [{ name: 'India Women', short: 'INDW' }, { name: 'Zimbabwe Women', short: 'ZIMW' }], score: [{ inning: 'India Women Inning 1', r: 328, w: 6, o: 50 }, { inning: 'Zimbabwe Women Inning 1', r: 207, w: 10, o: 48.5 }] }, mi: mom ? { playerOfTheMatch: mom } : {}, sc: { scorecard: [
   { inning: 'India Women Inning 1', batting: [bt('S Mandhana', 90, 80, 10, 2, 'c X b Y'), bt('H Kaur', 60, 50, 5, 1, 'not out')], bowling: [{ bowler: { id: 'z', name: 'Z One' }, o: 10, m: 0, r: 60, w: 2, eco: 6 }] },
   { inning: 'Zimbabwe Women Inning 1', batting: [bt('L Zim', 40, 60, 3, 0, 'b A')], bowling: [{ bowler: { id: 'k', name: 'K Ind' }, o: 10, m: 1, r: 30, w: 4, eco: 3 }] }] }, bb: null }; UI.view = 'wmatch'; UI.wm.tab = 'live'; render(); }, mom);
 await set(''); await p.waitForTimeout(300);
 let x = await p.evaluate(() => document.querySelector('.a15') ? document.querySelector('.a15').innerText : '');
 ok(/MATCH SUMMARY/.test(x) && /BEST BOWLER/.test(x) && /K Ind/.test(x) && /4\/30/.test(x) && /BEST BATTER/.test(x) && /S Mandhana/.test(x) && /IMPACT PLAYER/.test(x), 'summary awards ' + x);
 ok(!/MAN OF THE MATCH/.test(x), 'no invented man of the match');
 ok(await p.evaluate(() => !document.querySelector('.rp .bats') && !document.querySelector('.rp .bw')), 'live batter/bowler cards replaced');
 await set('Smriti Mandhana'); await p.waitForTimeout(300); x = await p.evaluate(() => document.querySelector('.a15').innerText); ok(/MAN OF THE MATCH/.test(x) && /Smriti Mandhana/.test(x), 'official MoM shown');
 await p.locator('.a15').screenshot({ path: '/tmp/sum.png' });
 await p.locator('.a15x [data-a="sumPaper"]').click(); ok(await p.evaluate(() => UI.sumArts.length === 1 && epArticles().some(a => a.id === UI.sumArts[0].id)), 'added to ePaper');
 ok(await p.evaluate(() => { let u = ''; window.open = x => { u = x; }; A.sumShare({ v: 'x' }); return /twitter\.com\/intent\/tweet/.test(u) && /Best%20bowler/.test(u); }), 'share link carries awards');
 ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: match summary'); })();
