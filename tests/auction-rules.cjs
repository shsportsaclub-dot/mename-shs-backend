// Auction rules engine: price-slab bid steps, purse reserve, category/overseas limits, cap, undo, retention, RTM, re-auction, social handles, results.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const fd = o => { const f = new FormData(); for (const k in o) f.append(k, o[k]); return f; };
    F.auCreate(fd({ name: 'Test Cup', venue: 'Hyd', ppt: 3, pts: 1000, base: 100, inc: 50 })); const a = S.auc[S.auc.length - 1], o = {};
    F.au2Team(fd({ aid: a.id, tid: '', name: 'Sky Lions', short: 'sky', owner: 'Ravi', s_ig: '@skylions', s_x: 'javascript:alert(1)', s_web: 'https://example.com' }));
    F.au2Team(fd({ aid: a.id, tid: '', name: 'Blue Hawks', short: 'BLU' }));
    o.dupBlocked = (F.au2Team(fd({ aid: a.id, tid: '', name: 'Other', short: 'SKY' })), a.teams.length === 2);
    const t1 = a.teams[0], t2 = a.teams[1]; o.soc = JSON.stringify(t1.social); o.short = t1.short;
    F.au2Rules(fd({ aid: a.id, pts: 1000, base: 100, min: 3, ppt: 3, slabs: '300:50, *:100', quota: 'A:1', fgn: 1, cap: 600, retain: 1, rtm: 1, reauc: 20 }));
    o.rules = JSON.stringify(a.rules); o.bad = (F.au2Rules(fd({ aid: a.id, pts: 1000, base: 100, min: 3, ppt: 3, slabs: 'oops', quota: '' })), a.rules.cap);
    const add = (id, cat, fgn, prev) => a.players.push({ id, name: id, cat, skill: 'Batter', base: 100, st: null, fgn, prev });
    add('p1', 'A', false); add('p2', 'A', false); add('p3', 'B', true); add('p4', 'B', true); add('p5', 'B', false, t2.id);
    // step slabs
    a.cur = 'p1'; a.cbase = 100; a.bid = null; o.nb0 = au2Nb(a); a.bid = 250; o.nb250 = au2Nb(a); a.bid = 300; o.nb300 = au2Nb(a);
    // reserve: need (3-0-1)=2 more * 100 = 200 reserved
    o.max0 = aucMax(a, t1);
    a.bid = null; A.auBid({ v: t1.id }); o.bid1 = a.bid; A.auBid({ v: t2.id }); o.bid2 = a.bid; A.au2Undo(); o.undo = a.bid + ':' + a.bidTeam === '100:' + t1.id;
    a.bid = 600; a.bidTeam = t2.id; A.auBid({ v: t1.id }); o.cap = a.bid; // next 700 > cap 600
    a.bid = 200; a.bidTeam = t1.id; A.auSold(); o.sold1 = a.players[0].st + a.players[0].team;
    // category limit A:1 -> t1 cannot bid on p2 (cat A)
    a.cur = 'p2'; a.bid = null; o.whyCat = au2Why(a, t1, 100, a.players[1]);
    // overseas limit 1: sell p3 to t1, then p4 blocked
    a.cur = 'p3'; a.bid = 100; a.bidTeam = t1.id; A.auSold(); a.cur = 'p4'; o.whyFgn = au2Why(a, t1, 100, a.players[3]);
    // squad full
    a.cur = 'p5'; o.whyOk = au2Why(a, t2, 100, a.players[4]);
    // unsold + re-auction lowers base 20%
    a.cur = 'p4'; a.bid = null; a.bidTeam = null; A.auUns(); o.uns = a.players[3].st; A.au2Reauc(); o.reBase = a.players[3].base + ':' + a.players[3].st + ':' + a.round;
    // retention
    F.au2Retain(fd({ aid: a.id, tid: t2.id, pid: 'p5', price: 200 })); o.ret = a.players[4].st + ':' + !!a.players[4].ret + ':' + t2.purse;
    // UI renders
    UI.view = 'auction'; UI.au.open = a.id; for (const d of ['teams', 'players', 'rules', 'live', 'res', 'reg']) { UI.au.dtab = d; render(); o['ui_' + d] = (document.getElementById('app').innerText || '').length; }
    UI.au.dtab = 'teams'; render(); o.socLinks = [...document.querySelectorAll('.au2soc')].map(x => x.getAttribute('href')).join('|'); o.fit = document.documentElement.scrollWidth <= innerWidth;
    UI.au.dtab = 'res'; render(); o.res = document.getElementById('app').innerText.slice(0, 300);
    return o;
  });
  ok(r.dupBlocked, 'duplicate short name allowed'); ok(r.short === 'SKY', 'short upper'); ok(/skylions/.test(r.soc) && !/javascript/.test(r.soc), 'soc stored ' + r.soc);
  ok(/"slabs":\[\{"upto":300,"step":50\},\{"upto":null,"step":100\}\]/.test(r.rules), 'slabs ' + r.rules); ok(r.bad === 600, 'bad rules rejected');
  ok(r.nb0 === 100 && r.nb250 === 300 && r.nb300 === 400, 'steps ' + [r.nb0, r.nb250, r.nb300]);
  ok(r.max0 === 800, 'reserve max ' + r.max0); ok(r.bid1 === 100 && r.bid2 === 150, 'bids ' + r.bid1 + ',' + r.bid2); ok(r.undo, 'undo'); ok(r.cap === 600, 'cap ' + r.cap);
  ok(r.sold1 === 'soldundefined' ? false : /^sold/.test(r.sold1), 'sold'); ok(/Category A limit 1/.test(r.whyCat), 'cat limit ' + r.whyCat); ok(/Overseas limit 1/.test(r.whyFgn), 'fgn ' + r.whyFgn);
  ok(r.whyOk === '', 'ok bid blocked: ' + r.whyOk); ok(r.uns === 'unsold', 'unsold'); ok(/^80:/.test(r.reBase), 're-auction ' + r.reBase); ok(/^sold:true:800$/.test(r.ret), 'retention ' + r.ret);
  for (const d of ['teams', 'players', 'rules', 'live', 'res', 'reg']) ok(r['ui_' + d] > 20, 'ui ' + d);
  ok(/instagram\.com\/skylions/.test(r.socLinks) && !/javascript:/i.test(r.socLinks) && !/https:\/\/x\.com/.test(r.socLinks), 'social links ' + r.socLinks); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  console.log(JSON.stringify(r, null, 0).slice(0, 900));
  await b.close(); if (!process.exitCode) console.log('PASS: auction rules');
})();
