// Light home: search box in the filter row narrows the live match cards by team or series.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(2500);
await p.evaluate(()=>{window.pullLive=async()=>{};S.settings.appTheme='mday';UI.stage='app';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const mk=(id,n,a,b)=>({id,name:n,type:'T20',started:true,ended:false,status:'Live',teams:[{name:a,short:a.slice(0,3).toUpperCase(),score:'10/1',overs:'2'},{name:b,short:b.slice(0,3).toUpperCase(),score:'',overs:''}],startTime:Date.now()});
 UI.live={ok:true,matches:[mk('1','Hong Kong Sixes 2026','Oman','South Africa'),mk('2','Hong Kong Sixes 2026','Pakistan','UAE'),mk('3','Sheffield Shield 2026-27','Western Australia','South Australia')]};UI.view='home';UI.cbf='all';render()});
const n=()=>p.evaluate(()=>document.querySelectorAll('.cbcar > *').length);
ok(await p.evaluate(()=>!!document.querySelector('input.cbq')),'search box is shown');
ok(await n()===3,'3 cards before search');
await p.fill('input.cbq','pak');await p.waitForTimeout(200);
ok(await n()===1,'search "pak" leaves 1 card (got '+await n()+')');
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.classList.contains('cbq')&&document.activeElement.value==='pak'),'focus and text kept while typing');
await p.fill('input.cbq','sheffield');await p.waitForTimeout(200);ok(await n()===1,'search by series');
await p.fill('input.cbq','zzz');await p.waitForTimeout(200);ok(await n()===0,'no match shows no cards');
await p.fill('input.cbq','');await p.waitForTimeout(200);ok(await n()===3,'clearing restores all');
await p.screenshot({path:'/tmp/search_home.png'});
console.log(errs.length?'FAIL errors '+errs.join('|'):(process.exitCode?'FAILED':'PASS: match search'));await b.close()})();
