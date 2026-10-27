// Live match page: tracker records, notes, SH Sports XI and players seen when the provider sends no squads.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 360, height: 740 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const bat = (n, r, b, f4 = 0, f6 = 0, t = 'batting') => ({ batsman: { name: n }, r, b, '4s': f4, '6s': f6, 'dismissal-text': t });
    const bow = (n, o, r, w, m = 0) => ({ bowler: { name: n }, o, m, r, w });
    const sc = { scorecard: [{ inning: 'Pakistan Inning 1', totals: { R: 166, W: 4, O: '30.5' }, batting: [bat('Fakhar Zaman', 16, 12, 2, 1, 'b Fernando'), bat('Babar Azam', 45, 50, 4, 0, 'c Mendis b Malinga'), bat('Saad Baig', 39, 40, 3, 2, 'lbw b Madushanka'), bat('Hasan Nawaz', 19, 31, 2, 0), bat('Salman Agha', 30, 32, 2, 0)], bowling: [bow('Dilshan Madushanka', 7, 38, 2), bow('Eshan Malinga', 6, 22, 2, 1), bow('Asitha Fernando', '5.5', 31, 1)] }] };
    const W = { m: { name: 'PAK v SL', started: true, ended: false, type: 'odi', teams: [{ name: 'Pakistan' }, { name: 'Sri Lanka' }], score: [{ inning: 'Pakistan Inning 1', r: 166, w: 4, o: '30.5' }] }, sc, mi: {}, sq: [], sqErr: '' };
    W.bb = { source: 'Scoring Heroes live tracker', tracked: true, bbb: [{ inning: 1, over: 30, ball: 6, runs: 4, bruns: 4, batsman: 'Hasan Nawaz', bowler: 'Asitha Fernando' }, { inning: 1, over: 31, ball: 1, runs: 1, total_runs: 1, wide: true, batsman: '', bowler: 'Dilshan Madushanka' }], notes: [{ at: Date.now(), inning: 1, text: 'Pakistan 166/4 (30.5 ov) to 171/4 (31.3 ov): 5 runs from 4 legal balls.' }] };
    const t = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return { cm: t(cbpBbb(W)), sq: t(cbpSquads(W)), info: t(cbpInfo(W)), el: t(shElevenHTML(W)), xi: shDreamXI(W).xi.map(x => x.name + ':' + x.pts) };
  });
  const need = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  need(/Asitha Fernando to Hasan Nawaz, FOUR\./.test(r.cm), 'tracker ball gets engine text: ' + r.cm.slice(0, 300));
  need(/Dilshan Madushanka, wide/.test(r.cm), 'wide without a batter');
  need(/Updates between checks/.test(r.cm) && /5 runs from 4 legal balls/.test(r.cm), 'notes shown');
  need(/Ball records: Scoring Heroes live tracker/.test(r.cm), 'tracker credit');
  need(/Observed participant/.test(r.sq) && /Hasan Nawaz/.test(r.sq), 'squads tab falls back to players seen + XI: ' + r.sq.slice(0, 200));
  need(/SH Sports 11/.test(r.el) && /Eshan Malinga/.test(r.el), 'SH Sports 11 tab lists our top XI: ' + r.el.slice(0, 160));
  need(r.xi.length === 8 && r.xi[0] === 'Eshan Malinga:62' && r.xi[1] === 'Babar Azam:53', 'XI ranked by points: ' + r.xi.join(', '));
  
  need(!errs.length, 'page errors ' + errs.join(';'));
  if (!process.exitCode) console.log('PASS: live tracker rows, notes, players seen and SH Sports XI');
  await b.close();
})();
