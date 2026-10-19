// Real server + two browsers: a ball the scorer records must reach a viewer in about a second (server-sent events), not on the 5 s poll.
const { chromium } = require('playwright'), { spawn } = require('node:child_process'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'live-push-'));
  const child = spawn(process.execPath, [path.resolve('server.js')], { env: { ...process.env, PORT: '18951', DATA_FILE: path.join(tmp, 'data.json'), DATABASE_URL: '', SESSION_SECRET: 'live-push-test', SMS_PROVIDER: 'console', EMAIL_PROVIDER: 'console', CRIC_API_KEY: '', TRACKER: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.resume(); child.stderr.resume();
  const base = 'http://127.0.0.1:18951', post = async (p, b) => (await fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })).json();
  let browser;
  try {
    for (let i = 0; i < 200; i++) { try { if ((await fetch(base + '/health')).ok) break } catch {} await new Promise(r => setTimeout(r, 25)) }
    const owner = await post('/api/auth/register', { phone: '9000000011', cc: '91', pin: '135790', profile: { nick: 'Scorer', age: 30, kind: 'Organiser' } });
    const watcher = await post('/api/auth/register', { phone: '9000000012', cc: '91', pin: '135790', profile: { nick: 'Viewer', age: 30, kind: 'Fan' } });
    assert.ok(owner.ok && watcher.ok);
    browser = await chromium.launch(); const p = await browser.newPage(), v = await browser.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message)); v.on('pageerror', e => errs.push(e.message));
    for (const [pg, u] of [[p, owner], [v, watcher]]) {
      await pg.goto(base); await pg.waitForTimeout(300);
      await pg.evaluate(({ u, base }) => { UI.stage = 'app'; S.user = { ...u.profile, name: u.profile.nick }; S.tok = u.token; S.settings.apiUrl = base; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; save(); shLive() }, { u, base });
    }
    await v.waitForTimeout(1500);
    const mid = await p.evaluate(async () => { const a = S.teams[0], b = S.teams[1], m = newMatch({ a: a.id, b: b.id, overs: 5, toss: a.id, dec: 'bat', xiA: a.players.slice(0, 11), xiB: b.players.slice(0, 11) }); startInnings(m, 0, a.players[0], a.players[1], b.players[0]); commit(); await shPush(); return m.id });
    await v.evaluate(() => shPull()); await v.waitForTimeout(800);
    const lat = [];
    for (let k = 1; k <= 3; k++) {
      await p.waitForTimeout(1300 + k * 370);   // spread the balls across the 5 s poll cycle so a lucky poll cannot explain them all
      const t0 = Date.now(); await p.evaluate(id => { const m = S.matches.find(x => x.id === id); ball(m, { r: 1 }); commit() }, mid);
      await v.waitForFunction(({ id, n }) => { const m = S.matches.find(x => x.id === id); return m && m.innings[0] && m.innings[0].ev.length >= n }, { id: mid, n: k }, { timeout: 8000, polling: 50 });
      lat.push(Date.now() - t0);
    }
    // a second match running at the same time: each match updates on its own, at its own moment
    const mid2 = await p.evaluate(async () => { const a = S.teams[0], b = S.teams[1], m = newMatch({ a: a.id, b: b.id, overs: 5, toss: a.id, dec: 'bat', xiA: a.players.slice(0, 11), xiB: b.players.slice(0, 11) }); startInnings(m, 0, a.players[0], a.players[1], b.players[0]); commit(); await shPush(); return m.id });
    await v.waitForTimeout(800);
    const t1 = Date.now(); await p.evaluate(id => { const m = S.matches.find(x => x.id === id); ball(m, { r: 4 }); commit() }, mid2);
    await v.waitForFunction(id => { const m = S.matches.find(x => x.id === id); return m && m.innings[0] && m.innings[0].ev.length >= 1 }, mid2, { timeout: 8000, polling: 50 }); lat.push(Date.now() - t1);
    assert.equal(await v.evaluate(id => S.matches.find(x => x.id === id).innings[0].ev.length, mid), 3, 'first match unchanged by the second');
    console.log('latency ms', lat.join(', '));
    assert.ok(Math.max(...lat) < 2500, 'a ball took too long: ' + lat);
    assert.ok(!errs.length, errs.join(';')); console.log('PASS: live push');
  } finally { if (browser) await browser.close(); child.kill() }
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
