const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {}, fd = x => { const f = new FormData(); for (const k in x) f.append(k, x[k]); return f; };
    S.officials = [{ id: 'o1', name: 'Umpire Raju', role: 'umpire', uid: 'uX' }]; S.user = { id: 'u1', name: 'A', role: 'player' };
    F.offRate(fd({ oid: 'o1', r: 4, c: 'Fair' })); F.offRate(fd({ oid: 'o1', r: 5 })); o.one = S.officials[0].ratings.length + ':' + S.officials[0].ratings[0].r;
    S.user = { id: 'u2', name: 'B', role: 'player' }; F.offRate(fd({ oid: 'o1', r: 3 })); o.two = S.officials[0].ratings.length;
    S.user = { id: 'uX', name: 'Self' }; F.offRate(fd({ oid: 'o1', r: 5 })); o.self = S.officials[0].ratings.length;
    S.user = null; F.offRate(fd({ oid: 'o1', r: 5 })); o.anon = S.officials[0].ratings.length;
    S.user = { id: 'u1', name: 'A', role: 'player' }; UI.view = 'officials'; render(); A.offOpen({ id: 'o1' }); o.ui = /4\.0/.test(document.getElementById('modal')?.innerText || document.body.innerText); return o;
  });
  ok(r.one === '1:5', 'update ' + r.one); ok(r.two === 2, 'two'); ok(r.self === 2, 'self'); ok(r.anon === 2, 'anon'); ok(r.ui, 'avg shown'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: officials ratings');
})();
