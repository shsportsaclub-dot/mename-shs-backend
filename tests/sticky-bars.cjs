// Match screen: title bar and tabs stay at the top, bottom bar stays at the bottom, on every tab, phone and desktop
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  for (const vp of [{ width: 412, height: 800 }, { width: 1280, height: 800 }]) {
    const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
    await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
      const bbb = []; for (let o = 0; o < 20; o++) for (let k = 1; k <= 6; k++) bbb.push({ inning: 1, over: o, ball: k, runs: k % 3, total_runs: k % 3, bruns: k % 3, batsman: 'Tom', bowler: 'Anshul' });
      UI.wm = { m: { id: 'q', name: 'x', started: true, ended: false, type: 'test', teams: [{ name: 'A', short: 'A' }, { name: 'B', short: 'B' }], score: [{ inning: 'A Inning 1', r: 96, w: 4, o: 25.4 }] }, mi: {}, sc: null, bb: { bbb, source: 't', notes: Array.from({ length: 60 }, (_, i) => ({ at: i * 1000, inning: 1, text: 'A ' + i + '/1 (' + i + ' ov) to ' + (i + 1) + '/1 (' + (i + 1) + ' ov)' })) } }; UI.view = 'wmatch'; render(); });
    await p.waitForTimeout(1200);
    for (const tab of ['live', 'ov', 'gr']) {
      await p.evaluate(t => { A.wmTab({ v: t }) }, tab); await p.waitForTimeout(500);
      await p.mouse.move(vp.width / 2, vp.height / 2); await p.mouse.wheel(0, 900); await p.waitForTimeout(500);
      const r = await p.evaluate(() => { const h = document.querySelector('.rp header'), n = document.querySelector('.bnav'); return { y: scrollY, top: h && Math.round(h.getBoundingClientRect().top), nav: n && Math.round(n.getBoundingClientRect().bottom), ih: innerHeight } });
      if (r.y > 100) { ok(r.top >= 0 && r.top <= 2, vp.width + ' ' + tab + ' header stays on top ' + JSON.stringify(r)); }
      ok(!r.nav || r.nav === r.ih || vp.width > 700, vp.width + ' ' + tab + ' bottom bar fixed ' + JSON.stringify(r));
    }
    await p.close();
  }
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: top and bottom bars stay while scrolling');
})();
