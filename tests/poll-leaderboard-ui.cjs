// Leaderboard + proven answers shown in the Polls tab (results are seeded in the server file; the app reads them).
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const port = 8264, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plb-')), f = path.join(dir, 'd.json');
  fs.writeFileSync(f, JSON.stringify({ users: { 9111: { nick: 'Asha', phone: '9111' }, 9222: { nick: 'Ravi', phone: '9222' } }, shared: {}, polls: { pz1: { winner: { opts: ['Team Alpha', 'Team Beta'], votes: { 'u:9111': 'Team Alpha', 'u:9222': 'Team Beta', 'g:guestguestguest': 'Team Alpha' } } } }, pollRes: { pz1: { winner: 'Team Alpha', at: 1 } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: f, SESSION_SECRET: 'x', TRACKER: '0', CRIC_API_KEY: '' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 780 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/`); await p.waitForTimeout(800);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate((port) => { localStorage.setItem('sh-guest-id', 'guestguestguest'); S.settings.apiUrl = 'http://127.0.0.1:' + port; UI.stage = 'app'; S.user = { nick: 'Guest', name: 'Guest', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.wm = { m: { id: 'pz1', name: 'Alpha v Beta', type: 't20', started: true, ended: true, status: 'Team Alpha won by 5 wickets', teams: [{ name: 'Team Alpha', short: 'ALP' }, { name: 'Team Beta', short: 'BET' }], score: [] }, tab: 'live' }; UI.view = 'wmatch'; render(); }, port);
  await p.evaluate(() => A.wmTab({ v: 'po' })); await p.waitForTimeout(1200);
  const t = await p.evaluate(() => document.body.innerText);
  ok(/Prediction leaderboard/.test(t) && /Asha/.test(t) && /10 pts/.test(t) && /Ravi/.test(t) && /0 pts/.test(t), 'leaderboard rows: ' + t.slice(-500));
  ok(t.indexOf('Asha') < t.indexOf('Ravi'), 'ranked by points');
  ok(/Result of your predictions/.test(t) && /correct \(\+10\)/.test(t), 'guest sees own proven result: ' + t.slice(0, 400));
  ok(!/Guest\b.*pts/.test(t.split('Prediction leaderboard')[1] || ''), 'guests are not listed publicly');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'fits 360px'); ok(!errs.length, errs.join(';'));
  if (!process.exitCode) console.log('PASS: poll leaderboard'); await b.close(); srv.kill();
})();
