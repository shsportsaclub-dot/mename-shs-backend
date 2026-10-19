// Academy v2: batches, students, attendance, fee records, coach ratings, training log.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'Coach', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const fd = o => { const f = new FormData(); for (const k in o) f.append(k, o[k]); return f; }, o = {}, a = ayD();
    F.ayCoach(fd({ name: 'Suresh', sports: 'Cricket', cert: 'BCCI Level 1' })); F.ayCoach(fd({ name: 'suresh' })); o.coaches = a.coaches.length;
    F.ayBatch(fd({ name: 'U14 Morning', sport: 'Cricket', d_Mon: 'on', d_Wed: 'on', time: '6-8 AM', coach: 'Suresh', fee: 1200, cap: 20 })); o.batch = a.batches[0].days.join('');
    F.ayStudent(fd({ name: 'Arjun', sport: 'Cricket', batch: a.batches[0].id, fee: 1200, parent: 'Mr Rao', phone: '9000000001', level: 'Beginner' })); F.ayStudent(fd({ name: 'Bad', fee: 5, phone: 'x' }));
    o.students = a.students.length; const s = a.students[0]; o.coachAuto = s.coach;
    const day = UI.ay.date; A.ayMark({ id: s.id, v: '1' }); o.present = s.att[day]; A.ayMark({ id: s.id, v: '0' }); o.absent = s.att[day]; A.ayMark({ id: s.id, v: '1' }); A.ayMark({ id: s.id, v: '1' }); o.toggled = s.att[day];
    F.ayPayRec(fd({ sid: s.id, amt: 99999 })); o.over = ayPaidAmt(s, UI.ay.month); F.ayPayRec(fd({ sid: s.id, amt: 700, mode: 'UPI' })); F.ayPayRec(fd({ sid: s.id, amt: 500, mode: 'Cash' })); o.paid = ayPaidAmt(s, UI.ay.month);
    S.user = { id: 'par1', name: 'Parent', role: 'player' }; F.ayReview(fd({ cid: a.coaches[0].id, r: 4 })); F.ayReview(fd({ cid: a.coaches[0].id, r: 5 })); F.ayStudent(fd({ name: 'Hack', fee: 1 })); o.rev = a.reviews.length + ':' + ayCoachAvg(a.coaches[0]).avg + ':' + a.students.length;
    S.user = { id: 'u1', name: 'Coach', role: 'admin' }; F.ayLog(fd({ sid: s.id, date: day, skill: 'Cover drive', r: 4, coach: 'Suresh' })); F.ayLog(fd({ sid: s.id, date: day, skill: 'Cover drive', r: 2 })); o.log = a.log.length;
    UI.view = 'academy'; for (const t of ['students', 'batches', 'attend', 'fees', 'coaches', 'train']) { UI.ay.tab = t; UI.ay.sid = s.id; render(); o['ui_' + t] = document.getElementById('app').innerText.length; }
    UI.ay.tab = 'train'; render(); o.skill = /Cover drive/.test(document.getElementById('app').innerText) && /3\.0/.test(document.getElementById('app').innerText);
    UI.ay.tab = 'fees'; render(); o.paidPill = /Paid/.test(document.getElementById('app').innerText); o.fit = document.documentElement.scrollWidth <= innerWidth;
    A.ayMark({ id: s.id, v: '1' }); A.ayProfile({ id: s.id }); o.prof = /Attendance: 100%/.test(JSON.stringify(UI.modal)); return o;
  });
  ok(r.coaches === 1, 'dup coach'); ok(r.batch === 'MonWed', 'days'); ok(r.students === 1, 'students ' + r.students); ok(r.coachAuto === 'Suresh', 'coach from batch'); ok(r.present === true && r.absent === false && r.toggled === undefined, 'attendance ' + [r.present, r.absent, r.toggled]);
  ok(r.over === 0 && r.paid === 1200, 'fees ' + r.over + ',' + r.paid); ok(r.rev === '1:5:1', 'reviews ' + r.rev); ok(r.log === 2, 'log'); ok(r.skill, 'skill avg'); ok(r.paidPill, 'paid pill'); ok(r.prof, 'profile text');
  for (const t of ['students', 'batches', 'attend', 'fees', 'coaches', 'train']) ok(r['ui_' + t] > 50, 'ui ' + t); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: academy v2');
})();
