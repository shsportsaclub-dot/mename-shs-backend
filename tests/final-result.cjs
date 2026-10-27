// Finished match: hero line shows the result (provider text, else computed from the two innings), never "ahead by".
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 430, height: 700 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
 const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
 const run = async (st, sc) => { await p.evaluate(([st, sc]) => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
  UI.wm = { m: { id: 'q', name: 'A v B', started: true, ended: true, status: st, type: 'odi', overs: 50, teams: [{ name: 'India Women', short: 'INDW' }, { name: 'Zimbabwe Women', short: 'ZIMW' }], score: sc }, mi: {}, sc: { scorecard: sc.map(x => ({ inning: x.inning, batting: [], bowling: [] })) }, bb: { bbb: [] } }; UI.view = 'wmatch'; UI.wm.tab = 'live'; render(); }, [st, sc]); await p.waitForTimeout(200); return p.evaluate(() => document.querySelector('.rp .hero .dls').innerText); };
 const I = (n, r, w) => ({ inning: n + ' Inning 1', r, w, o: 50 });
 ok(/won by 121 runs/.test(await run('India Women won by 121 runs', [I('India Women', 328, 6), I('Zimbabwe Women', 207, 10)])), 'provider text');
 ok(/India Women won by 121 runs/.test(await run('Match Ended', [I('India Women', 328, 6), I('Zimbabwe Women', 207, 10)])), 'computed runs win');
 ok(/Zimbabwe Women won by 3 wickets/.test(await run('Finished', [I('India Women', 200, 10), I('Zimbabwe Women', 201, 7)])), 'computed chase win');
 ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: final result');
})();
