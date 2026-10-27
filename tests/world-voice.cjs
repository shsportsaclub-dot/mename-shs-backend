const __np=async(b,o)=>{const p=await b.newPage(o);await p.addInitScript(()=>{window.__legacyLive=1});return p};
// Voice commentary for watched matches: voice bar shown, new deliveries spoken once in en/te/hi, first load silent.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await __np(b,{ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; S.settings.voice = true; S.settings.vlang = 'en';
    window.__sp = []; speak = t => { window.__sp.push(t) };
    const row = (o, b, runs, x = {}) => ({ inning: 1, over: o, ball: b, runs, batsman: 'A Opener', bowler: 'B Bowler', ...x });
    const m = { id: 'v1', name: 'A v B', type: 't20', started: true, ended: false, teams: [{ name: 'Alpha', short: 'ALP' }, { name: 'Beta', short: 'BET' }], score: [] };
    UI.wm = { m, tab: 'cm', bb: [row(0, 1, 1), row(0, 2, 0)] }; UI.view = 'wmatch'; render();
    const first = window.__sp.length, html = document.getElementById('app').innerText;
    UI.wm.bb = UI.wm.bb.concat([row(0, 3, 4)]); render(); const afterFour = window.__sp.slice(); render(); const again = window.__sp.length;
    S.settings.vlang = 'te'; UI.wm.bb = UI.wm.bb.concat([row(0, 4, 6)]); render(); const te = window.__sp[window.__sp.length - 1];
    S.settings.vlang = 'hi'; UI.wm.bb = UI.wm.bb.concat([row(0, 5, 0, { wicket: true })]); render(); const hi = window.__sp[window.__sp.length - 1];
    UI.wm.tab = 'sc'; UI.wm.bb = UI.wm.bb.concat([row(0, 6, 1)]); render(); const quiet = window.__sp.length;
    return { first, html, afterFour, again, te, hi, quiet, total: window.__sp.length, fit: document.documentElement.scrollWidth <= innerWidth };
  });
  ok(/Voice commentary/.test(r.html), 'voice bar on commentary'); ok(r.first === 0, 'first load silent');
  ok(r.afterFour.length === 1 && /Four/.test(r.afterFour[0]), 'new four spoken: ' + r.afterFour); ok(r.again === 1, 'not repeated on re-render');
  ok(/సిక్సర్/.test(r.te), 'telugu six: ' + r.te); ok(/विकेट/.test(r.hi), 'hindi wicket: ' + r.hi); ok(r.quiet === r.total, 'quiet on other tabs');
  ok(r.fit, 'fits'); ok(!errs.length, 'errors ' + errs.join(';'));
  if (!process.exitCode) console.log('PASS: world voice'); await b.close();
})();
