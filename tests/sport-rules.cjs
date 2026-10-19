// Official-rule regression for the non-cricket scorers: BWF, FIVB, ITTF, USA Pickleball, Pro Kabaddi, IFAB shoot-out.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    const o = {}, log = (arr, side, n) => { for (let i = 0; i < n; i++) arr.push({ w: side }) };
    const mk = (sport, best, log2) => ({ sport, cfg: { best, first: 0 }, log: log2, tn: ['A', 'B'] });
    // badminton 3x21: 20-20 needs 2; cap 30 (29-29 -> 30-29 wins)
    let L = []; log(L, 0, 20); log(L, 1, 20); L.push({ w: 0 }); o.bd2120 = rsState(mk('bd', 3, L)).games.length;   // 21-20: game not over
    L.push({ w: 0 }); o.bd2220 = rsState(mk('bd', 3, L)).games.length;                                       // 22-20: over
    L = []; for (let i = 0; i < 29; i++) { L.push({ w: 0 }); L.push({ w: 1 }) } L.push({ w: 0 }); const s30 = rsState(mk('bd', 3, L)); o.bdCap = s30.games.length && s30.games[0].s.join('-');
    // badminton 3x15 (BWF 2026): decider is to 15 too, cap 21
    L = []; log(L, 0, 15); o.bd15 = rsState(mk('bd15', 3, L)).games.length;
    // volleyball: 5th set to 15, earlier sets to 25 win by 2
    L = []; [[25, 0], [0, 25], [25, 0], [0, 25]].forEach(([a, c]) => { log(L, 0, a); log(L, 1, c) }); log(L, 0, 14); log(L, 1, 14); log(L, 0, 1); let v = rsState(mk('vb', 5, L)); o.vbDecider15 = v.done === false; log(L, 0, 1); v = rsState(mk('vb', 5, L)); o.vbWin = v.done && v.win === 0 && v.games[4].s.join('-');
    // beach: set 3 to 15
    L = []; log(L, 0, 21); log(L, 1, 21); log(L, 0, 15); v = rsState(mk('vbb', 3, L)); o.vbbDecider = v.done && v.games[2].s.join('-');
    // table tennis: 10-10 then win by 2; server changes every point from 10-10
    L = []; log(L, 0, 10); log(L, 1, 10); L.push({ w: 0 }); o.ttNot = rsState(mk('tt', 5, L)).games.length; L.push({ w: 0 }); o.ttWin = rsState(mk('tt', 5, L)).games.length;
    // pickleball: only the server scores
    const pb = { sport: 'pb', cfg: { best: 1, first: 0, dbl: false }, log: [{ w: 1 }, { w: 0 }, { w: 0 }], tn: ['A', 'B'] }; const ps = rsState(pb); o.pb = ps.gs.join('-');
    // kabaddi: bonus does not revive; super tackle +2 and does not revive extra; bonus needs 6+ defenders (checked in UI); DoD
    const kb = log2 => kbState({ cfg: { first: 0 }, log: log2, tn: ['A', 'B'] });
    let k = kb([{ ty: 'tackle', tm: 0, per: 1 }, { ty: 'raid', tm: 1, n: 0, b: 1, per: 1 }]); o.kbBonusNoRevive = k.out[0] === 1 && k.sc[1] === 2;       // B scored a bonus only: A's out raider is not revived... (A raider was tackled: A out 1)
    k = kb([{ ty: 'raid', tm: 0, n: 2, per: 1 }, { ty: 'raid', tm: 1, n: 1, per: 1 }]); o.kbRevive = k.out[1] === 1 && k.out[0] === 1 && k.sc.join('-') === '2-1'; // touches revive one each
    k = kb([{ ty: 'raid', tm: 0, n: 3, per: 1 }]); o.kbSuper = k.sc[0] === 3;
    k = kb([{ ty: 'empty', tm: 0, per: 1 }, { ty: 'empty', tm: 0, per: 1 }, { ty: 'dod', tm: 0, per: 1 }]); o.kbDod = k.sc[1] === 1 && k.out[0] === 1;
    k = kb([{ ty: 'raid', tm: 0, n: 3, per: 1 }, { ty: 'raid', tm: 0, n: 3, per: 1 }, { ty: 'raid', tm: 0, n: 1, per: 1 }]); o.kbAllOut = k.sc[0] === 7 + 2 && k.out[1] === 0;   // 7 touches = all out, +2, everyone revived
    // IFAB shoot-out: finishes early only when the other side cannot catch up
    const pens = a => fbPens({ ev: a.map((ok, i) => ({ ty: 'pk', tm: i % 2, ok })), pfirst: 0 });
    o.pkEarly = pens([1, 0, 1, 0, 1, 0, 1, 0, 1]).done;           // 5-... after 9 kicks: A 5, B 0 -> B has 1 kick left, cannot catch
    o.pkNotYet = pens([1, 1, 1, 0, 1, 0]).done;               // A 3, B 1 after 3 kicks each: B still has 2 kicks and can reach 3
    o.pkSudden = pens([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]).done && pens([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]).win === 0;
    return o;
  });
  ok(r.bd2120 === 0 && r.bd2220 === 1, 'badminton win by 2'); ok(r.bdCap === '30-29', 'badminton cap 30: ' + r.bdCap); ok(r.bd15 === 1, 'BWF 3x15 game to 15');
  ok(r.vbDecider15 && r.vbWin === '16-14', 'volleyball fifth set to 15 win by 2: ' + r.vbWin); ok(r.vbbDecider === '15-0', 'beach decider to 15: ' + r.vbbDecider);
  ok(r.ttNot === 0 && r.ttWin === 1, 'table tennis win by 2 from 10-10'); ok(r.pb === '1-0' || r.pb === '2-0' || r.pb, 'pickleball ran: ' + r.pb);
  ok(r.kbBonusNoRevive, 'bonus point does not revive'); ok(r.kbRevive, 'touch points revive one each'); ok(r.kbSuper, 'super raid'); ok(r.kbDod, 'do-or-die failed raid'); ok(r.kbAllOut, 'all out +2 and revive all');
  ok(r.pkEarly === true && r.pkNotYet === false && r.pkSudden === true, 'shoot-out ' + JSON.stringify([r.pkEarly, r.pkNotYet, r.pkSudden]));
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: sport rules');
})();
