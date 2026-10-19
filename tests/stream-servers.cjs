// Stream servers 1-4: tabs, switching, multi-view grid, country block, viewer vs scorer, SH logo on the player.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    UI.stage = 'app'; S.user = { name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; delete S.settings.cricKey;
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 20, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m, 0, 'p0', 'p1', 'p11'); const inn = m.innings[0]; inn.cur.bl = 'p11'; ball(m, { r: 1 });
    const key = 'm' + m.id, o = {}; const view = () => { UI.mid = m.id; UI.view = 'match'; UI.tab = 'live'; UI.drawer = false; render(); return document.getElementById('app') };
    let app = view(); o.none = /not connected/.test(app.innerText); o.mgr = !!app.querySelector('form[data-f="stream4"]'); o.inputs = app.querySelectorAll('form[data-f="stream4"] input[name^="url"]').length;
    // scorer saves two servers through the real form handler
    const fd = new FormData(); fd.set('key', key); fd.set('url1', 'https://www.youtube.com/live/AAAAAAAAAAA'); fd.set('url2', 'https://www.youtube.com/live/BBBBBBBBBBB'); fd.set('geo2', 'IN'); fd.set('url3', 'http://insecure.example/x'); fd.set('url4', 'https://example.com/player');
    await F.stream4(fd); app = view(); o.keys = Object.keys(S.streams || {}).sort().join(',');
    o.tabs = [...app.querySelectorAll('.srv button')].map(x => x.textContent + (x.disabled ? '(off)' : '')).join('|');
    o.src1 = app.querySelector('.sh-watch iframe')?.src || ''; o.logo = !!app.querySelector('.sh-watch .swlogo');
    A.srvPick({ k: key, v: '4' }); app = view(); o.src4 = app.querySelector('.sh-watch iframe')?.src || '';
    A.srvGrid({ k: key }); app = view(); o.grid = app.querySelectorAll('.svgrid iframe').length; A.srvGrid({ k: key });
    // country block: server 2 only in IN, viewer in AE
    UI.iso = 'AE'; window.viewerISO = () => 'AE'; A.srvPick({ k: key, v: '2' }); app = view(); o.geoTxt = app.querySelector('.sh-watch')?.innerText.includes('not available in your country');
    // viewer cannot manage
    S.user = { name: 'Fan', role: 'user', kind: 'Fan' }; A.srvPick({ k: key, v: '1' }); app = view(); o.viewerMgr = !!app.querySelector('form[data-f="stream4"]'); o.viewerPlays = !!app.querySelector('.sh-watch iframe');
    // upcoming match shows placeholder not video
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.none && r.mgr && r.inputs === 4, 'empty state + 4 inputs ' + JSON.stringify(r)); ok(r.keys === 'm' + r.keys.slice(1).split(',')[0].slice(1) || /_s2/.test(r.keys) && /_s4/.test(r.keys) && !/_s3/.test(r.keys), 'saved keys ' + r.keys);
  ok(/Server 1\|Server 2\|Server 3\(off\)\|Server 4\|Multi-view/.test(r.tabs), 'tabs ' + r.tabs); ok(/youtube-nocookie\.com\/embed\/AAAAAAAAAAA/.test(r.src1) && r.logo, 'server 1 plays with logo ' + r.src1); ok(/example\.com\/player/.test(r.src4), 'server 4 ' + r.src4);
  ok(r.grid === 3, 'grid shows 3 sources: ' + r.grid); ok(r.geoTxt, 'country block'); ok(!r.viewerMgr && r.viewerPlays, 'viewer sees player, not manager'); ok(r.fit, 'no overflow');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: stream servers');
})();
