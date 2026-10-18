// A stale page (older build than the server) shows the update banner and reloads; a current page does nothing.
const { chromium } = require('playwright'), { spawn } = require('node:child_process'), path = require('node:path');
(async () => {
  const port = 3999, srv = spawn('node', ['server.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT: String(port), RENDER_GIT_COMMIT: 'aaaaaaa1234', TRACKER: '0', RECENT_OPEN_DATA: '0', HISTORY_DIR: '/tmp/auhist' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  const b = await chromium.launch(), ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  try {
    const html = await (await fetch('http://localhost:' + port + '/')).text();
    ok(/name="sh-build" content="aaaaaaa"/.test(html), 'server stamps the build into the page');
    const p = await b.newPage({ viewport: { width: 360, height: 700 } });
    await p.route('**/health', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, version: 'bbbbbbb' }) }));
    let reloads = 0; p.on('framenavigated', f => { if (f === p.mainFrame()) reloads++; });
    await p.goto('http://localhost:' + port + '/'); await p.waitForTimeout(4800);
    ok(await p.evaluate(() => !!document.getElementById('sh-upd') || false) || reloads > 1, 'stale page shows banner or reloads');
    const p2 = await b.newPage(); await p2.route('**/health', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, version: 'aaaaaaa' }) }));
    await p2.goto('http://localhost:' + port + '/'); await p2.waitForTimeout(4800);
    ok(await p2.evaluate(() => !document.getElementById('sh-upd')), 'current page: no banner');
  } finally { await b.close(); srv.kill(); }
  if (!process.exitCode) console.log('PASS: build stamped, stale page updates, current page left alone');
})();
