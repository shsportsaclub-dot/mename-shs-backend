const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await b.newPage({ viewport: { width: 430, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../app-index.html')); await p.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } };
  const r = await p.evaluate(async () => {
    const A = { id: 'x1', h: 'Rahul Verma hits a century as Hapur Lions beat Meerut Kings', sub: '', body: ['Rahul Verma led Hapur Lions with 112 not out off 61 balls.'], card: { a: 'Hapur Lions', b: 'Meerut Kings', sa: '212/4', sb: '180/9' } };
    const u = window.epIllo(A), svg = decodeURIComponent(u.split(',')[1]);
    const img = new Image(); img.src = u; await img.decode();
    const rain = decodeURIComponent(window.epIllo({ h: 'Rain stops play', body: ['Abandoned due to rain.'], card: { a: 'A', b: 'B' } }).split(',')[1]);
    const w5 = decodeURIComponent(window.epIllo({ h: 'x', body: ['A Singh took 5 for 22 in 8 overs.'], card: { a: 'A', b: 'B' } }).split(',')[1]);
    return { ok: img.naturalWidth === 1200, hasH: svg.includes('Rahul Verma hits a century'), tag: svg.includes('CENTURY'), n112: svg.includes('>112<'), rain: rain.includes('>RAIN<'), w5: w5.includes('5 WICKETS'), same: window.epIllo(A) === u, face: !/<image|<foreignObject/.test(svg), av: svg.includes('sh-avatar'), label: svg.includes('Illustration') };
  });
  ok(r.ok, 'svg renders as image'); ok(r.hasH && r.tag && r.n112, 'century story drawn from the article'); ok(r.rain, 'rain scene'); ok(r.w5, 'wickets scene'); ok(r.same, 'deterministic'); ok(r.face, 'no embedded photo or face'); ok(r.av, 'SH helmet avatar is the figure'); ok(r.label, 'labelled as illustration');
  // ePaper page: no photo -> illustration; real photo wins
  await p.evaluate(() => { window.pullLive = async () => {}; UI.stage = 'app'; S.user = { name: 'QA', role: 'viewer', kind: 'Fan' }; S.prefs = { ...S.prefs, asked: 1, welcomed: 1 };
    UI.epSrv = { ok: true, news: [{ id: 'w-1', mid: 'w1', kind: 'result', h: 'Manipur take control', sub: '', body: ['Manipur 364/10.'], card: { a: 'Manipur', b: 'Arunachal Pradesh', sa: '364/10', sb: '111/10' } }], sh: [], world: [] };
    UI.ep2 = UI.ep2 || {}; UI.ep2.ed = 'global'; UI.view = 'epaper'; render(); });
  await p.waitForTimeout(800);
  const s = await p.evaluate(() => { const i = document.querySelector('img.epi'); return i && i.src.slice(0, 40) });
  ok(s && /^data:image\/svg\+xml/.test(s), 'article image is the illustration ' + s);
  ok(!errs.length, errs.join(';')); await b.close(); if (!process.exitCode) console.log('PASS: ePaper illustrations');
})();
