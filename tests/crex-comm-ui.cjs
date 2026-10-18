// CREX-style commentary: works for any match that has delivery records (not tied to one fixture); fits 320px.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const w of [320, 412]) {
    const p = await b.newPage({ viewport: { width: w, height: 760 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const mk = (inn, o, ball, runs, extra = {}) => ({ inning: inn, team: inn === 1 ? 'Perth Scorchers Women' : 'Sydney Sixers Women', over: o, ball, runs, total_runs: runs, bruns: runs, batsman: 'Beth Mooney', bowler: 'Ella Hayward', ...extra });
      const bbb = [mk(1, 0, 1, 0), mk(1, 0, 2, 4), mk(1, 0, 3, 1, { wide: true, bruns: 0 }), mk(1, 0, 4, 0, { wicket: true, out: 'Beth Mooney', kind: 'bowled' }), mk(1, 0, 5, 6), mk(2, 0, 1, 2, { batsman: 'Ellyse Perry', bowler: 'Amanda Wellington' })];
      const W = { m: { name: 'Scorchers v Sixers', started: true, ended: false, type: 't20', teams: [{ name: 'Perth Scorchers Women' }, { name: 'Sydney Sixers Women' }], score: [] }, sc: { scorecard: [] }, bb: { bbb, source: 'x' } };
      const h = cbpBbb(W); const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d);
      return { h, over: document.documentElement.scrollWidth <= innerWidth + 1, chips: d.querySelectorAll('.shc-h .shc').length, ovs: d.querySelectorAll('.shc-ov').length };
    });
    const t = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const ok = (c, m) => { if (!c) { console.error('FAIL', w, m); process.exitCode = 1; } };
    ok(r.ovs === 2, 'two over cards (one per innings): ' + r.ovs); ok(r.chips === 6, 'chips ' + r.chips);
    ok(/Perth Scorchers Women · Over 1/.test(t(r.h)) && /Over 1/.test(t(r.h)), 'headers');
    ok(r.over, 'no horizontal overflow at ' + w);
    if (w === 320) { await p.evaluate(() => { document.querySelectorAll('body > *').forEach(e => { if (!e.querySelector || !e.querySelector('.shc-ov')) e.style.display = 'none'; }); document.body.style.background = '#0b1020'; }); await p.screenshot({ path: '/tmp/out/crex320.png' }); }
    await p.close();
  }
  if (errs.length) { console.error('page errors', errs); process.exitCode = 1; }
  if (!process.exitCode) console.log('PASS: CREX-style commentary, any match, 320/412px');
  await b.close();
})();
