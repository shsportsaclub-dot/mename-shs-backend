// Live screen matches the approved mock-up structure: title bar, hero score, Direct/Virtual live, partnership, bowler, ball-by-ball, 5 buttons, tab order.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const bbb = []; for (let o = 0; o < 3; o++) for (let k = 1; k <= 6; k++) bbb.push({ inning: 1, team: 'NZ A', over: o, ball: k, runs: k % 3, total_runs: k % 3, bruns: k % 3, batsman: 'Tom Blundell', bowler: 'Anshul Kamboj' });
    UI.wm = { m: { id: 'q', name: 'New Zealand A vs India A', started: true, ended: false, type: 'test', teams: [{ name: 'New Zealand A', short: 'NZ A' }, { name: 'India A', short: 'IND A' }], score: [{ inning: 'New Zealand A Inning 1', r: 96, w: 4, o: 25.4 }] }, mi: {}, sc: { scorecard: [{ inning: 'New Zealand A Inning 1', batting: [{ batsman: { id: 'a', name: 'Tom Blundell' }, r: 4, b: 5, '4s': 1, '6s': 0, 'dismissal-text': 'batting' }, { batsman: { id: 'b', name: 'Daryl Mitchell' }, r: 37, b: 67, '4s': 5, '6s': 0, 'dismissal-text': 'batting' }], bowling: [{ bowler: { id: 'k', name: 'Anshul Kamboj' }, o: 7.4, m: 2, r: 29, w: 0, eco: 3.8 }], part: { r: 5, b: 6 } }] }, bb: { bbb, source: 'test' } };
    UI.view = 'wmatch'; render(); });
  const t = await p.evaluate(() => { const a = document.getElementById('app'); return { txt: a.innerText, tabs: [...a.querySelectorAll('.rp nav button')].map(x => x.innerText.trim().toUpperCase()), fit: document.documentElement.scrollWidth <= innerWidth + 1, hero: !!a.querySelector('.rp .hero'), lw: 'none' } });
  ok(t.hero && /96-4/.test(t.txt), 'hero score'); ok(/CURRENT BOWLER/i.test(t.txt) && /Tom Blundell/.test(t.txt), 'cards'); ok(/OVER\s*\d+/i.test(t.txt), 'ball by ball');
  ok(['Commentary', 'Insights', 'Graphs', 'Player Stats', 'Series'].every(x => t.txt.includes(x)), '5 buttons'); ok(t.tabs.join().toUpperCase() === 'INFO,LIVE,SCORECARD,SQUADS,OVERS,GRAPHS', 'tab order ' + t.tabs); ok(t.fit, 'fits'); ok(t.lw === 'none', 'old live window head hidden');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: live mock-up layout');
})();
