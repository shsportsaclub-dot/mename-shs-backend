const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const c = f => p.evaluate(f);
  await c(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { id: 'u1', name: 'Sonu', nick: 'Sonu', role: 'viewer', kind: 'Fan', phone: '9999999999' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.view = 'directory'; render(); });
  await p.click('[data-a="go"][data-v="registry"]'); await p.waitForTimeout(150);
  ok(await c(() => UI.view === 'registry' && /Associations registry/.test(document.body.innerText)), 'opens from directory');
  await p.fill('[data-c="rgQ"]', 'BCCI'); await p.waitForTimeout(200);
  ok(await c(() => document.querySelectorAll('.rg-i').length >= 1 && /BCCI/.test(document.body.innerText)), 'search finds board');
  // add district body + duplicate guard
  await p.fill('form[data-f="rgAdd"] input[name=name]', 'Hapur District Cricket Association'); await p.fill('form[data-f="rgAdd"] input[name=country]', 'India'); await p.selectOption('form[data-f="rgAdd"] select', 'district'); await p.fill('form[data-f="rgAdd"] input[name=district]', 'Hapur');
  await p.click('form[data-f="rgAdd"] button'); ok(await c(() => S.assocs.length === 1 && !S.assocs[0].verified), 'added as unverified');
  await c(() => { UI.rgy.q = 'Hapur'; render(); });
  await p.fill('form[data-f="rgAdd"] input[name=name]', 'Hapur District Cricket Association'); await p.fill('form[data-f="rgAdd"] input[name=country]', 'India'); await p.selectOption('form[data-f="rgAdd"] select', 'district'); await p.click('form[data-f="rgAdd"] button'); ok(await c(() => S.assocs.length === 1), 'duplicate blocked');
  // claim
  await p.click('[data-a="rgClaim"]'); await p.fill('form[data-f="rgClaimSend"] input[name=role]', 'Secretary'); await p.fill('form[data-f="rgClaimSend"] input[name=phone]', '9876543210'); await p.click('form[data-f="rgClaimSend"] button');
  ok(await c(() => S.assocClaims.length === 1 && S.assocClaims[0].status === 'pending'), 'claim pending');
  ok(await c(() => /Claim pending/.test(document.body.innerText)), 'status shown');
  // non-admin cannot approve
  await c(() => A.rgOk({ id: S.assocClaims[0].id })); ok(await c(() => S.assocClaims[0].status === 'pending'), 'viewer cannot approve');
  await c(() => { S.user.role = 'admin'; render(); }); await p.click('[data-a="rgOk"]'); ok(await c(() => S.assocClaims[0].status === 'approved' && /Verified/.test(document.body.innerText)), 'admin approves -> verified');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: registry');
})();
