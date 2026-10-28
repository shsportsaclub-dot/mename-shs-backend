const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html') + '?scene=board#overlay'); await p.waitForTimeout(500);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players });
    startInnings(m, 0, 'p0', 'p1', 'p11'); S.stream.mid = m.id; ball(m, { r: 4 }); ball(m, { r: 1 });
    S.messages.push({ id: 'm1', text: 'Drinks break', kind: 'info' });
    const get = () => overlayHTML(); const o = { board: get() };
    history.replaceState(null, '', location.pathname + '?scene=lower#overlay'); o.lower = get();
    history.replaceState(null, '', location.pathname + '?scene=ticker#overlay'); o.ticker = get();
    history.replaceState(null, '', location.pathname + '?scene=break#overlay'); S.stream.card = { t: 'Innings break', s: 'Back in 10 minutes' }; o.brk = get();
    history.replaceState(null, '', location.pathname + '#overlay'); o.bug = get();
    return o;
  });
  ok(/ovs-board/.test(r.board) && /Player 0/.test(r.board) && /Player 11/.test(r.board), 'board scene');
  ok(/ovs-low/.test(r.lower) && /Player [01]/.test(r.lower) && /<svg/.test(r.lower) && />5-0</.test(r.lower), 'lower third with avatar');
  ok(/ovs-tk/.test(r.ticker) && /Drinks break/.test(r.ticker), 'ticker scene');
  ok(/Innings break/.test(r.brk) && /Back in 10 minutes/.test(r.brk), 'break card');
  ok(/ovbug/.test(r.bug) && !/ovs-/.test(r.bug), 'default scene is the existing score bug');
  // studio screen
  await p.evaluate(() => { history.replaceState(null, '', location.pathname); window.pullLive = async () => {}; document.body.classList.remove('ovpage'); UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.view = 'stream'; render(); });
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelectorAll('[data-a="ovCopy"]').length === 5), 'five scene URLs listed');
  await p.click('[data-a="ovPrev"][data-v="board"]'); ok(await p.evaluate(() => !!document.querySelector('.ovprev .ovs-board')), 'preview switches scene');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: studio scenes');
})();
