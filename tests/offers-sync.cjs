const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    window.pullLive = async () => {}; UI.stage = 'app'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    S.settings.apiUrl = 'https://api.test'; S.tok = 'tok';
    const offers = []; const calls = [];
    window.fetch = async (url, o = {}) => { const m = /\/api\/offers\/([\w-]+)(?:\/([\w-]+))?$/.exec(url), meth = o.method || 'GET'; calls.push(meth + ' ' + url);
      if (!m) return { status: 404, json: async () => ({ ok: false }) };
      const body = o.body ? JSON.parse(o.body) : {}, buyer = window.__who === 'buyer';
      if (meth === 'POST') { const x = { id: 'o' + (offers.length + 1), amt: body.amt, msg: body.msg, phone: body.phone, name: body.name, at: 5, status: 'pending' }; offers.push(x); return { status: 200, json: async () => ({ ok: true, id: x.id }) } }
      if (meth === 'PUT') { const x = offers.find(z => z.id === m[2]); x.status = body.status; x.counter = body.counter; x.answered = 9; return { status: 200, json: async () => ({ ok: true }) } }
      return { status: 200, json: async () => buyer ? ({ ok: true, owner: false, mine: offers.map(({ phone, name, ...r }) => r) }) : ({ ok: true, owner: true, items: offers }) } };
    // buyer sends
    window.__who = 'buyer'; S.user = { id: 'buyer1', phone: '9000000002', name: 'Buyer', nick: 'Buyer', role: 'viewer', kind: 'Fan' };
    S.market = [{ id: 'mk-bat-1', kind: 'used', title: 'Willow bat', cat: 'Bats', price: '1200', phone: '9000000001', uid: 'seller1', by: 'Seller', status: 'open', t: 1, rm: 1 }]; S.offers = [];
    const fd = { get: k => ({ lid: 'mk-bat-1', phone: '9000000002', amt: 'Rs 900', msg: 'ok?' })[k] };
    F.mkOfferSend(fd); await new Promise(r => setTimeout(r, 200));
    const sent = S.offers[0] && S.offers[0].sid === 'o1' && S.offers[0].mine === 1;
    // seller device
    window.__who = 'seller'; S.user = { id: 'seller1', phone: '9000000001', name: 'Seller', nick: 'Seller', role: 'viewer', kind: 'Fan' };
    S.market = [{ id: 'mk-bat-1', kind: 'used', title: 'Willow bat', cat: 'Bats', price: '1200', phone: '9000000001', uid: 'seller1', by: 'Seller', status: 'open', t: 1 }]; S.offers = [];
    await offSync(); const got = S.offers.length === 1 && S.offers[0].amt === '900' && S.offers[0].phone === '9000000002';
    S.offers[0].status = 'countered'; S.offers[0].counter = '1050'; await offSync(); const up = offers[0].status === 'countered' && offers[0].counter === '1050';
    // buyer device again
    window.__who = 'buyer'; S.user = { id: 'buyer1', phone: '9000000002', name: 'Buyer', nick: 'Buyer', role: 'viewer', kind: 'Fan' };
    S.market = [{ id: 'mk-bat-1', kind: 'used', title: 'Willow bat', cat: 'Bats', price: '1200', phone: '9000000001', uid: 'seller1', by: 'Seller', status: 'open', t: 1, rm: 1 }];
    S.offers = [{ id: 'l1', sid: 'o1', lid: 'mk-bat-1', by: 'Buyer', amt: '900', mine: 1, t: 1 }]; await offSync();
    const back = S.offers[0].status === 'countered' && S.offers[0].counter === '1050';
    return { sent, got, up, back };
  });
  ok(r.sent, 'offer posted with server id'); ok(r.got, 'seller receives offer'); ok(r.up, 'seller answer reaches server'); ok(r.back, 'buyer sees answer');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: offers sync');
})();
