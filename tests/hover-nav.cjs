// Horizontal rows: no scrollbar; arrows appear only while the pointer is over a scrollable row, and scroll smoothly.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 1200, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div id="row" class="hscroll" style="position:fixed;z-index:9000;top:200px;left:100px;width:600px;background:#123">' + Array.from({ length: 20 }, (_, i) => `<span style="flex:none;width:120px;height:60px">${i}</span>`).join('') + '</div>'); });
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.hnav')].map(x => x.classList.contains('on')));
  ok((await vis()).every(v => !v), 'arrows hidden until pointer is over a row');
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('row')).scrollbarWidth) === 'none', 'no scrollbar');
  await p.mouse.move(300, 230); await p.waitForTimeout(250);
  let v = await vis(); ok(!v[0] && v[1], 'only right arrow at start: ' + v);
  await p.locator('.hnav').nth(1).click(); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.getElementById('row').scrollLeft) > 200, 'smooth scroll moved the row');
  v = await vis(); ok(v[0], 'left arrow after scrolling');
  await p.mouse.move(900, 600); await p.waitForTimeout(500); v = await vis(); ok(v.every(x => !x), 'arrows hide when pointer leaves');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: hover navigation');
})();
