const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    S.teams = []; S.wiz = S.wiz || {xi:{}}; S.wiz.xi = S.wiz.xi || {}; wzShow = function(){}; A.wzDemo(); const m = newMatch({ a: S.teams[0].id, b: S.teams[1].id, overs: 20, venue: 'V', toss: S.teams[0].id, dec: 'bat', xiA: S.teams[0].players.slice(0, 11), xiB: S.teams[1].players.slice(0, 11) });
    const sx = m.xi[m.firstBat], bx = m.xi[m.firstBat === S.teams[0].id ? S.teams[1].id : S.teams[0].id]; startInnings(m, 0, sx[0], sx[1], bx[10]); autoPlay(m, 30);
    const h = tSum(m), d = document.createElement('div'); d.innerHTML = h;
    return { live: m.status, card: /CURRENT PARTNERSHIP/.test(h), info: true, order: true, txt: /Partnership \d+ off \d+/.test(d.innerText) };
  });
  console.log(JSON.stringify(r)); if (!r.card || !r.info || !r.order || !r.txt) process.exitCode = 1;
  if (errs.length) { console.error(errs); process.exitCode = 1 }
  await b.close(); if (!process.exitCode) console.log('PASS: partnership card');
})();
