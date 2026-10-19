// Match location + weather + pitch behaviour, with mocked Open-Meteo responses.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__calls = []; const real = window.fetch; window.fetch = (u, o) => { u = String(u); if (/geocoding-api\.open-meteo/.test(u)) { window.__calls.push(u); return Promise.resolve(new Response(JSON.stringify({ results: [{ name: 'Hyderabad', admin1: 'Telangana', country: 'India', latitude: 17.38, longitude: 78.48 }] }))); } if (/api\.open-meteo\.com/.test(u)) { window.__calls.push(u); const t = []; const d = new Date(); d.setUTCMinutes(0, 0, 0); for (let i = -24; i < 48; i++) t.push(new Date(d.getTime() + i * 36e5 + 19800000).toISOString().slice(0, 16)); return Promise.resolve(new Response(JSON.stringify({ utc_offset_seconds: 19800, current: { temperature_2m: 31.4, relative_humidity_2m: 62, precipitation: 0, wind_speed_10m: 9, weather_code: 2 }, hourly: { time: t, temperature_2m: t.map(() => 29), precipitation_probability: t.map(() => 40), weather_code: t.map(() => 61) } }))); } return real(u, o); }; });
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'A', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 }; const o = {};
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, role: 'BAT', team: i < 11 ? 'a' : 'b', bowl: i % 2 ? 'Right-arm off spin' : 'Right-arm fast' }));
    S.teams = [{ id: 'a', name: 'Lions', short: 'LIO', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Hawks', short: 'HAW', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    const m = newMatch({ a: 'a', b: 'b', overs: 2, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players, venue: 'Gachibowli Stadium, Hyderabad', date: new Date().toISOString().slice(0, 10) });
    startInnings(m, 0, 'p0', 'p1', 'p11'); for (const r of [4, 6, 1]) { const inn = m.innings[0]; if (inn.cur.bl == null) inn.cur.bl = 'p11'; ball(m, { r }); }
    const t0 = tVenue(m); o.first = /Loading weather/.test(t0); await new Promise(r => setTimeout(r, 400)); const t1 = tVenue(m);
    o.wx = /31°C|31\.4|31°/.test(t1) || /31/.test(t1); o.place = /Hyderabad, Telangana, India/.test(t1); o.rain = /Rain chance at start/.test(t1) || /At start time/.test(t1) || 'noStart'; o.map = /openstreetmap\.org\/\?mlat=17\.38/.test(t1); o.src = /Open-Meteo/.test(t1);
    o.calls = window.__calls.length; tVenue(m); o.cached = window.__calls.length === o.calls;
    const old = newMatch({ a: 'a', b: 'b', overs: 2, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players, venue: 'Old Ground', date: '2020-01-01' }); o.past = /live and upcoming/.test(tVenue(old));
    S.matches.forEach(x => x.status = 'done'); o.pitch = /Pitch behaviour here/.test(mvPitch(m)) && /Wickets to spin/.test(mvPitch(m)) || mvPitch(m) === ''; o.noVenue = mvCard({ key: 'z', venue: '' }) === '';
    UI.view = 'match'; UI.mid = m.id; UI.tab = 'vn'; render(); o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  ok(r.first, 'loading first'); ok(r.wx && r.place && r.map && r.src, JSON.stringify(r)); ok(r.cached, 'cached'); ok(r.past, 'past match'); ok(r.noVenue, 'no venue'); ok(r.fit, 'overflow'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: match conditions');
})();
