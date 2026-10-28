// Match Center shows when the provider score last changed and when the app last checked.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const t=await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'fl1',name:'BAN v WI',started:true,ended:false,type:'test',bbb:false,teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:110,w:2,o:35.1}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[],bowling:[]}]},bb:{},tab:'live',scoreAt:Date.now()-5000};UI.view='wmatch';render();return document.getElementById('app').innerText});

ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: freshness line');})();
