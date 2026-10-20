// Match setup step 2: filter, logo style/generate/upload/colour, demo teams with players and XI, works with zero teams.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(500);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), o = {}, M = () => (document.querySelector('.modal')||document.body).innerText;
    UI.stage = 'app'; S.user = { id: 'u1', name: 'Sc', nick: 'Sc', role: 'admin' }; S.teams = []; S.players = []; S.matches = []; S.wiz = null; UI.view = 'home'; render();
    A.newMatch(); await w(100); S.wiz.step = 1; wzShow(); await w(100); o.opens = /Team A/.test(M()) || /no team yet/.test(M()); o.hasFilter = /School \/ College/.test(M()); o.demoBtn = /Add 2 demo teams/.test(M());
    A.wzDemo(); await w(100); o.teams = S.teams.length === 2 && S.players.length === 22 && S.teams.every(t => t.players.length === 11); o.xi = S.wiz.xi[S.wiz.a].length === 11 && S.wiz.a !== S.wiz.b; o.roles = S.players.filter(p => p.role === 'WK').length === 2;
    A.wzDemo(); o.noDup = S.teams.length === 2;
    const t = T(S.wiz.a); A.wzPreset({ id: t.id, v: '3' }); o.preset = t.preset === 3 && !t.logo; const c0 = t.color; A.wzGen({ id: t.id }); o.gen = t.preset >= 0 && t.preset < 6 && /^#/.test(t.color);
    C.wzColor('#112233', { dataset: { id: t.id } }); o.col = t.color === '#112233';
    t.logo = 'data:image/png;base64,AAAA'; wzShow(); await w(50); o.upBtn = /Upload from gallery/.test(M()) && !!document.querySelector('input[data-c=wzLogo]');
    A.wzTf({ v: 'academy' }); await w(50); o.filtered = [...document.querySelectorAll('select[name=a] option')].length === 1; A.wzTf({ v: 'all' });
    C.wzTq('tigers'); await w(50); o.search = [...document.querySelectorAll('select[name=b] option')].length >= 1; C.wzTq('');
    document.getElementById('wz-tn').value = 'Alpha XI'; document.getElementById('wz-tl').value = 'school'; A.wzTeam(); await w(50); o.reg = S.teams.some(x => x.name === 'Alpha XI' && x.level === 'school');
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of Object.keys(r)) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: wizard teams');
})();
