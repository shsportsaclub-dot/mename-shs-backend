// QR generator decodes (checked separately with OpenCV), CSV import: header aliases, dedupe, invalid rows, team creation, UI.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'A', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {};
    S.players = [{ id: 'old', name: 'Existing Guy', phone: '9876500000', role: 'BAT' }]; S.teams = [];
    const csv = 'Player Name;Team Name;Playing Role;Jersey No;Mobile\n"Kumar, Ravi";Sky Lions;Batter;7;98765 43210\nAnil;Sky Lions;Bowler;11;\nAnil;Sky Lions;Bowler;11;\nExisting Guy;Hawks;All-rounder;3;9876500000\n;Hawks;;;\nBad Phone;Hawks;;;12\nKeeper;Hawks;Wicketkeeper;1;9000000009';
    const R = impParse(csv); o.cols = R.cols.join(','); o.st = R.rows.map(x => x.st).join(','); o.q = R.rows[0].name + '|' + R.rows[0].phone + '|' + R.rows[0].role + '|' + R.rows[6].role;
    o.noName = impParse('Team,Role\nA,B').err; o.few = impParse('Name').err;
    UI.view = 'import'; UI.im.tab = 'import'; UI.im.res = R; render(); o.prev = /3 new, 2 already here, 2 skipped/.test(document.getElementById('app').innerText) || document.getElementById('app').innerText.match(/Preview:[^\n]*/)[0];
    A.imGo(); o.n = S.players.length; o.teams = S.teams.map(t => t.name + ':' + t.players.length).join(','); o.again = (A.imGo(), S.players.length);
    UI.im.tab = 'qr'; render(); return new Promise(res => setTimeout(() => { o.qr = !!document.getElementById('qrCv'); o.big = qrCanvas('x'.repeat(250), 300) === null; o.fit = document.documentElement.scrollWidth <= innerWidth; UI.im.tab = 'scan'; render(); imOpen('https://cricheroes.com/player/123'); o.ext = UI.im.msg; imOpen('javascript:alert(1)'); o.js = UI.im.msg; res(o) }, 100));
  });
  ok(r.cols === 'name,team,role,jersey,phone', 'cols ' + r.cols); ok(r.st === 'new,new,duplicate,duplicate,invalid,invalid,new', 'status ' + r.st); ok(r.q === 'Kumar, Ravi|9876543210|BAT|WK', 'parse ' + r.q);
  ok(/Name/.test(r.noName) && /header/.test(r.few), 'errors'); ok(r.prev === true, 'preview ' + r.prev); ok(r.n === 4 && r.again === 4, 'import count ' + r.n + ',' + r.again); ok(r.teams === 'Sky Lions:2,Hawks:1', 'teams ' + r.teams);
  ok(r.qr && r.big, 'qr'); ok(r.fit, 'overflow'); ok(/cannot read data/.test(r.ext), 'ext ' + r.ext); ok(/Only web links/.test(r.js) || /not a valid/.test(r.js), 'js link ' + r.js); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: import + qr');
})();
