// Ball by Ball list: an unknown stretch is one row ("22.2–22.6 · 5b"), not one "?" row per ball.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 400, height: 1400 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('ok', m); };
  const rows = await p.evaluate(() => { const at = Date.now(); const html = window.shNoteGroups([
    { at: at - 2e5, inning: 1, text: 'Zimbabwe Women 78/4 (22.1 ov) to 84/4 (23.2 ov): 6 runs from 7 legal balls.' },
    { at: at - 1e5, inning: 1, text: 'Zimbabwe Women 84/4 (23.2 ov) to 85/4 (24 ov): 1 run from 4 legal balls.' }].reverse());
    const d = document.createElement('div'); d.className = 'rp'; d.innerHTML = html; d.style.width = '380px'; document.body.appendChild(d);
    return [...d.querySelectorAll('.cl')].map(e => e.innerText.replace(/\s+/g, ' ')); });
  rows.forEach(r => console.log('  ', r));
  const q = rows.filter(r => /^\d+\.\d/.test(r));
  ok(q.length <= 4, 'collapsed to a few rows (was one row per ball): ' + q.length);
  ok(q.some(r => /^22\.2–22\.6/.test(r) && /up to 23\.2/.test(r)), 'first part of the spread update says where it ends');
  ok(q.some(r => /^23\.3–23\.6/.test(r) && /1 run came in 4 balls/.test(r)), 'last update is one row');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await p.screenshot({ path: process.env.SHOT || '/dev/null' });
  await b.close();
})();
