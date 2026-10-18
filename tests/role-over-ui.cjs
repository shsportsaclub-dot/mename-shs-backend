// Role-wise squads, SH Sports 11 phases, over table with totals and the line graph: generic, any match, 320px.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  const p = await b.newPage({ viewport: { width: 320, height: 760 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const pl = (n, role, bs) => ({ id: n.replace(/\W/g, ''), name: n, role, bowlingStyle: bs || '' });
    const sq = [{ teamName: 'Team Alpha', players: [pl('A Keeper', 'WK-Batsman'), pl('A Opener', 'Batsman'), pl('A Allround', 'Bowling Allrounder'), pl('A Pacer', 'Bowler', 'Right-arm fast-medium'), pl('A Spinner', 'Bowler', 'Slow left-arm orthodox'), pl('A Unknown', '')] }, { teamName: 'Team Beta', players: [pl('B Keeper', 'Wicketkeeper'), pl('B Bat', 'Top-order Batter'), pl('B Bowl', 'Bowler')] }];
    const mk = (inn, o, ball, runs, x = {}) => ({ inning: inn, over: o, ball, runs, total_runs: runs, bruns: runs, batsman: 'A Opener', bowler: 'B Bowl', ...x });
    const bbb = []; for (let o = 0; o < 3; o++) for (let k = 1; k <= 6; k++) bbb.push(mk(1, o, k, k === 3 ? 4 : 1, o === 1 && k === 6 ? { wicket: true, out: 'A Opener', kind: 'bowled', runs: 0, total_runs: 0, bruns: 0 } : {}));
    const base = { type: 't20', teams: [{ name: 'Team Alpha' }, { name: 'Team Beta' }], score: [{ inning: 'Team Alpha Inning 1', r: 30, w: 1, o: '3' }], id: 'zz1', name: 'Alpha v Beta' };
    const out = {};
    for (const ph of ['pre', 'live', 'end']) {
      const W = { m: { ...base, started: ph !== 'pre', ended: ph === 'end' }, sq, sc: { scorecard: ph === 'pre' ? [] : [{ inning: 'Team Alpha Inning 1', totals: { R: 30, W: 1, O: '3' }, batting: [{ batsman: { name: 'A Opener' }, r: 30, b: 18, '4s': 3, '6s': 0, 'dismissal-text': 'b B Bowl' }], bowling: [{ bowler: { name: 'B Bowl' }, o: '3', m: 0, r: 30, w: 1 }] }] }, bb: ph === 'pre' ? null : { bbb } };
      out[ph] = { eleven: shElevenHTML(W), t: ph };
      if (ph === 'live') { out.sq = cbpSquads(W); out.ov = cbpOverTab(W); out.gr = cbpGraphs(W); const d = document.createElement('div'); d.innerHTML = out.sq + out.ov + out.gr + shElevenHTML(W); document.body.appendChild(d); out.fit = document.documentElement.scrollWidth <= innerWidth + 1; }
    }
    return out;
  });
  const t = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  ok(/Wicketkeepers/.test(r.sq) && /Batters/.test(r.sq) && /All-rounders/.test(r.sq) && /Fast \/ medium bowlers/.test(r.sq) && /Spinners/.test(r.sq) && /Role not supplied/.test(r.sq), 'role groups: ' + t(r.sq).slice(0, 400));
  ok(/Team Alpha/.test(r.sq) && /Team Beta/.test(r.sq), 'both teams');
  ok(/Choose your own 11 from both full squads/.test(r.pre.eleven) && /Wicketkeepers/.test(r.pre.eleven), 'pre phase');
  ok(/live top 11/.test(r.live.eleven), 'live phase'); ok(/final top 11/.test(r.end.eleven), 'final phase');
  ok(/Over\s+Runs\s+Wkts\s+Total/.test(t(r.ov)) && /9\/0/.test(t(r.ov)) && /17\/1/.test(t(r.ov)) && /26\/1/.test(t(r.ov)), 'over totals: ' + t(r.ov).slice(0, 300));
  ok(/<polyline/.test(r.gr) && /line graph/.test(r.gr), 'line graph');
  ok(r.fit, 'fits 320px');
  ok(!errs.length, 'page errors ' + errs.join(';'));
  if (!process.exitCode) console.log('PASS: role squads, SH Sports 11 phases, over totals, line graph');
  await p.evaluate(() => { document.querySelectorAll('body > *').forEach(e => { if (!e.querySelector || !e.querySelector('.sh-ovt')) e.style.display = 'none'; }); document.body.style.background = '#0b1020'; document.body.style.color = '#fff' });
  await p.screenshot({ path: '/tmp/out/ov320.png' }); const g = await p.$('svg[aria-label*="line graph"]'); await g.evaluate(e => e.scrollIntoView()); await (await p.$('.sh-ovt')).screenshot({ path: '/tmp/out/ovt.png' }); await g.evaluateHandle(e => e.parentElement).then(h => h.asElement().screenshot({ path: '/tmp/out/ovg.png' }));
  await b.close();
})();
