const __np=async(b,o)=>{const p=await b.newPage(o);await p.addInitScript(()=>{window.__legacyLive=1;document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='html{scroll-behavior:auto!important}';document.head.appendChild(s)})});return p};
// Info tab shows head to head when the archive has it, and nothing when it does not.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await __np(b,{ viewport: { width: 360, height: 780 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; S.settings.apiUrl = 'http://x.test';
    const calls = []; window.fetch = async u => { calls.push(String(u)); const has = /Nepal/.test(u);
      return { json: async () => has ? { ok: true, n: 3, a: { name: 'Nepal', wins: 2 }, b: { name: 'Oman', wins: 1 }, nr: 0, recent: [{ d: '2026-01-01', t: 'odi', v: 'Ground', res: 'Nepal won by 5 wickets' }], from: '2024-01-01', to: '2026-01-01' } : { ok: true, n: 0 } } };
    const mk = n => ({ m: { id: 'h' + n, name: 'A v B', started: false, ended: false, type: 'odi', teams: n ? [{ name: 'Nepal' }, { name: 'Oman' }] : [{ name: 'Japan' }, { name: 'Fiji' }], score: [] }, mi: {}, sc: { scorecard: [] }, tab: 'live' });
    const o = {}, wait = () => new Promise(r => setTimeout(r, 150));
    UI.wm = mk(1); UI.view = 'wmatch'; render(); A.wmTab({ v: 'info' }); await wait(); render(); o.txt = document.getElementById('app').innerText; o.call = calls.find(c => /h2h/.test(c));
    UI.wm = mk(0); render(); A.wmTab({ v: 'info' }); await wait(); render(); o.none = document.getElementById('app').innerText; o.fit = document.documentElement.scrollWidth <= innerWidth + 1; return o;
  });
  ok(/head to head · 3 matches in the archive/i.test(r.txt) && /Nepal/.test(r.txt) && /Oman/.test(r.txt) && /Source: Cricsheet/.test(r.txt), 'h2h card: ' + r.txt.slice(-500)); ok(/type=odi/.test(r.call), 'format sent: ' + r.call);
  ok(!/head to head/i.test(r.none), 'nothing when archive has none'); ok(r.fit, 'fits'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: h2h');
})();
