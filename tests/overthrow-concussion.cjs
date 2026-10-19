// Overthrows (Law 19.8) and concussion replacement.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.players = Array.from({ length: 28 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 13).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(14, 27).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players.slice(0, 11), xiB: S.teams[1].players.slice(0, 11), venue: 'QA', date: '2026-10-19' });
    m.subs = { a: ['p11', 'p12'], b: [] };
    startInnings(m, 0, 'p0', 'p1', 'p14'); const out = {};
    // 1 run + overthrow 1 = 2 total, striker unchanged
    UI.ot = { n: 1, b: false }; ball(m, { r: 1 });
    let e = m.innings[0].ev[0]; out.r1 = e.r; out.s1 = m.innings[0].cur.s;
    // boundary overthrow: 0 + 4, not a batter four
    UI.ot = { n: 4, b: true }; ball(m, { r: 0 });
    let k = calc(m, 0); out.runs = k.runs; out.f4 = k.bat.p0 ? k.bat.p0.f4 + k.bat.p1.f4 : -1; out.otUsed = UI.ot;
    UI.view = 'score'; UI.sid = m.id; render(); const txt = document.getElementById('app').innerText; out.uiOt = /Overthrow/.test(txt); out.uiCs = /Concussion replacement/.test(txt);
    out.comm = commentary(m, 0).filter(x => x.t === 'b').map(x => x.txt).join(' | ');
    // undo keeps engine sane
    undo(m); out.afterUndo = calc(m, 0).runs;
    // concussion: striker replaced by p11
    const striker = m.innings[0].cur.s; out.okCs = csApplyTo(m, 'a', striker, 'p11'); out.xiHas = m.xi.a.includes('p11') && !m.xi.a.includes(striker);
    out.crease = m.innings[0].cur.s === 'p11' || m.innings[0].cur.n === 'p11'; out.again = csApplyTo(m, 'a', 'p11', striker); out.badSub = csApplyTo(m, 'a', 'p2', 'p3');
    // fielding side replacement of current bowler
    out.okB = csApplyTo(m, 'b', 'p14', 'p25'); out.bowl = m.innings[0].cur.bl;
    render(); out.note = /replaced by/.test(document.getElementById('app').innerHTML.replace(/<[^>]+>/g,' '));
    out.fit = document.documentElement.scrollWidth <= innerWidth; return out;
  });
  ok(r.r1 === 2 && r.s1 === 'p0', 'run+overthrow: ' + JSON.stringify([r.r1, r.s1])); ok(r.runs === 6 && r.f4 === 0, 'boundary overthrow not a batter four: ' + r.runs + ' ' + r.f4); ok(r.otUsed === null, 'overthrow clears after the ball');
  ok(r.uiOt && r.uiCs, 'panels visible'); ok(/Overthrows: 4 extra runs \(boundary\)/.test(r.comm) && /Overthrows: 1 extra run\./.test(r.comm), 'commentary: ' + r.comm); ok(r.afterUndo === 2, 'undo');
  ok(r.okCs && r.xiHas && r.crease, 'striker replaced'); ok(!r.again, 'replaced player cannot return'); ok(!r.badSub, 'cannot swap two players already in the XI'); ok(r.okB && r.bowl === 'p25', 'bowler replaced'); ok(r.note && r.fit, 'note shown, fits');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: overthrows + concussion');
})();
