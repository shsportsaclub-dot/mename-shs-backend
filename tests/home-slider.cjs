// Home match slider: arrows, clickable dots and mouse drag move past the first cards on desktop.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 1200, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => {
    document.body.innerHTML = '<div id="host" style="width:900px;margin:20px"><div class="ig-sl" id="igsl">' + Array.from({ length: 7 }, (_, i) => `<div class="ig-sq" style="min-width:255px;flex:0 0 calc((100% - 24px)/3);height:120px;background:#123">Match ${i + 1}</div>`).join('') + '</div><div class="ig-dots" id="igdots">' + Array.from({ length: 7 }, (_, i) => `<i style="display:inline-block;width:10px;height:10px;background:#888;margin:3px"></i>`).join('') + '</div></div>';
    igSync();
  });
  const left = () => p.evaluate(() => document.getElementById('igsl').scrollLeft);
  await p.mouse.move(400, 120); await p.waitForTimeout(300);
  ok(await p.locator('.hnav').count() === 2, 'two hover arrow buttons');
  ok(!(await p.locator('.hnav').nth(0).evaluate(e => e.classList.contains('on'))), 'left arrow hidden at start');
  await p.locator('.hnav').nth(1).click(); await p.waitForTimeout(700);
  const a = await left(); ok(a > 200, 'right arrow scrolls (' + a + ')');
  ok(await p.locator('.hnav').nth(0).evaluate(e => e.classList.contains('on')), 'left arrow shown after scrolling');
  await p.click('#igdots i:nth-child(6)'); await p.waitForTimeout(800);
  ok(await left() > a, 'dot click jumps further');
  await p.mouse.move(400, 120); await p.waitForTimeout(300); await p.locator('.hnav').nth(0).click(); await p.waitForTimeout(700);
  const mid = await left();
  const box = await p.locator('#igsl').boundingBox();
  await p.mouse.move(box.x + 400, box.y + 60); await p.mouse.down(); await p.mouse.move(box.x + 250, box.y + 60, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300);
  ok(await left() > mid + 80, 'mouse drag scrolls');
  ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: home slider');
})();
