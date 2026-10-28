const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const iso = h => new Date(Date.now() + h * 3600e3).toISOString().slice(0, 19), tm = n => [{ name: n[0], short: n[0].slice(0, 3).toUpperCase() }, { name: n[1], short: n[1].slice(0, 3).toUpperCase() }];
    UI.live = { ok: true, matches: [
      { id: 'w-stumps', name: 'Manipur vs Arunachal Pradesh, Plate, Ranji', type: 'first-class', status: 'Day 2: Stumps - AP trail', time: iso(-30), started: true, ended: false, teams: tm(['Manipur', 'Arunachal Pradesh']), score: [] },
      { id: 'w-play', name: 'India vs Australia, 1st T20I', type: 't20', status: 'Live', time: iso(-1), started: true, ended: false, teams: tm(['India', 'Australia']), score: [] },
      { id: 'w-up', name: 'England vs Pakistan, 2nd ODI', type: 'odi', status: '', time: iso(3), started: false, ended: false, teams: tm(['England', 'Pakistan']), score: [] },
      { id: 'w-done', name: 'Nepal vs Oman, 3rd T20I', type: 't20', status: 'Nepal won by 5 runs', time: iso(-48), started: true, ended: true, teams: tm(['Nepal', 'Oman']), score: [] } ] };
    S.teams = [{ id: 'a', name: 'Hapur Lions', short: 'HPL', color: '#235bbb', players: [], level: 'club' }, { id: 'b', name: 'Meerut Kings', short: 'MRK', color: '#c9a400', players: [], level: 'club' }];
    S.matches = [{ id: 'm-sched', a: 'a', b: 'b', overs: 20, date: new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10), time: '', status: 'setup', innings: [], xi: {}, result: '' }];
    const F = wFilter(); const o = { live: F.live.map(m => m.id), up: F.up.map(m => m.id), rec: F.rec.map(m => m.id) };
    o.cardUp = hhCard(F.up.find(m => m.id === 'w-up')); o.cardStumps = cbCard(F.live.find(m => m.id === 'w-stumps')); o.cardUpCb = cbCard(F.up.find(m => m.id === 'w-up'));
    o.cls = clsMatch(F.up.find(m => m.sh)); o.shOpen = typeof A.wOpen;
    return o; });
  ok(r.live[0] === 'w-play' && r.live[r.live.length - 1] === 'w-stumps', 'in-play first, stumps last: ' + r.live);
  ok(r.up.includes('w-up') && r.up.includes('sh:m-sched'), 'upcoming has world and Scoring Heroes scheduled matches: ' + r.up);
  ok(r.rec.includes('w-done'), 'results');
  ok(/Starts in <b data-cd/.test(r.cardUp) && /Starts in <b data-cd/.test(r.cardUpCb), 'countdown on upcoming cards');
  ok(/STUMPS . Day 3 starts in/.test(r.cardStumps) || /STUMPS/.test(r.cardStumps), 'stumps card');
  ok(r.cls.cat === 'dom', 'club teams are domestic, got ' + r.cls.cat);
  const x = await p.evaluate(() => { S.teams[0].level = 'national'; S.teams[1].level = 'national'; return clsMatch(wFilter().up.find(m => m.sh)).cat }); ok(x === 'int', 'two national teams = international');
  await p.evaluate(() => { S.matches = [{ id: 'm-live', a: 'a', b: 'b', overs: 20, date: '2026-10-28', status: 'live', innings: [], xi: {}, result: '' }]; });
  ok(await p.evaluate(() => { let opened = ''; const o = A.open; A.open = d => { opened = d.id }; A.wOpen({ id: 'sh:m-live' }); A.open = o; return opened === 'm-live' }), 'SH match card opens the SH scorer');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: lists + countdown');
})();
