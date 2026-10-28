const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const set = r => p.evaluate(r => { const W = UI.wm; W.m.score = [{ inning: 'South Africa Inning 1', r, w: 3, o: 20.1 }]; W.sc.scorecard[0].totals = { R: r, W: 3, O: 20.1 }; render(); }, r);
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'qa1', name: 'RSA v AUS', started: true, ended: false, type: 't20', overs: 20, teams: [{ name: 'South Africa', short: 'RSA' }, { name: 'Australia', short: 'AUS' }], score: [] }, mi: {}, bb: null,
      sc: { scorecard: [{ inning: 'South Africa Inning 1', batting: [{ batsman: { id: 'b1', name: 'Simon Harmer' }, r: 5, b: 7, '4s': 0, '6s': 0, 'dismissal-text': 'batting' }, { batsman: { id: 'b2', name: 'A Two' }, r: 5, b: 7, '4s': 0, '6s': 0, 'dismissal-text': 'batting' }], bowling: [], totals: { R: 100, W: 3, O: 20.1 } }] } };
    UI.view = 'wmatch'; UI.wm.tab = 'live'; render(); });
  await set(100); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.hero .sh-act .bw svg') && !document.querySelector('.sh-act .ev')), 'strip visible, no event yet');
  await set(104); await p.waitForTimeout(300);
  ok(await p.evaluate(() => /FOUR/.test((document.querySelector('.sh-act .ev') || {}).textContent || '')), 'four detected from score change');
  await set(110); ok(await p.evaluate(() => /SIX/.test((document.querySelector('.sh-act .ev') || {}).textContent || '')), 'six detected');
  const img = await p.evaluate(() => { const i = document.querySelector('.sh-act'); const h = cbpImg('', 'Simon Harmer'); return { svg: decodeURIComponent(h).includes('<path d="M22 62'), honest: h.includes('not supplied') } });
  ok(img.svg && img.honest, 'missing photo -> SH helmet avatar with honest label');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: live action strip + avatars');
})();
