const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  for (const vp of [{ width: 360, height: 700 }, { width: 412, height: 800 }, { width: 1280, height: 800 }]) {
    const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
    await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'scorer', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.view = 'home'; render(); });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const f = document.querySelector('.fabfloat'); if (!f) return null; const q = f.getBoundingClientRect(), n = document.querySelector('.bnav').getBoundingClientRect(); return { cx: Math.round(q.left + q.width / 2), w: innerWidth, above: q.bottom <= n.top + 2 } });
    ok(r && Math.abs(r.cx - r.w / 2) <= 2, vp.width + ' + button centred ' + JSON.stringify(r)); if (vp.width < 700) ok(r && r.above, vp.width + ' + button above the bar');
    await p.close();
  }
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: + button centred at the bottom');
})();
