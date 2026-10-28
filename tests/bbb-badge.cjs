// Ball-by-ball ON/OFF badge on world match cards.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const mk=(id,bbb)=>({id,name:'A v B, 1st Test, X tour',type:'test',teams:[{name:'A',short:'A'},{name:'B',short:'B'}],score:[],started:true,ended:false,status:'Live',bbb,date:'2026-10-28',time:new Date().toISOString()});
 UI.live={ok:true,matches:[mk('m1',true),mk('m2',false)]};UI.view='home';UI.hx='live';render();
 return [...document.querySelectorAll('.bbbg')].map(x=>x.innerText)});
ok(r.some(t=>/ON/.test(t))&&r.some(t=>/not sent/.test(t)),'badges '+JSON.stringify(r));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: bbb badge');})();
