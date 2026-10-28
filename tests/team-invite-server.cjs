const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html') + '?join=team-lions'); await p.waitForTimeout(500);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    const calls = []; window.fetch = async (url, o = {}) => { const m = o.method || 'GET'; calls.push(m + ' ' + url.replace(/^https?:\/\/[^/]+/, '') + ' ' + (o.body || ''));
      if (/shared\/teams\/team-lions$/.test(url) && m === 'GET') return { status: 200, ok: true, json: async () => ({ ok: true, item: { data: { t: { id: 'team-lions', name: 'Hapur Lions', short: 'HPL', color: '#2563eb' } } } }) };
      if (/teamreq\/team-lions$/.test(url) && m === 'POST') return { status: 200, ok: true, json: async () => ({ ok: true, id: 'r1' }) };
      if (/teamreq\/team-lions$/.test(url) && m === 'GET') return { status: 200, ok: true, json: async () => ({ ok: true, owner: true, items: [{ id: 'r9', name: 'Amit', phone: '900', status: 'pending', at: 1 }] }) };
      if (/teamreq\/team-lions\/r9/.test(url)) return { status: 200, ok: true, json: async () => ({ ok: true }) };
      if (/shared\/teams\//.test(url) && m === 'PUT') return { status: 200, ok: true, json: async () => ({ ok: true }) };
      return { status: 404, ok: false, json: async () => ({ ok: false }) } };
    window.pullLive = async () => {}; S.settings.apiUrl = 'https://api.test'; S.tok = 'tok'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; S.teams = []; S.joinReq = [];
    S.user = { id: 'u2', name: 'Sonu', nick: 'Sonu', phone: '9000000002', role: 'viewer', kind: 'Fan' }; UI.stage = 'app'; UI.view = 'home'; render();
    await new Promise(r => setTimeout(r, 1500)); const modal = /Join Hapur Lions/.test(document.body.innerText);
    await A.joinSend(); await new Promise(r => setTimeout(r, 200));
    // owner side
    S.user = { id: 'own', name: 'Cap', role: 'admin', phone: '9000000001', kind: 'Scorer' }; S.teams = [{ id: 'team-lions', name: 'Hapur Lions', short: 'HPL', color: '#2563eb', players: [], level: 'club' }];
    UI.td = { id: 'team-lions', tab: 'req' }; UI.view = 'tdash'; render(); await new Promise(r => setTimeout(r, 700));
    const got = S.joinReq.find(x => x.sid === 'r9'); const shown = /Amit/.test(document.body.innerText);
    if (got) A.tdAcc({ id: got.id }); await new Promise(r => setTimeout(r, 200));
    return { modal, post: calls.some(c => /^POST \/api\/teamreq\/team-lions \{.*Sonu/.test(c)), pub: calls.some(c => /^PUT \/api\/shared\/teams\/team-lions/.test(c)), shown, accepted: calls.some(c => /^PUT \/api\/teamreq\/team-lions\/r9 .*accepted/.test(c)), added: S.players.some(x => x.name === 'Amit' && x.team === 'team-lions') } });
  ok(r.modal, 'join link shows the team found on the server'); ok(r.post, 'request posted to the server'); ok(r.pub, 'owner publishes the team card'); ok(r.shown, 'owner sees the request from the server'); ok(r.accepted && r.added, 'accept updates server and adds the player');
  await p.evaluate(() => { UI.td.tab = 'invite'; render(); }); await p.waitForTimeout(300); ok(await p.evaluate(() => !!document.querySelector('#tdQr canvas')), 'QR shown on the invite tab');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: team invite through the server');
})();
