// A refresh must not reset zoom or broken-logo fallbacks (that flash is what looks like shaking)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'q', name: 'x', started: true, ended: false, type: 't20', teams: [{ name: 'Nowhere FC', short: 'NFC', img: 'https://invalid.example/x.png' }, { name: 'Other XI', short: 'OXI', img: 'https://invalid.example/y.png' }], score: [{ inning: 'Nowhere FC Inning 1', r: 96, w: 4, o: 15.4 }] }, mi: {}, sc: null, bb: null };
    UI.view = 'wmatch'; render(); });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(() => new Promise(res => { const rp = document.querySelector('.rp'); const z0 = rp && rp.style.zoom; const hid0 = document.querySelectorAll('#app [hidden]').length; let bad = 0;
    const mo = new MutationObserver(l => l.forEach(m => { if (m.attributeName === 'style' && m.target.classList.contains('rp') && !m.target.style.zoom) bad++; if (m.attributeName === 'hidden') bad++ })); mo.observe(document.getElementById('app'), { subtree: true, attributes: true, attributeOldValue: true });
    UI.wm.m.score[0].r = 101; render(); render();
    setTimeout(() => { mo.disconnect(); res({ z0, z1: document.querySelector('.rp').style.zoom, hid0, hid1: document.querySelectorAll('#app [hidden]').length, bad }) }, 400) }));
  ok(res.z0 && res.z1 === res.z0, 'zoom kept ' + JSON.stringify(res)); ok(res.hid1 === res.hid0 && res.bad === 0, 'no hidden/zoom flip ' + JSON.stringify(res));
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: refresh does not reset zoom or logo fallback');
})();
