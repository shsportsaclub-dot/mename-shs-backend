// A viewer on a provider match with no ball-by-ball: no "?" as the last ball, no scorer role badge.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 400, height: 860 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('ok', m); };
  const r = await p.evaluate(async () => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'V', role: 'viewer', kind: 'Fan' }; S.tok = 't'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'z', name: 'INDW v ZIMW', started: true, ended: false, type: 'odi', overs: 50, teams: [{ name: 'Zimbabwe Women', short: 'ZIMW' }, { name: 'India Women', short: 'INDW' }], score: [{ inning: 'Zimbabwe Women Inning 1', r: 55, w: 4, o: 17 }] }, mi: {}, tab: 'live',
      sc: { scorecard: [{ inning: 'Zimbabwe Women Inning 1', batting: [], bowling: [] }] }, bb: { bbb: [], notes: [{ at: Date.now(), inning: 1, text: 'Zimbabwe Women 52/4 (16 ov) to 55/4 (17 ov): 3 runs from 6 legal balls.' }] } };
    UI.view = 'wmatch'; render(); await new Promise(r => setTimeout(r, 600));
    const lb = document.querySelector('.lbs'); return { lb: lb ? lb.innerText.replace(/\s+/g, ' ') : null, badge: (document.getElementById('sbbfloat') || {}).innerText || '' }; });
  console.log(r);
  ok(r.lb && !/\?/.test(r.lb) && /BALL|OVER/.test(r.lb), 'hero shows BALL/OVER, never "?" as the last ball');
  ok(!/cannot score|Role:/.test(r.badge), 'no scorer role badge for a viewer');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close();
})();
