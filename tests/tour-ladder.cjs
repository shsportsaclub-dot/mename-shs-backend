// Tournament progress ladder: League -> Semi-finals -> Final counted from real fixtures; champion only after the Final is done.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m, 0, 'p0', 'p1', 'p11'); ball(m, { r: 4 }); m.status = 'done'; m.win = 'a'; m.result = 'India won'; m.tid = 'tt';
    const fin = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(fin, 0, 'p0', 'p1', 'p11'); fin.tid = 'tt';
    S.tours = [{ id: 'tt', name: 'QA Cup', kind: 'league', sport: 'cricket', overs: 20, teams: ['a', 'b'], groups: [], fixtures: [{ id: 'f1', a: 'a', b: 'b', stage: 'League', date: '2026-10-20', mid: m.id }, { id: 'f2', a: 'a', b: 'b', stage: 'Final', date: '2026-10-21', mid: fin.id }] }];
    UI.tid = 'tt'; UI.ttab = 'fix'; UI.view = 'tour'; render(); const t1 = document.getElementById('app').innerText;
    fin.status = 'done'; fin.win = 'b'; fin.result = 'Australia won'; render(); const t2 = document.getElementById('app').innerText;
    return { t1, t2, fit: document.documentElement.scrollWidth <= innerWidth };
  });
  ok(/Tournament progress/.test(r.t1) && /1\/1 done/.test(r.t1) && /Not created yet/.test(r.t1), 'league 1/1 done, semis not created: ' + r.t1.slice(0, 260));
  ok(!/Champions/.test(r.t1) && /Next: Final/.test(r.t1), 'no champion before the final; next is the final');
  ok(/Champions: Australia/.test(r.t2), 'champion after final: ' + r.t2.slice(0, 200)); ok(r.fit, 'fits'); ok(!errs.length, 'errors ' + errs.join(';'));
  await p.screenshot({ path: '/tmp/out/tour.png' });
  if (!process.exitCode) console.log('PASS: tournament ladder'); await b.close();
})();
