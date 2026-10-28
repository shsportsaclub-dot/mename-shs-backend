// Ball-by-ball ON/OFF badge on world match cards.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
let UI_;const r=await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const mk=(id,bbb)=>({id,name:'A v B, 1st Test, X tour',type:'test',teams:[{name:'A',short:'A'},{name:'B',short:'B'}],score:[],started:true,ended:false,status:'Live',bbb,date:'2026-10-28',time:new Date().toISOString()});
 UI.live={ok:true,matches:[mk('m1',true),mk('m2',false)]};UI.view='home';UI.hx='live';render();
 return [...document.querySelectorAll('.bbbg')].map(x=>x.innerText)});
ok(r.some(t=>/ON/.test(t))&&r.some(t=>/not sent/.test(t)),'badges '+JSON.stringify(r));
UI_=await p.evaluate(()=>{const mk=(id,bbb)=>({id,name:'A v B, 1st Test, X tour',type:'test',teams:[{name:'A',short:'A'},{name:'B',short:'B'}],score:[],started:true,ended:false,status:'Live',bbb,date:'2026-10-28',time:new Date().toISOString()});UI.live={ok:true,matches:[mk('m1',true),mk('m2',false)]};UI.wbbb=0;UI.view='matches';render();return {a:document.querySelectorAll('.bbbg').length,none:!document.querySelector('[data-a=wbbb]')}});
UI_.b=await p.evaluate(()=>{const mk=(id,bbb)=>({id,name:'A v B, 1st Test, X tour',type:'test',teams:[{name:'A',short:'A'},{name:'B',short:'B'}],score:[],started:true,ended:false,status:'Live',bbb,date:'2026-10-28',time:new Date().toISOString()});UI.live={ok:true,matches:[mk('m1',true),mk('m2',false)]};A.wbbb();return document.querySelectorAll('.bbbg').length});
ok(!UI_.none&&UI_.a===2&&UI_.b===1,'filter '+JSON.stringify(UI_));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: bbb badge');})();
