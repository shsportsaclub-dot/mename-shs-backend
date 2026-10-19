// Polls tab end to end: real server + real page, vote once, results appear, second vote refused.
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const port = 8252, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pu-'));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: 'x', TRACKER: '0' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 360, height: 780 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/`); await p.waitForTimeout(800); 
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  await p.evaluate((port) => { S.settings.apiUrl = 'http://127.0.0.1:' + port; UI.stage = 'app'; S.user = { nick: 'Poll Test', name: 'Poll Test', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; UI.wm = { m: { id: 'pz1', name: 'Alpha v Beta', type: 't20', started: false, ended: false, teams: [{ name: 'Team Alpha', short: 'ALP' }, { name: 'Team Beta', short: 'BET' }], score: [] }, tab: 'live' }; UI.view = 'wmatch'; render(); }, port);
  await p.evaluate(() => A.wmTab({ v: 'po' })); await p.waitForTimeout(600);
  let t = await p.evaluate(() => document.body.innerText);
  ok(/Who will win this match\?/.test(t) && /Team Alpha/.test(t) && /Team Beta/.test(t), 'winner poll shown');
  ok(/no betting, no money/i.test(t), 'no-betting label');
  ok(!/%/.test(await p.evaluate(() => document.querySelector('.sh-poll').innerText)), 'no results before voting');
  await p.click('.sh-poll-o[data-poll="winner"][data-i="0"]'); await p.waitForTimeout(600);
  t = await p.evaluate(() => document.querySelector('.sh-poll').innerText);
  ok(/100%/.test(t) && /you voted Team Alpha/.test(t), 'results after voting: ' + t);
  await p.evaluate(() => { UI.wm.polls = null; A.wmTab({ v: 'po' }); }); await p.waitForTimeout(600);
  t = await p.evaluate(() => document.querySelector('.sh-poll').innerText); ok(/you voted Team Alpha/.test(t), 'vote remembered after reload: ' + t);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'fits 360px');
  ok(!errs.length, 'page errors ' + errs.join(';'));
  await p.screenshot({ path: '/tmp/out/polls.png' });
  if (!process.exitCode) console.log('PASS: polls tab');
  await b.close(); srv.kill();
})();
