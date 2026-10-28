// Refresh changes only the changed parts: nodes stay, scroll stays, typing is not lost
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 700 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const bbb = []; for (let o = 0; o < 6; o++) for (let k = 1; k <= 6; k++) bbb.push({ inning: 1, team: 'NZ A', over: o, ball: k, runs: k % 3, total_runs: k % 3, bruns: k % 3, batsman: 'Tom Blundell', bowler: 'Anshul Kamboj' });
    UI.wm = { m: { id: 'q', name: 'NZ A vs IND A', started: true, ended: false, type: 'test', teams: [{ name: 'New Zealand A', short: 'NZ A' }, { name: 'India A', short: 'IND A' }], score: [{ inning: 'New Zealand A Inning 1', r: 96, w: 4, o: 25.4 }] }, mi: {}, sc: null, bb: { bbb, source: 'test' } };
    UI.view = 'wmatch'; render(); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.body.style.minHeight='2500px'; window.scrollTo(0, 250); window.__mark = document.querySelector('#app main *'); document.querySelector('#app main').__m = 1; window.__hdr = document.querySelector('.hdr'); window.__hdr.__x = 1; });
  const y0 = await p.evaluate(() => scrollY);
  await p.evaluate(() => { UI.wm.m.score[0].r = 101; UI.wm.m.score[0].w = 5; render(); });
  const r = await p.evaluate(() => ({ same: document.querySelector('.hdr') === window.__hdr, main: !!document.querySelector('#app main').__m, y: scrollY, txt: document.getElementById('app').innerText.includes('101-5') }));
  ok(r.same && r.main, 'DOM nodes kept ' + JSON.stringify(r)); ok(r.txt, 'new score shown'); ok(Math.abs(r.y - y0) < 2, 'scroll kept ' + y0 + '->' + r.y);
  // many renders with no change must not touch nodes
  const cnt = await p.evaluate(() => { let n = 0; const mo = new MutationObserver(l => { n += l.length }); mo.observe(document.getElementById('app'), { subtree: true, childList: true, }); for (let i = 0; i < 5; i++) render(); return new Promise(res => setTimeout(() => { mo.disconnect(); res(n) }, 100)) });
  ok(cnt === 0, 'unchanged render adds/removes no nodes, got ' + cnt);
  // typing in a field survives a refresh
  await p.evaluate(() => { UI.view = 'settings'; render(); });
  const inp = await p.evaluate(() => { const i = document.querySelector('#app input[type=text], #app input:not([type])'); if (!i) return null; i.focus(); i.value = 'typing'; return true });
  if (inp) { await p.evaluate(() => render()); ok(await p.evaluate(() => document.activeElement.value === 'typing'), 'focused input keeps text'); }
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: smooth refresh');
})();
