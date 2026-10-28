// Match centre shows a timeline built from observed score changes when the provider sends no ball-by-ball.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage({viewport:{width:430,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
const set=(r,w,o)=>p.evaluate(([r,w,o])=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1};
 UI.wm={m:{id:'tlq'+(window.__x||(window.__x=Date.now())),name:'New Zealand A vs India A',started:true,ended:false,type:'test',teams:[{name:'New Zealand A',short:'NZ A'},{name:'India A',short:'IND A'}],score:[{inning:'New Zealand A Inning 1',r,w,o}],status:'Day 1: Live'},mi:null,sc:null,bb:null,tab:'live'};UI.view='wmatch';render();return document.getElementById('app').innerText},[r,w,o]);
let t=await set(90,3,28);ok(/Match timeline/.test(t)&&/90-3/.test(t),'first entry');
t=await set(96,4,29);ok(/96-4/.test(t)&&/90-3/.test(t),'both entries');ok(/1 wicket and 6 runs/.test(t),'delta '+t.slice(-400));
ok(/not sent by the data provider/.test(t),'honest note');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: match timeline');})();
