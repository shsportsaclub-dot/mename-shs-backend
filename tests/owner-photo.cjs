// Welcome screen has no language choice; the admin owner gets the supplied photo once.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const w=await p.evaluate(()=>{UI.stage='app';S.user=null;S.prefs=Object.assign({},S.prefs,{welcomed:0});render();return document.getElementById('app').innerText});
ok(/Country/.test(w)&&!/Language/i.test(w)&&!/Telugu|Hindi/.test(w),'welcome has no language: '+w.slice(0,200));
const r=await p.evaluate(()=>{S.prefs.welcomed=1;S.prefs.ownerPhoto=0;const pl={id:'p1',name:'Owner',photo:null};S.players.push(pl);S.user={id:'u',name:'Owner',nick:'Owner',role:'admin',pid:'p1',phone:'1'};render();const a=!!pl.photo&&/^data:image\/webp/.test(pl.photo);pl.photo=null;render();return {a,again:pl.photo===null}});
ok(r.a&&r.again,'owner photo once '+JSON.stringify(r));
const g=await p.evaluate(()=>{const pl={id:'p2',name:'G',photo:null};S.players.push(pl);S.prefs.ownerPhoto=0;S.user={id:'g',name:'Guest',guest:true,role:'admin',pid:'p2'};render();return pl.photo});
ok(g===null,'guest not given photo');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: owner photo');})();
