// Commentary lines carry bowler, batter, runs and the fielder (catch / run out / stumping) from provider facts; nothing invented when the provider has no fielder.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(300);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const t = await p.evaluate(() => { const B = (ball, runs, bruns, x) => Object.assign({ inning: 1, team: 'A', over: 3, ball, runs, total_runs: runs, bruns, batsman: 'Tom Blundell', bowler: 'Anshul Kamboj' }, x || {});
    return cbpBbbList({ bbb: [B(1, 4, 4), B(2, 0, 0, { wicket: true, out: 'Tom Blundell', kind: 'caught', fielder: 'Ravi Jadeja' }), B(3, 0, 0, { wicket: true, out: 'Tom Blundell', kind: 'run out', fielder: 'KL Rahul' }), B(4, 0, 0, { wicket: true, out: 'Tom Blundell', kind: 'stumped', fielder: 'Rishabh Pant' }), B(5, 0, 0, { wicket: true, out: 'Tom Blundell', kind: '', fielder: 'Sai Kishore' }), B(6, 0, 0, { wicket: true, out: 'Tom Blundell', kind: '' })] }).map(x => x.txt).reverse(); });
  ok(/Anshul Kamboj to Tom Blundell, FOUR/.test(t[0]), t[0]);
  ok(/c Ravi Jadeja b Anshul Kamboj/.test(t[1]), t[1]); ok(/run out \(KL Rahul\)/.test(t[2]), t[2]); ok(/st Rishabh Pant b Anshul Kamboj/.test(t[3]), t[3]);
  ok(/Sai Kishore fielding/.test(t[4]) && !/caught|stumped| c /.test(t[4]), 'unknown kind not guessed: ' + t[4]); ok(/OUT! Tom Blundell out\./.test(t[5]), t[5]);
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: commentary fielder');
})();
