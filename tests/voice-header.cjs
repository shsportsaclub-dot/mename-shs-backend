// Replica live view keeps voice commentary: speaker toggle + language in header, tracker score updates are spoken once.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 780 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; S.settings.voice = true; S.settings.vlang = 'en'; window.__sp = []; speak = t => { window.__sp.push(t) };
    UI.wm = { m: { id: 'x', name: 'NED v OMAN', started: true, ended: false, type: 'odi', overs: 50, teams: [{ name: 'Netherlands', short: 'NED' }, { name: 'Oman', short: 'OMAN' }], score: [{ inning: 'Oman Inning 1', r: 83, w: 2, o: 18 }] }, mi: {}, sc: { scorecard: [] }, bb: { bbb: [], tracked: true, notes: [{ at: 1, text: 'Oman 77/2 to 80/2: 3 runs.' }] } }; UI.view = 'wmatch'; render();
    const o = { btn: !!document.querySelector('.rp [data-a="voice"]'), sel: !!document.querySelector('.rp select[data-c="vlang"]') };
    shWorldVoice(); o.first = window.__sp.length; UI.wm.bb.notes.push({ at: 2, text: 'Oman 80/2 to 83/2: 3 runs.' }); shWorldVoice(); o.second = window.__sp.slice(); shWorldVoice(); o.third = window.__sp.length;
    return o;
  });
  ok(r.btn && r.sel, 'voice controls in header'); ok(r.first === 0, 'first load silent'); ok(r.second.length === 1 && /83 for 2/.test(r.second[0]), 'new update spoken: ' + r.second); ok(r.third === 1, 'not repeated');
  await p.click('.rp [data-a="voice"]'); ok(await p.evaluate(() => S.settings.voice === false), 'toggle turns voice off');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: voice header');
})();
