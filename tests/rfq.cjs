const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const c = f => p.evaluate(f);
  await c(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; S.user = { id: 'buyer', name: 'Ravi', nick: 'Ravi', phone: '9000000002', role: 'viewer', kind: 'Fan' }; S.market = []; S.orders = []; UI.view = 'market'; UI.mk.tab = 'orders'; render(); });
  await p.fill('form[data-f="mkOrder"] input[name=item]', '20 leather balls'); await p.fill('form[data-f="mkOrder"] input[name=qty]', '20'); await p.fill('form[data-f="mkOrder"] input[name=loc]', 'Hapur');
  await p.click('form[data-f="mkOrder"] button');
  ok(await c(() => S.market.some(x => x.kind === 'rfq' && x.status === 'open' && x.title === '20 leather balls' && x.uid === 'buyer')), 'bulk request becomes a shared listing');
  ok(await c(() => /My open requests/.test(document.body.innerText)), 'buyer sees own open request');
  ok(await c(() => !S.market.filter(x => x.uid === 'buyer' && x.kind !== 'rfq').length), 'not counted as a product listing');
  // a seller on another phone sees it and can quote
  await c(() => { S.user = { id: 'seller', name: 'Shop', nick: 'Shop', phone: '9000000001', role: 'viewer', kind: 'Fan' }; S.market.forEach(x => { x.rm = 1; }); render(); });
  ok(await c(() => /Open bulk requests from buyers/.test(document.body.innerText) && /20 leather balls/.test(document.body.innerText)), 'seller sees request');
  const href = await c(() => (document.querySelector('a.btn[href*="wa.me"]') || {}).href || '');
  ok(/wa\.me\/919000000002/.test(href) && /20%20leather%20balls/.test(href), 'quote opens WhatsApp to the buyer: ' + href);
  // owner closes
  await c(() => { S.user = { id: 'buyer', name: 'Ravi', nick: 'Ravi', phone: '9000000002', role: 'viewer', kind: 'Fan' }; S.market.forEach(x => { x.rm = 0; }); render(); });
  await p.click('[data-a="rfqClose"]');
  ok(await c(() => S.market[0].status === 'removed' && S.orders[0].status === 'closed' && !/My open requests/.test(document.body.innerText)), 'close request');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: bulk requests');
})();
