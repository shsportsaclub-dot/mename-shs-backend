const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    window.pullLive = async () => {}; UI.stage = 'app'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.settings.apiUrl = 'https://api.test'; S.tok = 'tok'; S.user = { id: 'u1', name: 'Seller', nick: 'Seller', phone: '9000000001', role: 'viewer', kind: 'Fan' };
    const server = {}; const calls = [];
    window.fetch = async (url, o = {}) => { calls.push((o.method || 'GET') + ' ' + url); const m = /\/api\/shared\/market(?:\/(.+))?$/.exec(url);
      if (!m) return { json: async () => ({ ok: false }), status: 404 };
      if ((o.method || 'GET') === 'PUT') { const x = JSON.parse(o.body).data.x; server[m[1]] = { id: m[1], owner: '9000000001', ownerName: 'Seller', updated: Date.now(), data: { x } }; return { status: 200, json: async () => ({ ok: true }) } }
      return { status: 200, json: async () => ({ ok: true, items: Object.values(server) }) } };
    S.market = [{ id: 'mine1', kind: 'used', title: 'My bat', cat: 'Bats', price: '900', phone: '9000000001', uid: 'u1', by: 'Seller', status: 'open', t: 1, img: '' }];
    await mkPush(); const pushed = !!server.mine1 && server.mine1.data.x.title === 'My bat' && !('rm' in server.mine1.data.x);
    // someone else's listing arrives
    server.other1 = { id: 'other1', owner: '9000000002', ownerName: 'Ravi', updated: 5, data: { x: { id: 'other1', kind: 'used', title: 'Ravi gloves', cat: 'Gloves', price: '500', phone: '9000000002', status: 'open', uid: 'zzz' } } };
    await mkPull(); const o = S.market.find(x => x.id === 'other1');
    const got = !!o && o.rm === 1 && o.title === 'Ravi gloves';
    // removal on the server removes it here
    server.other1.data.x.status = 'removed'; server.other1.updated = 9; await mkPull(); const gone = !S.market.some(x => x.id === 'other1');
    // new device: my own listing comes back as mine
    S.market = []; UI.mkSync.hash = {}; await mkPull(); const back = S.market.find(x => x.id === 'mine1');
    return { pushed, got, gone, back: !!back && back.rm === 0 && back.uid === 'u1' };
  });
  ok(r.pushed, 'own listing published without local flags'); ok(r.got, 'other seller listing appears read-only'); ok(r.gone, 'removed listing disappears'); ok(r.back, 'own listing restored on a new device as mine');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: marketplace sync');
})();
