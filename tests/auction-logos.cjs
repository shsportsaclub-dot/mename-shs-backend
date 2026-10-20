// Auction franchise logos: style picker, generate, colour, pick from my teams, upload kept, crest shown in lists.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), o = {}; UI.stage = 'app'; S.user = { id: 'u1', name: 'QA', role: 'admin', kind: 'Scorer' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    const fd = x => { const f = new FormData(); for (const k in x) f.append(k, x[k]); return f };
    S.teams = [{ id: 'tA', name: 'Mine FC', short: 'MFC', color: '#0a7c4a', preset: 4, logo: null, players: [] }, { id: 'tB', name: 'Logo FC', short: 'LFC', color: '#7c3aed', preset: 1, logo: 'data:image/png;base64,iVBORw0KGgo=', players: [] }];
    F.auCreate(fd({ name: 'Cup', venue: 'H', ppt: 3, pts: 1000, base: 100, inc: 50 })); const a = S.auc[S.auc.length - 1]; UI.au = UI.au || {}; UI.au.open = a.id; UI.view = 'auction'; render();
    UI.modal = { t: 'html', html: au2TeamForm(a, null) }; renderModal(); await w(50);
    o.formHas = !!document.querySelector('#au3p') && !!document.querySelector('select[data-c=au2FromTeam]') && !!document.querySelector('input[data-c=au2Logo]');
    A.au3Preset({ v: '3' }); o.preset = document.querySelector('input[name=preset]').value === '3' && document.querySelector('input[name=lm]').value === 'preset';
    A.au3Gen(); o.gen = document.querySelector('input[name=lm]').value === 'preset' && /^#/.test(document.querySelector('input[name=color]').value);
    C.au2FromTeam('tA'); o.from = document.querySelector('input[name=name]').value === 'Mine FC' && document.querySelector('input[name=preset]').value === '4' && document.querySelector('input[name=color]').value === '#0a7c4a';
    const f = document.querySelector('form[data-f=au2Team]'); F.au2Team(new FormData(f)); const t1 = a.teams.find(x => x.name === 'Mine FC'); o.saved = !!t1 && t1.preset === 4 && t1.color === '#0a7c4a' && !t1.logo;
    F.au2Team(fd({ aid: a.id, tid: '', name: 'Gen FC', short: 'GEN', lm: 'preset', preset: '2', color: '#e11d2e' })); const t2 = a.teams.find(x => x.short === 'GEN'); o.gen2 = t2.preset === 2 && t2.color === '#e11d2e';
    UI.au2Logo = 'data:image/png;base64,AAAA'; F.au2Team(fd({ aid: a.id, tid: t2.id, name: 'Gen FC', short: 'GEN', lm: 'upload', preset: '2', color: '#e11d2e' })); o.upload = !!t2.logo;
    F.au2Team(fd({ aid: a.id, tid: t2.id, name: 'Gen FC', short: 'GEN', lm: 'preset', preset: '5', color: '#112233' })); o.back = !t2.logo && t2.preset === 5 && t2.color === '#112233';
    o.crestHtml = aucCrestT(t1, 40).includes('<svg') && aucCrestT({ name: 'X', short: 'X', logo: 'data:image/png;base64,AA' }, 40).includes('<img') && !aucCrestT({ name: 'Plain Team' }, 40).includes('<svg');
    UI.modal = null; renderModal(); render(); await w(50); o.list = document.querySelectorAll('.aucsheet svg').length >= 2; o.fit = document.documentElement.scrollWidth <= innerWidth; return o;
  });
  for (const k of Object.keys(r)) ok(r[k], k + ' ' + JSON.stringify(r)); ok(!errs.length, errs.join(';'));
  await b.close(); if (!process.exitCode) console.log('PASS: auction logos');
})();
