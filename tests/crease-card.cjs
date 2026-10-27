// Live view fallback: at-the-crease and bowling cards from the scorecard when no deliveries exist.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(()=>{window.__legacyLive=1;document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='html{scroll-behavior:auto!important}';document.head.appendChild(s)})});
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    const o = {}, W = { m: { started: true, ended: false }, bb: null, sc: { scorecard: [{ inning: 'Team A Inning 1', batting: [
      { batsman: { name: 'Opener One' }, r: 31, b: 22, '4s': 4, '6s': 1, sr: '140.9', 'dismissal-text': 'c Fielder b Bowler' },
      { batsman: { name: 'Batter Live' }, r: 40, b: 28, '4s': 5, '6s': 2, sr: '142.8', 'dismissal-text': 'batting' },
      { batsman: { name: 'Batter Also' }, r: 7, b: 6, '4s': 1, '6s': 0, sr: '116.6', 'dismissal-text': 'batting' },
      { batsman: { name: 'Yet Man' }, r: 0, b: 0, 'dismissal-text': 'yet to bat' }], bowling: [{ bowler: { name: 'Bowler X' }, o: '3', m: 0, r: 24, w: 1, eco: '8.0' }], fow: [] }] } };
    const h = shCreaseCard(W), d = document.createElement('div'); d.innerHTML = h; const t = d.innerText;
    o.batters = /Batter Live/.test(t) && /Batter Also/.test(t) && !/Yet Man/.test(t); o.last = /Last wkt/.test(t) && /Opener One/.test(t); o.bowl = /Bowler X/.test(t) && /1-24/.test(t); o.note = /no ball-by-ball feed/i.test(t);
    const rows = [[0,1],[0,0],[0,4],[0,6],[0,0],[0,1],[1,2],[1,0],[1,4],[1,1]].map((x, i) => ({ inning: 1, over: x[0], ball: i % 6 + 1, runs: x[1], batsman: 'Batter Live', bowler: 'Bowler X' }));
    const W2 = { m: { started: true, ended: false, overs: 20 }, bb: { bbb: rows }, sc: { scorecard: [{ inning: 'Team A Inning 1', totals: { R: 19, W: 1, O: '1.4' }, batting: W.sc.scorecard[0].batting, bowling: W.sc.scorecard[0].bowling }] } };
    const d2 = document.createElement('div'); d2.innerHTML = shCreaseCard(W2); const t2 = d2.innerText;
    o.strip = d2.querySelectorAll('.cx3o .cx3b').length >= 6 && /Over 2/.test(t2) && /CRR/.test(t2) && /= 7/.test(t2); o.big = !!d2.querySelector('.cx3big');
    const W3 = JSON.parse(JSON.stringify(W2)); W3.sc.scorecard.unshift({ inning: 'Team B Inning 1', totals: { R: 150, W: 6, O: '20' }, batting: [], bowling: [] }); W3.bb = null;
    const d3 = document.createElement('div'); d3.innerHTML = shCreaseCard(W3); o.chase = /Target:\s*151/.test(d3.innerText) && /need 132 runs in 110 balls/.test(d3.innerText) && /RRR/.test(d3.innerText);
    const W4 = JSON.parse(JSON.stringify(W2)); W4.sc.scorecard[0].batting[1].on = true; const d4 = document.createElement('div'); d4.innerHTML = shCreaseCard(W4);
    o.arena = /ON STRIKE/.test(d4.innerText) && d4.querySelectorAll('.ar5act button').length === 5 && d4.querySelectorAll('.ar5row').length >= 6 && /Over 2 \(R: 7\)/.test(d4.innerText);
    o.none = /—-—/.test(shCreaseCard({ m: {}, sc: { scorecard: [] } }));
    o.panel = typeof shPulsePanel === 'function'; return o;
  });
  for (const k of Object.keys(r)) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: crease card');
})();
