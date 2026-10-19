// Streaming modes card (camera / AI scene / hybrid) and the AI studio scene drawn from scoring data only.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m, 0, 'p0', 'p1', 'p11'); S.stream.mid = m.id;
    UI.view = 'stream'; render(); const t1 = document.getElementById('app').innerText; A.strMode({ v: 'ai' }); const t2 = document.getElementById('app').innerText;
    history.replaceState(null, '', '?scene=studio#overlay'); overlayHTML(); [4, 1, 6].forEach(r => ball(m, { r })); const html = overlayHTML();
    const d = document.createElement('div'); d.innerHTML = html; const out = { t1, t2, txt: d.textContent, raw: html.slice(0, 300), fx: (d.querySelector('.ovfx') || {}).innerText || '' };
    history.replaceState(null, '', location.pathname); out.plain = !/stu-/.test(overlayHTML()); return out;
  });
  ok(/Streaming mode/.test(r.t1) && /Camera/.test(r.t1) && /AI scene/.test(r.t1) && /Hybrid/.test(r.t1), 'modes card');
  ok(/cannot film or broadcast/.test(r.t1), 'honest note'); ok(/Open AI scene/.test(r.t2) && /scene=studio/.test(r.t2), 'AI mode: open scene + link');
  ok(/11-0/.test(r.txt) && /Player 1/.test(r.txt) && /Player 11/.test(r.txt) && /SIX/.test(r.txt), 'scene: ' + r.txt.slice(0, 200) + ' RAW ' + r.raw);
  ok(/SIX!/.test(r.fx), 'banner in AI scene: ' + r.fx); ok(r.plain, 'normal overlay unchanged without scene param'); ok(!errs.length, 'errors ' + errs.join(';'));
  await p.evaluate(() => { history.replaceState(null, '', '?scene=studio#overlay'); document.body.classList.add('ovpage'); const a = document.getElementById('app'); a.innerHTML = overlayHTML(); a.style.maxWidth = 'none'; a.style.padding = '0'; });
  await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/out/studio.png' });
  if (!process.exitCode) console.log('PASS: stream modes + AI scene'); await b.close();
})();
