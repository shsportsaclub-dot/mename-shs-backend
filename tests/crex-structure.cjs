// Sticky score strip (score, CRR, toss) on every tab + commentary filters (All / Highlights / Overs / Wickets).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 780 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const mk = (o, ball, runs, extra = {}) => ({ inning: 1, team: 'Nepal', over: o, ball, runs, total_runs: runs, bruns: runs, batsman: 'D Khanal', bowler: 'M Ali', ...extra });
    const bbb = [mk(0, 1, 0), mk(0, 2, 4), mk(0, 3, 1), mk(0, 4, 0, { wicket: true, out: 'D Khanal', kind: 'bowled' }), mk(0, 5, 6), mk(0, 6, 2), mk(1, 1, 1), mk(1, 2, 0)];
    UI.wm = { m: { id: 'qz1', name: 'NEP v OMA', started: true, ended: false, type: 'odi', teams: [{ name: 'Nepal', short: 'NEP' }, { name: 'Oman', short: 'OMA' }], score: [{ inning: 'Nepal Inning 1', r: 103, w: 3, o: 26.1 }] }, mi: { tossWinner: 'Nepal', tossChoice: 'bat' }, sc: { scorecard: [] }, bb: { bbb, source: 'x' }, tab: 'cm' };
    UI.view = 'wmatch'; render(); const o = {};
    const app = () => document.getElementById('app'), vis = sel => [...app().querySelectorAll(sel)].filter(e => e.offsetParent !== null).length;
    o.strip = (app().querySelector('.sh-strip') || {}).innerText || '';
    o.stripSticky = getComputedStyle(app().querySelector('.cbp-h')).position; o.stripInHead = !!app().querySelector('.cbp-h .sh-strip');
    o.all = vis('.sh-pulse-delivery'); A.cmF({ v: 'hl' }); o.hl = vis('.sh-pulse-delivery'); A.cmF({ v: 'w' }); o.w = vis('.sh-pulse-delivery'); A.cmF({ v: 'ov' }); o.ov = vis('.sh-pulse-delivery'); o.ovHeads = vis('.shc-ov');
    A.wmTab({ v: 'sc' }); o.strip2 = !!app().querySelector('.sh-strip'); o.fit = document.documentElement.scrollWidth <= innerWidth + 1;
    return o;
  });
  ok(/NEP 103\/3/.test(r.strip) && /CRR\s*3\.94/.test(r.strip) && /Toss\s*Nepal \(bat\)/.test(r.strip), 'strip: ' + r.strip); ok(r.stripInHead && r.stripSticky === 'sticky', 'strip lives in the sticky header');
  ok(r.all === 8 && r.hl === 3 && r.w === 1 && r.ov === 0 && r.ovHeads === 2, 'filters ' + JSON.stringify(r)); ok(r.strip2, 'strip on the scorecard tab too'); ok(r.fit, 'fits');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: strip + commentary filters');
})();
