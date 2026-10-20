// App-wide language: Telugu/Hindi labels replace UI text, names and user text stay, English restores, drawer selector works.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(500);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    UI.stage = 'app'; S.user = { id: 'u1', name: 'Ravi Kumar', nick: 'Ravi', role: 'admin' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1, lang: 'en' }; const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), T = () => document.getElementById('app').innerText;
    S.teams = [{ id: 'a', name: 'India Lions', short: 'IND', color: '#235bbb', players: [] }]; UI.view = 'teams'; render(); o.enHas = /Create team/.test(T());
    C.setLang('te'); await w(100); o.teNav = /హోమ్/.test(T()) && /మ్యాచ్‌లు/.test(T()); o.teTeams = /టీమ్‌లు/.test(T()); o.teName = /India Lions/.test(T()); o.noEn = !/\bCreate team\b/.test(T()); o.htmlLang = document.documentElement.lang;
    UI.view = 'book'; UI.gb.tab = 'book'; render(); o.teBook = /గ్రౌండ్ బుక్ చేయండి/.test(T()); const ph = [...document.querySelectorAll('[placeholder]')].map(e => e.placeholder).join('|'); o.ph = ph.length >= 0;
    UI.view = 'home'; UI.drawer = true; render(); o.drawerSel = !!document.querySelector('select[data-c=setLang]') && document.querySelector('select[data-c=setLang]').value === 'te'; UI.drawer = false;
    C.setLang('hi'); await w(100); UI.view = 'teams'; render(); o.hi = /टीम बनाएं/.test(T()); o.hiName = /India Lions/.test(T());
    C.setLang('xx'); o.badIgnored = S.prefs.lang === 'hi';
    C.setLang('en'); await w(100); UI.view = 'teams'; render(); o.back = /Create team/.test(T()) && !/టీమ్ సృష్టించు|टीम बनाएं/.test(T()); o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of ['enHas', 'teNav', 'teTeams', 'teName', 'noEn', 'teBook', 'drawerSel', 'hi', 'hiName', 'badIgnored', 'back', 'fit']) ok(r[k], k + ' ' + JSON.stringify(r)); ok(r.htmlLang === 'te', 'html lang'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: language');
})();
