// SH Prime: every one of the 37 situation tickers uses ONE animation language, fits the frame and leaves the bottom score bar free.
const {chromium}=require('playwright');let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
const sets=new Set(),fonts=new Set();
for(let n=1;n<=37;n++){await p.goto(base+`?scene=tpack&n=${n}&t=2.6&bar=0#overlay`);await p.waitForTimeout(120);
 const r=await p.evaluate(()=>{const e=document.querySelector('.pkp');if(!e)return null;const r=e.getBoundingClientRect(),g=e.querySelector('.pkg b').textContent,h=e.querySelector('.pkh').textContent,k=e.querySelector('.pkk').textContent;
  const an=[...e.querySelectorAll('*')].map(x=>getComputedStyle(x).animationName).filter(x=>x&&x!=='none');return{x:r.x,y:r.y,r:r.right,b:r.bottom,g,h,k,an:[...new Set(an)].filter(x=>/^pk/.test(x)).sort().join(','),ff:getComputedStyle(e).fontFamily,vis:getComputedStyle(e.querySelector('.pkh span')).transform}});
 ok(r,'tk'+n+' renders');if(!r)continue;
 ok(r.g&&r.g!=='undefined'&&r.h&&!/undefined|NaN/.test(r.h+r.k+r.g),`tk${n} text ok: ${r.g}|${r.k}|${r.h}`);
 ok(r.x>=0&&r.r<=1280&&r.y>=0&&r.b<=720*0.3,`tk${n} fits top area (${Math.round(r.x)}-${Math.round(r.r)}, bottom ${Math.round(r.b)})`);
 ok(r.vis==='none'||/matrix\(1, 0, 0, 1, 0, 0\)/.test(r.vis),`tk${n} headline settled at 2.6s: ${r.vis}`);
 sets.add(r.an.replace(/,pkcp?/,''));fonts.add(r.ff)}
ok(fonts.size===1,'one font for the whole pack: '+[...fonts].join(' / '));
ok(sets.size<=2,'one animation language across 37 tickers: '+[...sets].join(' / '));
// live: pack is the default and classic still available
await p.goto(base+'#overlay');await p.waitForTimeout(500);await p.evaluate(()=>{S.stream.tkPack='prime'});
const live=await p.evaluate(()=>{const o={};for(const id of shTk.ids){const h=shTk.T[id].html({batter:'A',bowler:'B',a:{name:'X',players:[]},b:{name:'Y',players:[]},balls:[]});o[id]=/class="pkp"/.test(h)}S.stream.tkPack='classic';const h2=shTk.T.tk4.html({batter:'A'});o.classic=!/pkp/.test(h2);S.stream.tkPack='prime';return o});
ok(Object.keys(live).filter(k=>k!=='classic').every(k=>live[k]),'all situation tickers go through the pack when live');ok(live.classic,'classic mode still gives the old tickers');
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();console.log(bad?'FAILED':'PASS: SH Prime pack (37 tickers, one animation)');process.exit(bad?1:0)})();
