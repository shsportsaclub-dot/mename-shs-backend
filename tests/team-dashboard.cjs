const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', nick: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.teams = [{ id: 't1', name: 'Hapur Lions', short: 'HPL', color: '#2563eb', players: ['p1'], level: 'club' }, { id: 't2', name: 'Meerut Kings', short: 'MRK', color: '#c0392b', players: [], level: 'club' }];
    S.players = [{ id: 'p1', name: 'Rahul Verma', role: 'BAT', team: 't1' }]; S.matches = []; UI.view = 'teams'; render(); });
  const c = async f => p.evaluate(f);
  await p.click('[data-a="tdOpen"][data-id="t1"]'); await p.waitForTimeout(150);
  ok(await c(() => UI.view === 'tdash' && document.body.innerText.includes('Rahul Verma')), 'dashboard opens with roster');
  await p.click('[data-a="tdRole"][data-v="cap"]'); ok(await c(() => S.teams[0].cap === 'p1'), 'captain set');
  await p.click('[data-a="tdTab"][data-v="invite"]'); ok(await c(() => document.querySelector('input[readonly]').value.includes('?join=t1')), 'invite link');
  await p.fill('form[data-f="tdAdd"] input[name=name]', 'Amit Kumar'); await p.click('form[data-f="tdAdd"] button'); ok(await c(() => S.teams[0].players.length === 2), 'add by name');
  // join request via link flow
  await c(() => { S.joinReq.push({ id: 'jr1', sid: 's1', tid: 't1', name: 'Sonu', phone: '9999999999', status: 'pending', at: 1 }); UI.td.tab = 'req'; render(); });
  ok(await c(() => S.joinReq.length === 1 && document.body.innerText.includes('Sonu')), 'join request listed');
  await p.click('[data-a="tdAcc"]'); ok(await c(() => S.teams[0].players.length === 3 && S.players.find(x => x.name === 'Sonu').team === 't1'), 'accept adds player');
  // transfer
  await c(() => { UI.td.tab = 'squad'; render(); }); await p.click('[data-a="tdXfer"][data-id="p1"]'); await p.selectOption('form[data-f="tdXfer"] select', 't2'); await p.click('form[data-f="tdXfer"] button.btn');
  ok(await c(() => S.transfers.length === 1 && S.teams[0].players.includes('p1')), 'transfer pending, player stays');
  await c(() => { UI.td = { id: 't2', tab: 'tr' }; render(); }); await p.click('[data-a="tdTrAcc"]');
  ok(await c(() => S.players.find(x => x.id === 'p1').team === 't2' && !S.teams[0].players.includes('p1') && S.teams[0].cap == null), 'transfer accepted moves player, clears captain');
  await c(() => { UI.td = { id: 't1', tab: 'squad' }; render(); }); await p.click('[data-a="tdRelease"]'); ok(await c(() => S.teams[0].players.length === 1), 'release');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: team dashboard');
})();
