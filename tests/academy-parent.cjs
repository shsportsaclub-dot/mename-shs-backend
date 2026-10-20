// Academy: owner changes are pushed to server, empty device restores, parent "My child" tab shows only server-returned records.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(500);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), o = {}, T = () => document.getElementById('app').innerText, calls = [];
    UI.stage = 'app'; S.user = { id: 'u1', name: 'Coach', role: 'admin' }; S.tok = 't'; localStorage.setItem('sh_tok', 't');
    window.apiBase = () => 'http://x'; window.shTok = () => 't';
    const kid = { academy: 'Sky High', ownerPhone: '+91*****01', id: 's1', name: 'Arjun', sport: 'Cricket', level: 'Beginner', batch: { name: 'Morning', days: ['Mon'], time: '6:00' }, coach: 'Ravi', fee: 1000, paid: {}, thisMonth: '2026-10', att: { n: 3, p: 2, last: [['2026-10-01', 1], ['2026-10-02', 0]] } };
    window.fetch = async (u, op) => { calls.push((op && op.method || 'GET') + ' ' + u); const j = u.endsWith('/mine') ? { ok: true, items: [kid] } : (op && op.method === 'PUT') ? { ok: true } : { ok: true, academy: { students: [{ id: 'z', name: 'Restored Kid', fee: 500, paid: {}, att: {} }], batches: [], coaches: [] } }; return { json: async () => j }; };
    S.academy = { students: [], batches: [], coaches: [], log: [], reviews: [] }; UI.view = 'academy'; UI.ay.tab = 'students'; render(); await w(300);
    o.restored = S.academy.students.length === 1 && S.academy.students[0].name === 'Restored Kid';
    S.academy.students.push({ id: 'n', name: 'New Kid', fee: 100, paid: {}, att: {} }); commit(); await w(3000);
    o.pushed = calls.some(c => c.startsWith('PUT') && c.endsWith('/api/academy'));
    o.hasTab = /My child/.test(T());
    A.ayTab({ v: 'kids' }); await w(300); o.kid = /Arjun/.test(T()) && /Morning/.test(T()) && /2\/3/.test(T()) && /67%/.test(T()); o.noOwnerList = !/New Kid/.test(T());
    o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of ['restored', 'pushed', 'hasTab', 'kid', 'noOwnerList', 'fit']) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: academy parent');
})();
