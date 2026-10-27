// Once signed in, the session survives reloads; only Sign out (or reinstall / cleared data) asks for the OTP again.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), c = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await c.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + require('path').resolve(__dirname, '../app-index.html');
  await p.goto(url); await p.waitForTimeout(400);
  await p.evaluate(() => { S.prefs = S.prefs || {}; S.prefs.welcomed = 1; S.user = { name: 'Tester', phone: '+919999999999', role: 'scorer' }; S.tok = 'tok.sig'; save(); });
  await p.reload(); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ user: S.user && S.user.phone, tok: S.tok, login: /Login|Register/.test((document.getElementById('app') || document.body).innerText.slice(0, 400)) && /OTP|PIN/.test(document.body.innerText.slice(0, 600)) }));
  const ok = (v, m) => { if (!v) { console.error('FAIL', m, JSON.stringify(after)); process.exitCode = 1; } };
  ok(after.user === '+919999999999', 'user kept after reload'); ok(after.tok === 'tok.sig', 'token kept after reload'); ok(!after.login, 'no login screen after reload');
  await p.evaluate(() => A.logout()); await p.waitForTimeout(300);
  const out = await p.evaluate(() => ({ user: S.user, step: UI.login && UI.login.step }));
  ok(out.user === null, 'sign out clears user');
  await p.reload(); await p.waitForTimeout(1200);
  const again = await p.evaluate(() => ({ user: S.user }));
  ok(!again.user, 'after sign out and reload, login is required again');
  ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: login persists until sign out');
})();
