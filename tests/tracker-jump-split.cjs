// A provider jump that covers several overs must never claim a per-over total it cannot know,
// and must split into exact per-over figures when the bowling figures settle it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('ok', m); };
  const show = (notes, score) => p.evaluate(([notes, score]) => {
    window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'z', name: 'INDW v ZIMW', started: true, ended: false, type: 'odi', overs: 50, teams: [{ name: 'Zimbabwe Women', short: 'ZIMW' }, { name: 'India Women', short: 'INDW' }], score: [score] }, mi: {}, tab: 'live',
      sc: { scorecard: [{ inning: score.inning, batting: [], bowling: [] }] }, bb: { bbb: [], notes } };
    UI.view = 'wmatch'; render();
    const rib = document.querySelector('.ribn .rs');
    return { rib: rib ? [...rib.querySelectorAll('.rg')].map(g => g.innerText.replace(/\s+/g, ' ')) : null, comm: [...document.querySelectorAll('.ovh')].map(e => e.innerText.replace(/\s+/g, ' ')) };
  }, [notes, score]);

  // 1. the screenshot case: 18 balls, 8 runs, 1 wicket, no bowler figures (old notes)
  let r = await show([{ at: 1, inning: 1, text: 'Zimbabwe Women 24/2 (7.4 ov) to 32/3 (10.4 ov): 8 runs from 18 legal balls, 1 wicket.' }], { inning: 'Zimbabwe Women Inning 1', r: 32, w: 3, o: 10.4 });
  console.log(r.rib);
  ok(r.rib && r.rib.every(t => /= \?$/.test(t)), 'overs inside a multi-over jump show "= ?" instead of a false total');
  const t = await p.evaluate(() => window.shTrackBalls([{ at: 1, inning: 1, text: 'Zimbabwe Women 24/2 (7.4 ov) to 32/3 (10.4 ov): 8 runs from 18 legal balls, 1 wicket.' }]));
  ok(t.filter(x => x.unk && !x.miss).length === 18 && t.filter(x => x.last).length === 1, 'one group of 18 balls with one total');

  // 2. jump 9.2 -> 10.4 with two bowlers: over 10 (4 balls) by A for 0, over 11 (4 balls) by B for 5 and a wicket
  r = await show([{ at: 1, inning: 1, text: 'Zimbabwe Women 27/2 (9.2 ov) to 32/3 (10.4 ov): 5 runs from 8 legal balls, 1 wicket.', bowl: [{ k: 'A', b: 4, r: 0, w: 0 }, { k: 'B', b: 4, r: 5, w: 1 }] }], { inning: 'Zimbabwe Women Inning 1', r: 32, w: 3, o: 10.4 });
  console.log(r.rib);
  // both bowlers bowled 4 balls: cannot tell which over is whose -> must stay unknown
  ok(r.rib.every(t => /= \?$/.test(t)), 'equal ball counts stay unknown (no guessing)');

  // 3. jump 9.4 -> 10.4: A 2 balls (end of over 10) for 0, B 4 balls (over 11) for 5 + wicket -> exact
  r = await show([{ at: 1, inning: 1, text: 'Zimbabwe Women 27/2 (9.4 ov) to 32/3 (10.4 ov): 5 runs from 6 legal balls, 1 wicket.', bowl: [{ k: 'A', b: 2, r: 0, w: 0 }, { k: 'B', b: 4, r: 5, w: 1 }] }], { inning: 'Zimbabwe Women Inning 1', r: 32, w: 3, o: 10.4 });
  console.log(r.rib, r.comm);
  ok(r.rib.some(t => /^Over 10 .*0 0 = \?$/.test(t)), 'over 10: the two tracked balls are exact dots; earlier balls still unknown');
  ok(r.rib.some(t => /^Over 11 \? \? \? \? = 5$/.test(t)), 'over 11 gets its exact total 5');

  // 4. byes in the jump: bowler runs do not add up -> no split
  const s = await p.evaluate(() => window.shSplitJump([{ k: 'A', b: 2, r: 0, w: 0 }, { k: 'B', b: 4, r: 4, w: 1 }], 58, 6, 5, 1));
  ok(s === null, 'unassigned byes/leg byes block the split');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close();
})();
