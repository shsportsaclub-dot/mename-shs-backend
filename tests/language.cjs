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
    const chk={ta:['முகப்பு','Home'],kn:['ಮುಖಪುಟ'],ml:['ഹോം'],bn:['হোম'],mr:['होम'],gu:['હોમ'],pa:['ਹੋਮ'],or:['ହୋମ୍'],ur:['ہوم']};o.multi={};
    for(const k in chk){C.setLang(k);await w(100);UI.view='home';render();await w(100);o.multi[k]=T().includes(chk[k][0])&&document.documentElement.lang===k}
    o.rtl=document.documentElement.dir==='rtl';C.setLang('hi');await w(50);o.ltrBack=document.documentElement.dir==='ltr';
    C.setLang('te');await w(50);toast('Saved');await w(300);o.toastTe=/సేవ్ అయింది/.test(document.getElementById('toast').innerText);toast('Ground deleted. Existing bookings are kept.');await w(300);o.toastLong=/గ్రౌండ్ తొలగించబడింది/.test(document.getElementById('toast').innerText);
    C.setLang('ur');await w(50);toast('Saved');await w(300);o.toastUr=/محفوظ ہو گیا/.test(document.getElementById('toast').innerText);
    o.pat=i18nPat('India Lions won by 5 runs','te')==='India Lions 5 పరుగుల తేడాతో గెలిచింది'&&i18nPat('Perth Scorchers Women won by 5 wkts','hi')==='Perth Scorchers Women ने 5 विकेट से जीत हासिल की'&&i18nPat('Sydney Thunder Women opt to bat','ta')==='Sydney Thunder Women பேட்டிங் தேர்வு செய்தது'&&i18nPat('Team A need 31 runs from 18 balls','ur').includes('31')&&i18nPat('12 likes','mr')==='12 लाइक्स'&&i18nPat('Hello there','te')==='';
    const allP=['te','hi','ta','kn','ml','bn','mr','gu','pa','or','ur'].every(l=>['wonR','wonW','toss','opt','tossOpt','need','proj','likes','squad','players','tied','brk','yet','tossOnly','bat','bowl'].every(k=>I18NP[l][k]));o.allPat=allP;
    C.setLang('te');await w(50);const d=document.createElement('div');d.id='tp';d.className='';d.textContent='Gabba Kings won by 12 runs';document.getElementById('app').appendChild(d);i18nApply(document.getElementById('app'));o.patDom=d.textContent==='Gabba Kings 12 పరుగుల తేడాతో గెలిచింది';d.remove();
    C.setLang('xx'); o.badIgnored = S.prefs.lang === 'te';
    C.setLang('en'); await w(100); UI.view = 'teams'; render(); o.back = /Create team/.test(T()) && !/టీమ్ సృష్టించు|टीम बनाएं/.test(T()); o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of ['enHas', 'teNav', 'teTeams', 'teName', 'noEn', 'teBook', 'drawerSel', 'hi', 'hiName', 'badIgnored', 'back', 'fit', 'toastTe', 'toastLong', 'toastUr', 'pat', 'allPat', 'patDom']) ok(r[k], k + ' ' + JSON.stringify(r)); ok(r.htmlLang === 'te', 'html lang'); for (const k in r.multi) ok(r.multi[k], 'lang ' + k + JSON.stringify(r.multi)); ok(r.rtl && r.ltrBack, 'rtl'); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: language');
})();
