// Commentary engine: wording comes only from recorded facts and totals worked out from them.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const st = engNew(), N = (bat, bowl, brun, tot, x = '', wk = null) => engText({ bat, bowl, brun, tot, x, wk }, st);
    const L = [N('A Khan', 'J Smith', 0, 0), N('A Khan', 'J Smith', 0, 0), N('A Khan', 'J Smith', 0, 0), N('A Khan', 'J Smith', 4, 4), N('A Khan', 'J Smith', 0, 2, 'wd'),
      N('A Khan', 'J Smith', 6, 6), N('B Rao', 'J Smith', 0, 0, '', { out: 'A Khan', kind: 'caught', fld: 'C Lee' }), N('B Rao', 'J Smith', 1, 1, 'b')];
    // provider rows without any commentary text (the engine writes it) and with provider text (kept as is)
    const rows = cbpBbbList({ bbb: [
      { inning: 1, over: 0, ball: 1, runs: 4, bruns: 4, batsman: 'G Harris', bowler: 'X One' },
      { inning: 1, over: 0, ball: 2, runs: 0, bruns: 0, wicket: true, out: 'G Harris', kind: 'lbw', batsman: 'G Harris', bowler: 'X One' },
      { inning: 2, over: 0, ball: 1, runs: 1, batsman: 'H Jones', bowler: 'Y Two' },
      { inning: 2, over: 0, ball: 2, runs: 2, batsman: 'H Jones', bowler: 'Y Two', commentary: 'Provider says hello' }] });
    return { L, rows: rows.map(x => x.txt) };
  });
  const need = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const [d1, , d3, f, wd, s6, w, bye] = r.L;
  need(/no run\./.test(d1) && !/dot balls/.test(d1), 'first dot is plain');
  need(/3 dot balls in a row/.test(d3), 'dot streak counted from recorded balls');
  need(/FOUR\. A Khan 4 \(4 balls\)/.test(f), 'four with batter total');
  need(/wide, 2 runs in all/.test(wd), 'wide');
  need(/SIX\. A Khan 10 \(5 balls\)/.test(s6), 'six: wide is not a ball faced');
  need(/OUT! A Khan c C Lee b J Smith\. A Khan made 10 \(5 balls\)\. Score 12\/1\. J Smith has 1 wicket\./.test(w), 'wicket line from recorded facts: ' + w);
  need(/1 bye\./.test(bye), 'bye');
  need(r.rows.some(t => /^Y Two to H Jones, 1 run\. H Jones 1 \(1 ball\)\.$/.test(t)), 'inning 2 has its own state: ' + r.rows.join(' | '));
  need(r.rows.some(t => /OUT! G Harris lbw b X One\. G Harris made 4 \(2 balls\)\. Score 4\/1/.test(t)), 'lbw: ' + r.rows.join(' | '));
  need(r.rows.includes('Provider says hello'), 'provider text kept');
  const bad = [...r.L, ...r.rows].filter(t => /covers|midwicket|gate|plumb|beaten|lofted|driven|glanced|launched/i.test(t));
  need(!bad.length, 'no invented shots: ' + bad.join(' | '));
  need(!errs.length, 'page errors ' + errs.join(';'));
  if (!process.exitCode) console.log('PASS: commentary engine uses only recorded facts, keeps innings separate, keeps provider text');
  await b.close();
})();
