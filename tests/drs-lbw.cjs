// LBW review panel: decisions follow the ICC protocol (pitching, impact, wickets, umpire's call).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const L = (o) => p.evaluate(o => shLbw({ orig: 'not', pitch: 'line', impact: 'line', wickets: 'hit', shot: 'no', far: false, hv: false, ...o }), o);
  ok((await L({})).res === 'OUT', 'plumb: out');
  ok((await L({ orig: 'out' })).changed === false, 'out stays out');
  ok((await L({ pitch: 'leg', orig: 'out' })).res === 'NOT OUT' && (await L({ pitch: 'leg', orig: 'out' })).changed, 'outside leg: overturned to not out');
  ok((await L({ impact: 'off', shot: 'yes' })).res === 'NOT OUT', 'outside off with shot: not out');
  ok((await L({ impact: 'off', shot: 'no' })).res === 'OUT', 'outside off, no shot: out');
  ok((await L({ impact: 'leg' })).res === 'NOT OUT', 'impact outside leg: not out');
  ok((await L({ wickets: 'miss', orig: 'out' })).res === 'NOT OUT', 'missing: not out');
  const uc = await L({ wickets: 'uc', orig: 'out' }); ok(uc.res === "UMPIRE'S CALL" && uc.call && /OUT/.test(uc.why.join(' ')), 'umpire\'s call keeps original');
  ok((await L({ impact: 'part' })).res === "UMPIRE'S CALL", 'impact part: umpire\'s call');
  ok((await L({ far: true })).res === "UMPIRE'S CALL", '300 cm: umpire\'s call');
  ok((await L({ hv: true })).res === "UMPIRE'S CALL", 'half-volley rule: umpire\'s call');
  ok((await L({ far: true, wickets: 'miss' })).res === 'NOT OUT', 'missing beats distance');
  const r = await p.evaluate(() => { UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.view = 'drs'; render(); const t1 = document.getElementById('app').innerText; A.drsSet({ k: 'wickets', v: 'miss' }); const t2 = document.getElementById('app').innerText; return { t1, t2, fit: document.documentElement.scrollWidth <= innerWidth, menu: JSON.stringify(MENU2).includes('LBW review') } });
  ok(/OUT/.test(r.t1) && /NOT OUT/.test(r.t2), 'panel updates'); ok(r.fit, 'fits'); ok(r.menu, 'in menu'); ok(!errs.length, 'errors ' + errs.join(';'));
  await p.screenshot({ path: '/tmp/out/drs.png' });
  if (!process.exitCode) console.log('PASS: LBW review panel'); await b.close();
})();
