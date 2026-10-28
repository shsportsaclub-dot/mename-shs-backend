const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  const mk = async (url, w, h) => { const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html') + url); await p.waitForTimeout(400);
    await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
      const bat = (i, n, r, b) => ({ batsman: { id: 'b' + i, name: n }, r, b, '4s': 2, '6s': 1, 'dismissal-text': i > 1 ? 'c Smith b Starc' : 'batting' }), bw = (i, n) => ({ bowler: { id: 'w' + i, name: n }, o: 4, m: 0, r: 28, w: 1 });
      UI.wm = { m: { id: 'd1', name: 'RSA v AUS', started: true, ended: false, type: 't20', overs: 20, teams: [{ name: 'South Africa', short: 'RSA' }, { name: 'Australia', short: 'AUS' }], score: [{ inning: 'South Africa Inning 1', r: 156, w: 5, o: 18.2 }] }, mi: {}, bb: null, sc: { scorecard: [{ inning: 'South Africa Inning 1', batting: ['Aiden Markram', 'Quinton de Kock', 'Heinrich Klaasen'].map((n, i) => bat(i, n, 30 + i, 20)), bowling: ['Mitchell Starc', 'Pat Cummins'].map((n, i) => bw(i, n)), totals: { R: 156, W: 5, O: 18.2 } }] } };
      UI.view = 'wmatch'; UI.wm.tab = 'live'; render(); }); await p.waitForTimeout(500); return p; };
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  let p = await mk('?tv=1', 1920, 1080);
  ok(await p.evaluate(() => !!document.querySelector('.tvl .hero') && /Aiden Markram/.test(document.querySelector('.tvl').innerText) && /Mitchell Starc/.test(document.querySelector('.tvl').innerText) && !/Heinrich/.test(document.querySelector('.tvl').innerText.split('BOWLING')[0])), 'TV live: hero, 2 batters, bowlers');
  ok(await p.evaluate(() => !!document.querySelector('.hero .box .sh-act')), 'animation kept in TV hero');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll');
  await p.evaluate(() => { UI.wm.tab = 'sc'; render(); }); await p.waitForTimeout(300); ok(await p.evaluate(() => !document.querySelector('.tvl') && /Heinrich Klaasen/.test(document.body.innerText)), 'other tabs use the normal screen');
  p = await mk('', 390, 800); ok(await p.evaluate(() => !document.querySelector('.tvl') && !!document.querySelector('.hero')), 'phone unchanged');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: TV match screen');
})();
