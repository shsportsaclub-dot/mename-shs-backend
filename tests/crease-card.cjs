// Live view fallback: at-the-crease and bowling cards from the scorecard when no deliveries exist.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    const o = {}, W = { m: { started: true, ended: false }, bb: null, sc: { scorecard: [{ inning: 'Team A Inning 1', batting: [
      { batsman: { name: 'Opener One' }, r: 31, b: 22, '4s': 4, '6s': 1, sr: '140.9', 'dismissal-text': 'c Fielder b Bowler' },
      { batsman: { name: 'Batter Live' }, r: 40, b: 28, '4s': 5, '6s': 2, sr: '142.8', 'dismissal-text': 'batting' },
      { batsman: { name: 'Batter Also' }, r: 7, b: 6, '4s': 1, '6s': 0, sr: '116.6', 'dismissal-text': 'batting' },
      { batsman: { name: 'Yet Man' }, r: 0, b: 0, 'dismissal-text': 'yet to bat' }], bowling: [{ bowler: { name: 'Bowler X' }, o: '3', m: 0, r: 24, w: 1, eco: '8.0' }], fow: [] }] } };
    const h = shCreaseCard(W), d = document.createElement('div'); d.innerHTML = h; const t = d.innerText;
    o.batters = /Batter Live/.test(t) && /Batter Also/.test(t) && !/Yet Man/.test(t) && !/Opener One<br>/.test(h.split('Last wicket')[0] || ''); o.last = /Last wicket/.test(t) && /Opener One/.test(t); o.bowl = /Bowler X/.test(t) && /1\/24/.test(t); o.note = /no ball-by-ball feed/i.test(t);
    o.none = shCreaseCard({ m: {}, sc: { scorecard: [] } }) === '';
    o.panel = typeof shPulsePanel === 'function'; return o;
  });
  for (const k of Object.keys(r)) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: crease card');
})();
