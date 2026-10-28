const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const ctx = await b.newContext({ viewport: { width: 412, height: 800 }, hasTouch: false }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'scorer', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.view = 'home'; render(); });
  await p.waitForTimeout(600);
  const rect = () => p.evaluate(() => { const r = document.querySelector('.fabfloat').getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), cx: Math.round(r.left + r.width / 2), op: +getComputedStyle(document.querySelector('.fabfloat')).opacity } });
  let r0 = await rect(); ok(Math.abs(r0.cx - 206) <= 2, 'starts at centre ' + JSON.stringify(r0)); await p.waitForTimeout(500); r0 = await rect(); ok(r0.op < .5, 'faint when idle ' + r0.op);
  // tap opens quick actions
  await p.mouse.click(r0.x + 29, r0.y + 29); await p.waitForTimeout(300); ok(await p.evaluate(() => !!UI.sheet), 'tap opens quick actions'); await p.evaluate(() => { UI.sheet = false; render(); });
  // drag to the left/top
  const s = await rect(); await p.mouse.move(s.x + 29, s.y + 29); await p.mouse.down(); await p.mouse.move(s.x + 29 - 60, s.y + 29 - 120, { steps: 6 });
  ok((await rect()).op > .9, 'solid while dragging'); await p.mouse.up(); await p.waitForTimeout(150);
  const m = await rect(); ok(Math.abs(m.x - (s.x - 60)) <= 3 && Math.abs(m.y - (s.y - 120)) <= 3, 'moved where dropped ' + JSON.stringify([s, m]));
  ok(await p.evaluate(() => !UI.sheet), 'drag does not open the menu');
  // survives a refresh / screen change
  await p.evaluate(() => { UI.view = 'matches'; render(); render(); }); await p.waitForTimeout(200);
  const k = await rect(); ok(Math.abs(k.x - m.x) <= 3 && Math.abs(k.y - m.y) <= 3, 'position kept after screen change ' + JSON.stringify([m, k]));
  await p.waitForTimeout(2200); ok((await rect()).op < .5, 'faint again after a moment');
  // remembered after reload
  await p.reload(); await p.waitForTimeout(500); await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'scorer', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.view = 'home'; render(); }); await p.waitForTimeout(400);
  const q = await rect(); ok(Math.abs(q.x - m.x) <= 3 && Math.abs(q.y - m.y) <= 3, 'remembered after reload ' + JSON.stringify([m, q]));
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: + button draggable, faint when idle, position remembered');
})();
