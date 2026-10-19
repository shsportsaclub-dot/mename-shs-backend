// Ground booking v2: price table, slot grid, conflicts, blackout, advance, status flow, payment record, calendar UI.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'Owner', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const fd = o => { const f = new FormData(); for (const k in o) f.append(k, o[k]); return f; }, o = {};
    const day = (dow) => { const d = new Date(); d.setDate(d.getDate() + 7 + ((dow - d.getDay() + 7) % 7)); return d.toISOString().slice(0, 10); }, wed = day(3), sat = day(6);
    F.gbGround(fd({ gid: '', name: 'Sky Turf', city: 'Hyd', sports: 'Cricket, Football', base: 1000, peak: 1500, wkend: 2000, peakFrom: 17, slotMin: 60, open: '06:00', close: '22:00', advPct: 25, cancelHrs: 24, blackout: '2099-01-01', phone: '9876543210', upi: 'sky@okbank', on: 'on' }));
    const g = S.grounds[S.grounds.length - 1]; o.g = !!g && g.rates.peak === 1500;
    o.weekday = gbPrice(g, wed, 600, 120); o.peak = gbPrice(g, wed, 17 * 60, 120); o.mixed = gbPrice(g, wed, 16 * 60, 120); o.wkend = gbPrice(g, sat, 600, 120);
    o.badBlack = (F.gbGround(fd({ gid: g.id, name: 'Sky Turf', base: 1, blackout: 'xx', open: '06:00', close: '22:00', slotMin: 60 })), g.rates.base);
    o.badTime = (F.gbGround(fd({ gid: g.id, name: 'Sky Turf', base: 1, blackout: '', open: '10:00', close: '09:00', slotMin: 60 })), g.rates.base);
    F.gbBook(fd({ ground: g.id, date: wed, start: '10:00', dur: 120, who: 'Ravi', phone: '9000000001' })); const b1 = S.bookings[S.bookings.length - 1]; o.b1 = b1.status + ':' + b1.amt + ':' + b1.adv;
    const n0 = S.bookings.length; F.gbBook(fd({ ground: g.id, date: wed, start: '11:00', dur: 60, who: 'Ravi', phone: '9000000002' })); o.conflict = S.bookings.length === n0;
    F.gbBook(fd({ ground: g.id, date: wed, start: '12:00', dur: 60, who: 'Ravi', phone: '9000000003' })); o.adjacent = S.bookings.length === n0 + 1;
    F.gbBook(fd({ ground: g.id, date: '2099-01-01', start: '10:00', dur: 60, who: 'X', phone: '9000000004' })); o.black = S.bookings.length === n0 + 1;
    F.gbBook(fd({ ground: g.id, date: wed, start: '21:00', dur: 120, who: 'X', phone: '9000000005' })); o.late = S.bookings.length === n0 + 1;
    F.gbBook(fd({ ground: g.id, date: wed, start: '14:00', dur: 60, who: 'X', phone: 'abc' })); o.badPhone = S.bookings.length === n0 + 1;
    S.user = { id: 'u2', name: 'Guest', role: 'player' }; F.gbBook(fd({ ground: g.id, date: wed, start: '15:00', dur: 60, who: 'Guest', phone: '9000000006' })); const b2 = S.bookings[S.bookings.length - 1]; o.guest = b2.status + ':' + b2.uid;
    A.gbSet({ id: b2.id, v: 'confirmed' }); o.guestCannotAccept = b2.status;
    S.user = { id: 'u1', name: 'Owner', role: 'admin' }; A.gbSet({ id: b2.id, v: 'confirmed' }); o.accepted = b2.status;
    F.gbPayRec(fd({ id: b2.id, amt: 99999 })); o.overpay = b2.paid; F.gbPayRec(fd({ id: b2.id, amt: 500 })); o.paid = b2.paid;
    A.gbSet({ id: b2.id, v: 'cancelled' }); o.cancel = b2.status + ':' + /in time/.test(b2.cancelNote);
    F.gbBook(fd({ ground: g.id, date: wed, start: '15:00', dur: 60, who: 'Again', phone: '9000000007' })); o.freed = S.bookings[S.bookings.length - 1].who;
    // legacy slot booking still blocks
    S.bookings.push({ id: 'leg', ground: g.id, date: sat, slot: 'Morning 6-10', who: 'Old', amt: 100, paid: true, status: 'booked' }); o.legacy = !!gbBusy(g, sat, 540, 600) && !gbBusy(g, sat, 600, 660);
    UI.view = 'book'; for (const t of ['book', 'cal', 'list', 'grounds']) { UI.gb.tab = t; UI.gb.date = wed; render(); o['ui_' + t] = document.getElementById('app').innerText.length; }
    UI.gb.tab = 'cal'; render(); o.cells = document.querySelectorAll('.gbc.fr').length + ':' + document.querySelectorAll('.gbc.bk').length;
    A.gbPick({ g: g.id, t: '18:00' }); o.picked = UI.gb.tab + ':' + document.querySelector('select[name=start]').value;
    const q = document.getElementById('gbQ').innerText; o.quote = q; o.upi = (S.bookings.find(x => x.id === b1.id), UI.gb.tab = 'list', render(), !!document.querySelector('a[href^="upi://pay?pa=sky%40okbank"]'));
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.g, 'ground saved'); ok(r.weekday === 2000 && r.peak === 3000 && r.mixed === 2500 && r.wkend === 4000, 'prices ' + [r.weekday, r.peak, r.mixed, r.wkend]);
  ok(r.badBlack === 1000 && r.badTime === 1000, 'invalid ground edits rejected'); ok(r.b1 === 'confirmed:2000:500', 'b1 ' + r.b1); ok(r.conflict && r.adjacent && r.black && r.late && r.badPhone, 'validation ' + JSON.stringify([r.conflict, r.adjacent, r.black, r.late, r.badPhone]));
  ok(r.guest === 'requested:u2', 'guest ' + r.guest); ok(r.guestCannotAccept === 'requested', 'guest accepted self'); ok(r.accepted === 'confirmed', 'owner accept'); ok(r.overpay === 0 && r.paid === 500, 'payment ' + r.overpay + ',' + r.paid);
  ok(r.cancel === 'cancelled:true', 'cancel ' + r.cancel); ok(r.freed === 'Again', 'slot freed'); ok(r.legacy, 'legacy slot');
  for (const t of ['book', 'cal', 'list', 'grounds']) ok(r['ui_' + t] > 50, 'ui ' + t); ok(/^\d+:\d+$/.test(r.cells) && +r.cells.split(':')[1] >= 2, 'cells ' + r.cells); ok(r.picked === 'book:18:00', 'pick ' + r.picked); ok(/total/.test(r.quote), 'quote ' + r.quote); ok(r.upi, 'upi link'); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: ground booking');
})();
