// Rewards: XP, level, badges and daily quests come only from real counted activity.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    localStorage.clear(); UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; S.matches = []; S.fol = { teams: [], tours: [], players: [] };
    UI.view = 'rewards'; render(); const t0 = document.getElementById('app').innerText;
    localStorage.setItem('sh-poll-n', '3'); shTouch('votes'); S.fol.players.push('p1'); render(); const t1 = document.getElementById('app').innerText;
    return { t0, t1, st: shRewardStats(), calc: shRewardCalc(shRewardStats()), menu: JSON.stringify(MENU2).includes('Rewards'), fit: document.documentElement.scrollWidth <= innerWidth };
  });
  ok(/Level 1/.test(r.t0) && /0 XP/.test(r.t0) && /0\/8|Badges · 0\/8/.test(r.t0), 'fresh start is zero: ' + r.t0.slice(0, 160));
  ok(r.st.votes === 3 && r.st.today.votes === 1 && r.st.follows === 1 && r.st.streak === 1, 'counted: ' + JSON.stringify(r.st));
  ok(r.calc.xp === 3 * 10 + 5 + 2 * 25, 'xp = votes*10 + follow*5 + 2 badges*25 -> ' + r.calc.xp);
  ok(/First vote/.test(r.t1) && /Unlocked/.test(r.t1) && /✅ Vote in a poll today/.test(r.t1), 'badge + quest');
  ok(r.menu && r.fit, 'menu, fit'); ok(!errs.length, 'errors ' + errs.join(';'));
  await p.screenshot({ path: '/tmp/out/rw.png' });
  if (!process.exitCode) console.log('PASS: rewards'); await b.close();
})();
