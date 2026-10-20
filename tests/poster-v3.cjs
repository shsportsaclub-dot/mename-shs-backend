// Posters v3: crests on result/sold posters, News + Article templates, Make poster from news cards.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 420, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), o = {}; UI.stage = 'app'; S.user = { id: 'u1', name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.teams = [{ id: 'a', name: 'India Lions', short: 'IND', color: '#235bbb', preset: 2, logo: null, players: [] }, { id: 'b', name: 'Sky Hawks', short: 'SKY', color: '#c9a400', preset: 4, logo: null, players: [] }];
    o.tpls = ST2T.some(x => x[0] === 'news') && ST2T.some(x => x[0] === 'article');
    UI.view = 'social'; UI.st2.tpl = 'result'; UI.st2.f = { title: 'Spring Cup', l1: 'India Lions  182/5', l2: 'Sky Hawks  176/8', note: 'India Lions won by 6 runs' }; UI.st2.size = 'sq'; render(); await w(400);
    const px = () => { const cv = document.getElementById('socCv'), x = cv.getContext('2d'); const d = x.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 997) if (d[i] + d[i + 1] + d[i + 2] > 60) n++; return n };
    o.pixels = px() > 50; o.crestImgs = Object.keys(st2Cache).length >= 2; window.__r = document.getElementById('socCv').toDataURL();
    UI.st2.tpl = 'sold'; UI.st2.f = { title: 'Test Cup', l1: 'Virat Test', l2: 'Sky Hawks', l3: 'SOLD FOR 1200 pts', l4: 'Category A' }; render(); await w(400); o.sold = px() > 50; window.__s = document.getElementById('socCv').toDataURL();
    newsPosterOpen('Afghanistan beat Zimbabwe by 158 runs in the second ODI at Harare', 'Scoring Heroes News'); await w(400); o.news = UI.st2.tpl === 'news' && UI.view === 'social' && px() > 50; o.cap = /CricketNews/.test(st2Cap()); window.__n = document.getElementById('socCv').toDataURL();
    UI.st2.tpl = 'article'; UI.st2.f = { title: 'Analysis', l1: 'Why the powerplay decides T20 matches', l2: 'A look at how teams score and lose wickets in the first six overs.', note: '20 Oct 2026' }; UI.st2.size = 'st'; render(); await w(400); o.art = px() > 50;
    UI.nwList = [{ t: 'Test headline for poster', s: 'ESPN' }]; A.newsPoster({ i: '0' }); o.fromCard = UI.st2.f.l1 === 'Test headline for poster' && UI.st2.f.title === 'ESPN';
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of Object.keys(r)) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  const fs = require('fs'); for (const [k, n] of [['__r', 'result'], ['__s', 'sold'], ['__n', 'news']]) { const d = await p.evaluate(k => window[k], k); fs.writeFileSync('/tmp/poster-' + n + '.png', Buffer.from(d.split(',')[1], 'base64')); }
  await b.close(); if (!process.exitCode) console.log('PASS: poster v3');
})();
