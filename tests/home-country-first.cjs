// Home list: the viewer's own country (India) comes first, even when its fixture is late in the upcoming list.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1100,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{UI.stage='app';UI.sportInit=1;S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={name:'QA',nick:'QA',phone:'9999999999',role:'viewer',kind:'Fan'};
 const T=['Oman','Kenya','Nepal','Ireland','Namibia','Canada','Japan','Malaysia','Zimbabwe','Wales'];
 const M=T.map((n,i)=>({id:'u'+i,name:n+' vs Italy, T20',type:'t20',started:false,ended:false,time:new Date(Date.now()+(i+1)*36e5).toISOString().slice(0,19),teams:[{name:n,short:n.slice(0,3).toUpperCase()},{name:'Italy',short:'ITA'}],score:[],status:'Upcoming'}));
 M.push({id:'ind',name:'India vs New Zealand, T20',type:'t20',started:false,ended:false,time:new Date(Date.now()+30*36e5).toISOString().slice(0,19),teams:[{name:'India',short:'IND'},{name:'New Zealand',short:'NZ'}],score:[],status:'Upcoming'});
 UI.live={ok:true,matches:M};UI.iso='IN';UI.view='home';UI.cbf='all';render();
 const t=document.body.innerText;return {has:/India/.test(t),pos:t.indexOf('India'),oman:t.indexOf('Oman')}});
ok(r.has,'India fixture is on the home list');ok(r.pos>=0&&r.pos<r.oman,'India comes before other countries '+JSON.stringify(r));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: home country first');})();
