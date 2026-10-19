// Multi-day (Test) matches: innings victory, follow-on rule, chase win/tie/loss, declaration, draw. Limited-overs untouched.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: i % 5 === 0 ? 'BOWL' : 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const mk = (days) => { const m = newMatch({ a: 'a', b: 'b', overs: 900 + days, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players, venue: 'QA', date: '2026-10-19' }); return m; };
    const open = (m) => { const bat = m.firstBat, bw = bat === 'a' ? 'b' : 'a'; startInnings(m, 0, S.teams.find(t => t.id === bat).players[0], S.teams.find(t => t.id === bat).players[1], S.teams.find(t => t.id === bw).players[0]) };
    const bowler = (m) => { const inn = m.innings[0]; if (inn.cur.bl == null) inn.cur.bl = S.teams.find(t => t.id === inn.bowl).players[0] };
    const bat = (m) => { const inn = m.innings[0], c = inn.cur; for (const k of ['s', 'n']) if (c[k] == null) { const id = avail(m)[0]; if (id) { c[k] = id; inn.used.push(id) } } };
    const runs = (m, n) => { while (n > 0) { bowler(m); bat(m); const r = n >= 6 ? 6 : 1; ball(m, { r }); n -= r } };
    const allOut = (m) => { let g = 0; while (m.status === 'live' && g++ < 20) { bowler(m); bat(m); ball(m, { w: 'Bowled' }) } };
    const next = (T) => { A.tNext({ id: T.id }); const m = S.matches.find(x => x.id === T.rec[T.rec.length - 1]); open(m); return m };
    const out = {};
    // A: follow-on and innings victory
    let m1 = mk(5), T = testOf(m1); open(m1); runs(m1, 300); out.d5 = T.days;
    A.tDeclare({ id: m1.id }); confirm = () => true; A.tDeclare({ id: m1.id });
    out.afterDecl = { st: m1.status, dec: m1.declared };
    let m2 = next(T); runs(m2, 100); allOut(m2); out.s2 = mtState(T);
    out.canFollow = out.s2.canFollow; out.thr = out.s2.thr;
    A.tFollow({ id: T.id, v: '1' }); let m3 = S.matches.find(x => x.id === T.rec[2]); out.order3 = m3.firstBat; open(m3); runs(m3, 50); allOut(m3);
    out.A = { status: T.status, result: T.result };
    // B: chase win
    const mk2 = (first, second, third, fourth, endMode) => { const a = mk(5), t = testOf(a); open(a); runs(a, first); allOut(a); const b2 = next(t); runs(b2, second); allOut(b2); A.tFollow({ id: t.id, v: '0' }); const c = S.matches.find(x => x.id === t.rec[2]); open(c); runs(c, third); A.tDeclare({ id: c.id }); const d = next(t); open(d); out['need_' + endMode] = mtLine(t); runs(d, fourth); if (endMode === 'out') allOut(d); return t };
    out.B = mk2(100, 50, 100, 151, 'win').result;
    out.C = mk2(100, 50, 100, 150, 'out').result;
    out.D = mk2(100, 50, 100, 100, 'out').result;
    // E: draw + undo reopen
    let me = mk(2), TE = testOf(me); open(me); runs(me, 20); A.tDraw({ id: TE.id }); out.E = TE.result; undo(me); out.Eundo = TE.status;
    // 1-day threshold and UI
    out.thr1 = mtThr({ days: 1 }), out.thr3 = mtThr({ days: 3 }), out.thr2 = mtThr({ days: 2 });
    UI.sid = m1.id; UI.view = 'score'; render(); out.ui = document.getElementById('app').innerText;
    UI.view = 'tests'; render(); out.hub = document.getElementById('app').innerText;
    const lo = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); out.loTest = !lo.testId && !testOf(lo) && lo.overs === 20;
    out.fit = document.documentElement.scrollWidth <= innerWidth;
    return out;
  });
  ok(r.d5 === 5, 'five-day'); ok(r.afterDecl.st === 'break' && r.afterDecl.dec, 'declaration closes the innings');
  ok(r.thr === 200 && r.canFollow === true, 'follow-on offered with lead >= 200 in a 5-day match: ' + r.thr + ' ' + r.canFollow);
  ok(r.order3 === 'b', 'after follow-on the same side bats again'); ok(/won by an innings and 150 runs/.test(r.A.result), 'innings victory: ' + JSON.stringify(r.A));
  ok(/need 151 more to win \(target 151\)/.test(r.need_win), 'target 151: ' + r.need_win); ok(/won by 10 wickets/.test(r.B), 'chase win: ' + r.B);
  ok(r.C === 'Match tied', 'tie: ' + r.C); ok(/won by 50 runs/.test(r.D) && /India/.test(r.D), 'chase loses by 50: ' + r.D);
  ok(r.E === 'Match drawn' && r.Eundo === 'live', 'draw then undo state: ' + r.E + ' ' + r.Eundo);
  ok(r.thr1 === 75 && r.thr2 === 100 && r.thr3 === 150, 'MCC Law 14 thresholds'); ok(/Day 1 of 5/.test(r.ui) && /1st innings/.test(r.ui), 'test card in scorer: ' + r.ui.slice(0, 200));
  ok(/Test and multi-day/.test(r.hub), 'hub'); ok(r.loTest, 'limited overs untouched'); ok(r.fit, 'fits'); ok(!errs.length, 'errors ' + errs.join(';'));
  await p.screenshot({ path: '/tmp/out/test.png' });
  if (!process.exitCode) console.log('PASS: multi-day matches'); await b.close();
})();
