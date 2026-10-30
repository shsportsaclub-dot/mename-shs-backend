// The win % bar follows the market consensus when the server has it (percent only), else the run-rate model.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});window.apiBase=()=>'http://x';UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'a1',name:'ZIMW v INDW',started:true,ended:false,type:'ODI',overs:50,teams:[{name:'Zimbabwe Women',short:'ZIMW'},{name:'India Women',short:'INDW'}],score:[{inning:'Zimbabwe Women Inning 1',r:200,w:10,o:50},{inning:'India Women Inning 1',r:150,w:3,o:35}],status:'Live'},mi:{},sc:{scorecard:[]},bb:{bbb:[]},tab:'live'};UI.view='wmatch';UI.wo={};render()});await p.waitForTimeout(300);
const model=await p.evaluate(()=>document.querySelector('.hero .wbar').innerText.replace(/\s+/g,' '));
await p.evaluate(()=>{UI.wo.a1={t:Date.now(),p:{'India Women':31.4,'INDW':31.4,'Zimbabwe Women':68.6,'ZIMW':68.6}};render()});await p.waitForTimeout(300);
const mk=await p.evaluate(()=>({t:document.querySelector('.hero .wbar').innerText.replace(/\s+/g,' '),w:document.querySelector('.hero .wbar .wa').style.width,ti:document.querySelector('.hero .wbar').title}));
ok(/31%/.test(mk.t)&&/69%/.test(mk.t),'market chance shown '+mk.t+' (model was '+model+')');ok(mk.w==='31%','bar width '+mk.w);ok(/market/i.test(mk.ti)&&!/\b\d\.\d\d\b/.test(mk.t),'no prices shown');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: win odds',mk.t);})();
