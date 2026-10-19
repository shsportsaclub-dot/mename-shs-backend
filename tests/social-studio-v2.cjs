// Social studio v2: 14 templates render to canvas, brand kit logo/name, auction SOLD autofill, player photo, themes/sizes.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const r = await p.evaluate(async (px) => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'Admin', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {};
    S.players = [{ id: 'pl1', name: 'Kiran Rao', role: 'BAT', photo: px }];
    S.auc = [{ id: 'a1', name: 'Sky Cup', teams: [{ id: 't1', name: 'Sky Lions', short: 'SKY', purse: 1, players: ['x'] }], players: [{ id: 'x', name: 'Ravi', st: 'sold', team: 't1', price: 1200, cat: 'A' }], pts: 5000, ppt: 11, base: 100, inc: 50 }];
    UI.view = 'social'; o.n = ST2T.length; o.tpls = {};
    for (const t of ST2T) { A.st2Tpl({ v: t[0] }); await new Promise(r => setTimeout(r, 120)); const cv = document.getElementById('socCv'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 997) if (d[i] > 40 || d[i + 1] > 40) n++; o.tpls[t[0]] = n > 20 && cv.width === 1080; }
    A.st2Tpl({ v: 'sold' }); C.st2Auc('a1|x'); await new Promise(r => setTimeout(r, 150)); o.sold = JSON.stringify([UI.st2.f.l1, UI.st2.f.l2, UI.st2.f.l3]); o.cap = document.getElementById('socCap').value;
    A.st2Tpl({ v: 'mile' }); C.st2Pl('pl1'); await new Promise(r => setTimeout(r, 150)); o.photo = !!UI.st2.photo && UI.st2.f.l1;
    C.stB('Sky Club', { dataset: { k: 'name' } }); C.stB('@skyclub', { dataset: { k: 'handle' } }); C.stB('#112233', { dataset: { k: 'c1' } }); C.stB('nothex', { dataset: { k: 'c2' } }); o.brand = S.brand.name + S.brand.handle + S.brand.c1 + S.brand.c2;
    C.st2Theme('brand'); C.st2Size('st'); await new Promise(r => setTimeout(r, 150)); o.story = document.getElementById('socCv').height; o.fit = document.documentElement.scrollWidth <= innerWidth; o.cap2 = document.getElementById('socCap').value; return o;
  }, px);
  ok(r.n >= 14, 'templates ' + r.n); for (const k in r.tpls) ok(r.tpls[k], 'draw ' + k); ok(r.sold === '["Ravi","Sky Lions","SOLD FOR 1200 pts"]', 'sold ' + r.sold); ok(/SOLD! /.test(r.cap) && /#Auction/.test(r.cap), 'cap ' + r.cap);
  ok(r.photo === 'Kiran Rao', 'photo ' + r.photo); ok(r.brand === 'Sky Club@skyclub#112233#0a1f5c', 'brand ' + r.brand); ok(r.story === 1920, 'story'); ok(/@skyclub/.test(r.cap2), 'caption handle'); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: social studio v2');
})();
