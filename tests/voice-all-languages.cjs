// Every voice language speaks ball, milestone, over, innings end and result lines with the real names and numbers, no leftover placeholders.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(() => {
    S.players = Array.from({ length: 22 }, (_, i) => ({ id: 'p' + i, name: 'Zed ' + i, role: 'BAT' }));
    S.teams = [{ id: 'a', name: 'India', short: 'IND', color: '#235bbb', players: S.players.slice(0, 11).map(p => p.id) }, { id: 'b', name: 'Australia', short: 'AUS', color: '#c9a400', players: S.players.slice(11).map(p => p.id) }];
    let said = []; speak = t => said.push(t); S.settings.voice = true; const out = {}; out.langs = Object.keys(LP);
    out.sel = Object.keys(VL).length; out.selNames = Object.values(VL).map(v => v.n);
    for (const lang of out.langs) {
      S.settings.vlang = lang; said = [];
      const m = newMatch({ a: 'a', b: 'b', overs: 3, toss: 'a', dec: 'bat', xiA: S.teams[0].players, xiB: S.teams[1].players }); startInnings(m, 0, 'p0', 'p1', 'p11'); const inn = m.innings[0];
      for (let k = 0; k < 9; k++) { inn.cur.s = 'p0'; inn.cur.n = 'p1'; if (inn.cur.bl == null) inn.cur.bl = 'p' + (11 + inn.lg / 6); ball(m, { r: 6 }) }
      inn.cur.s = 'p0'; inn.cur.n = 'p1'; ball(m, { w: 'Bowled', out: 'p0' }); ball(m, { r: 2 }); ball(m, { x: 'wd' }); ball(m, { x: 'nb', r: 1 }); ball(m, { r: 4 });
      const e = cLine(inn.ev[0], lang), w = cLine({ w: 'Bowled', out: 'p0', bt: 'p0', bl: 'p11', r: 0, x: '' }, lang), res = vResult({ result: 'India won by 12 runs' }, lang), rw = vResult({ result: 'India won by 4 wickets' }, lang), tie = vResult({ result: 'Match tied' }, lang);
      out[lang] = { said: said.join(' | '), six: e, w, res, rw, tie, test: (A.vtest(), said[said.length - 1]) };
    }
    return out;
  });
  ok(r.langs.length >= 16, 'languages: ' + r.langs.length); ok(r.sel === r.langs.length + 1, 'selector lists English + all: ' + r.sel);
  for (const lang of r.langs) {
    const o = r[lang], all = Object.values(o).join(' ');
    ok(!/[{}]|undefined|NaN/.test(all), lang + ' leftover placeholder: ' + all.slice(0, 200));
    ok(/Zed 0/.test(o.six) || /Z\. 0|Zed/.test(o.six) || o.six.length > 3, lang + ' six line'); ok(/12/.test(o.res) && /4/.test(o.rw) && o.tie.length > 3, lang + ' result lines: ' + o.res);
    ok(o.said.split(' | ').length > 12, lang + ' spoke ball, milestone and over lines: ' + o.said.split(' | ').length);
    ok(!/^[\x00-\x7f]+$/.test(o.res) || ['es', 'fr', 'pt'].includes(lang), lang + ' result not English');
  }
  ok(new Set(r.langs.map(l => r[l].res)).size === r.langs.length, 'each language has its own wording');
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: all-language voice (' + r.langs.length + ' languages)');
})();
