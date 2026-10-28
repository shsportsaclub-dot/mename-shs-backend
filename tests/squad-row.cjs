const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 412, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.wm = { m: { id: 'q', name: 'x', started: true, ended: false, type: 't20', teams: [{ name: 'Alpha', short: 'ALP' }, { name: 'Beta', short: 'BET' }], score: [] }, mi: {}, sc: null, bb: null, tab: 'sq', sq: [{ teamName: 'Alpha', players: [{ id: 'p1', name: 'Rahul Verma', battingStyle: 'Right-hand bat' }, { id: 'p2', name: 'Sam Long Surname Here', battingStyle: 'Left-hand bat' }] }, { teamName: 'Beta', players: [{ id: 'p3', name: 'Tom Hill', bowlingStyle: 'Right-arm fast' }] }] };
    UI.view = 'wmatch'; render(); });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const e = document.querySelector('.sh-squad-player'); if (!e) return null; const im = e.firstElementChild.getBoundingClientRect(), nm = e.querySelector('b').getBoundingClientRect(); return { photoLeftOfName: im.right <= nm.left + 1, sameRow: Math.abs((im.top + im.height / 2) - (nm.top + nm.height / 2)) < 40, fit: document.documentElement.scrollWidth <= innerWidth + 1 } });
  ok(r, 'squad player present'); if (r) { ok(r.photoLeftOfName, 'photo left of name ' + JSON.stringify(r)); ok(r.fit, 'fits'); }
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: squad photo beside name');
})();
