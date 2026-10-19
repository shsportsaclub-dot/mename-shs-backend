// Telugu and Hindi voice: milestones, end of over and result are spoken in the chosen language (captured, not played).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const out = {}; let said = []; speak = t => said.push(t); S.settings.voice = true;
    const run = lang => {
      S.settings.vlang = lang; said = [];
      const m = newMatch({ a: 'a', b: 'b', overs: 3, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m, 0, 'p0', 'p1', 'p11'); const inn = m.innings[0];
      for (let k = 0; k < 9; k++) { inn.cur.s = 'p0'; inn.cur.n = 'p1'; if (inn.cur.bl == null) inn.cur.bl = 'p' + (11 + inn.lg / 6); ball(m, { r: 6 }) }   // 54 off 9 balls: over 1 ends at 36, fifty on ball 9
      return said.slice();
    };
    out.te = run('te'); out.hi = run('hi');
    const fake = r => ({ result: r }); out.r1 = vResult(fake('India won by 12 runs'), 'te'); out.r2 = vResult(fake('India won by 4 wickets'), 'hi'); out.r3 = vResult(fake('Match tied'), 'te');
    return out;
  });
  const te = r.te.join(' | '), hi = r.hi.join(' | ');
  ok(/అర్ధ సెంచరీ/.test(te) && /ఓవర్ 1 ముగిసింది/.test(te), 'telugu milestone + over: ' + te); ok(/अर्धशतक/.test(hi) && /ओवर 1 समाप्त/.test(hi), 'hindi milestone + over: ' + hi);
  ok(/12 పరుగుల తేడాతో గెలిచింది/.test(r.r1), r.r1); ok(/4 विकेट से जीत/.test(r.r2), r.r2); ok(/టై/.test(r.r3), r.r3);
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: te/hi voice');
})();
