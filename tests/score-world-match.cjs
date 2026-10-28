// "Score this match" on a provider match: opening balance, scoring, reuse
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'scorer', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'afgzim1', name: 'Afghanistan v Zimbabwe', started: true, ended: false, type: 't20', teams: [{ name: 'Afghanistan', short: 'AFG' }, { name: 'Zimbabwe', short: 'ZIM' }], score: [{ inning: 'Zimbabwe Inning 1', r: 159, w: 8, o: 20 }, { inning: 'Afghanistan Inning 1', r: 145, w: 6, o: 17.3 }] }, mi: {}, sc: null, bb: null };
    UI.view = 'wmatch'; render(); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { A.wmTab({ v: 'info' }) }); await p.waitForTimeout(600);
  ok(await p.locator('nav button[data-a="wmScore"]').count() === 0, 'no Scorer tab in the bar');
  await p.click('[data-a="wmScore"]'); await p.waitForTimeout(300);
  ok(await p.locator('form[data-f="wsMake"]').count() === 1, 'form opens');
  await p.evaluate(() => { const f = document.querySelector('form[data-f="wsMake"]'); const set = (n, v) => { f.querySelector('[name="' + n + '"]').value = v };
    set('bat', '0'); set('inn', '2'); set('overs', '20'); set('r', '145'); set('w', '6'); set('o', '17.3'); set('target', '160');
    set('p0', 'A1\nA2\nA3\nA4\nA5\nA6\nA7\nA8\nA9\nA10\nA11'); set('p1', 'Z1\nZ2\nZ3\nZ4\nZ5\nZ6\nZ7\nZ8\nZ9\nZ10\nZ11'); f.requestSubmit(); });
  await p.waitForTimeout(500);
  const m1 = await p.evaluate(() => { const m = S.matches.find(x => x.worldId === 'afgzim1'); return m && { st: m.status, view: UI.view, po: m.pendingOpen, i0: m.innings[0] && m.innings[0].open } });
  ok(m1 && m1.view === 'score' && m1.po && m1.po.r === 145 && m1.i0 && m1.i0.r === 159, 'match created ' + JSON.stringify(m1));
  // start innings: pick openers/bowler
  const frm = await p.evaluate(() => { const f = document.querySelector('form[data-f="startInn"]'); return f ? [...f.querySelectorAll('select')].map(s => s.name) : null });
  ok(frm, 'start-innings form shown');
  if (frm) { await p.evaluate(() => { const f = document.querySelector('form[data-f="startInn"]'); f.querySelectorAll('select').forEach((s, i) => { s.selectedIndex = Math.min(i, s.options.length - 1) }); f.requestSubmit(); }); await p.waitForTimeout(500); }
  const s1 = await p.evaluate(() => { const m = S.matches.find(x => x.worldId === 'afgzim1'), c = calc(m, m.cur); return { cur: m.cur, r: c.runs, w: c.wk, lg: c.lg } });
  ok(s1.r === 145 && s1.w === 6 && s1.lg === 105, 'opening balance applied ' + JSON.stringify(s1));
  await p.click('.runs [data-a="run"][data-v="4"], .runs button:has-text("4")'); await p.waitForTimeout(300);
  const s2 = await p.evaluate(() => { const m = S.matches.find(x => x.worldId === 'afgzim1'), c = calc(m, m.cur); return { r: c.runs, lg: c.lg } });
  ok(s2.r === 149 && s2.lg === 106, 'ball scored on top of opening ' + JSON.stringify(s2));
  // reopen reuses
  await p.evaluate(() => { UI.view = 'wmatch'; UI.wm.tab = 'info'; render(); }); await p.waitForTimeout(800);
  await p.click('[data-a="wmScore"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => UI.view === 'score' && S.matches.filter(x => x.worldId === 'afgzim1').length === 1), 'reopen reuses local match');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: score world match');
})();
