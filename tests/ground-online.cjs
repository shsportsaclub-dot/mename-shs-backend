// Online ground booking UI with a mocked server: directory, remote booking, owner listing, no player on outside matches.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__posts = []; const J = o => Promise.resolve(new Response(JSON.stringify(o))); const real = window.fetch;
    window.fetch = (u, o) => { u = String(u); const m = (o && o.method) || 'GET';
      if (/\/api\/shared\/grounds$/.test(u)) return J({ ok: true, items: [{ id: 'gr9', owner: '+91', ownerName: 'Raju', data: { g: { name: 'Sky Turf', city: 'Hyderabad', sports: ['Cricket'], rates: { base: 1000, peak: 1500, wkend: 2000 }, slotMin: 60, open: '06:00', close: '22:00', on: true } } }] });
      if (/\/api\/gbook\/gr9\?busy=1/.test(u)) return J({ ok: true, busy: [{ id: 'b1', date: u.split('date=')[1], start: 600, dur: 60, status: 'confirmed' }] });
      if (/\/api\/gbook\/gr9$/.test(u) && m === 'POST') { window.__posts.push(JSON.parse(o.body)); return J({ ok: true, booking: { id: 'n1', status: 'requested', amt: 2000 } }); }
      if (/\/api\/gbook\/gr9$/.test(u)) return J({ ok: true, items: [{ id: 'n1', date: window.__posts[0].date, start: 660, dur: 60, status: 'requested', who: 'Ravi', phone: '9000000001', amt: 1000, paid: 0, mine: true }] });
      return real(u, o); }; });
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    UI.stage = 'app'; S.user = { id: 'u2', name: 'Cust', role: 'player' }; S.tok = 'tok'; S.settings.apiUrl = 'https://api.test'; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    const fd = x => { const f = new FormData(); for (const k in x) f.append(k, x[k]); return f; };
    UI.view = 'book'; UI.gb.tab = 'find'; render(); await w(300); o.find = /Sky Turf/.test(document.getElementById('app').innerText);
    A.gbBookRem({ id: 'gr9' }); await w(100); o.form = !!document.querySelector('select[name=ground] option[value=gr9]');
    const d = new Date(); d.setDate(d.getDate() + 3); const date = d.toISOString().slice(0, 10); UI.gb.date = date; await gbBusyLoad('gr9', date);
    const g = gbPool().find(x => x.id === 'gr9'); o.clash = gbWhy(g, date, 600, 660); o.clashFree = gbWhy(g, date, 720, 780) === '';
    F.gbBook(fd({ ground: 'gr9', date, start: '10:00', dur: 60, who: 'Ravi', phone: '9000000001' })); await w(100); o.posts0 = window.__posts.length;
    F.gbBook(fd({ ground: 'gr9', date, start: '11:00', dur: 60, who: 'Ravi', phone: '9000000001' })); await w(400);
    o.posts = window.__posts.length; o.synced = S.bookings.filter(b => b.srv).length + ':' + (S.bookings.find(b => b.srv) || {}).status; o.rem = S.gbRem.length;
    S.matches = []; o.noWorldPlayer = streamCard('w123', true) === ''; o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.find, 'directory'); ok(r.form, 'remote ground in form'); ok(/already booked/.test(r.clash) && r.clashFree, 'busy slots ' + r.clash); ok(r.posts0 === 0 && r.posts === 1, 'posts ' + r.posts0 + ',' + r.posts); ok(r.synced === '1:requested' && r.rem === 1, 'sync ' + r.synced); ok(r.noWorldPlayer, 'world player'); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: ground online');
})();
