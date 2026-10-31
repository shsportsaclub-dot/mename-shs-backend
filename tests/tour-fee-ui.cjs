const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const posts=[];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true,items:[]};
 if(/pay\/charge/.test(u)&&m==='POST'){posts.push(JSON.parse(r.request().postData()));j={ok:true,id:'py0123456789'}}
 else if(/pay\/charge/.test(u))j={ok:true,charge:{id:'py0123456789',title:'Cup entry fee',amount:100000,payee:'Org',upi:'o@bank',open:true,mine:[]}};
 else if(/tours\/info/.test(u))j={ok:true,tour:{id:'t1',name:'Cup',organizer:'Org',overs:20,teams:2,fee:'py0123456789'}};
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Org',role:'admin'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';
S.players=Array.from({length:4},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'A',short:'A',players:['p0','p1']},{id:'b',name:'B',short:'B',players:['p2','p3']}];S.tours=[{id:'t1',name:'Cup',teams:['a','b'],overs:20,kind:'tournament',fixtures:[],rules:{}}];UI.view='tour';UI.tid='t1';UI.ttab='info';render();const o={};
o.card=!!document.getElementById('trfee');document.getElementById('tf-a').value='1000';document.getElementById('tf-u').value='o@bank';await A.trFee();
o.saved=S.tours[0].feeCharge==='py0123456789'&&S.tours[0].feeAmt===1000;render();o.active=/Fee charge is active: ₹1000/.test(document.body.innerText);
S.user={name:'Mgr',role:'viewer'};await window.shTJoinOpen('t1');await new Promise(r=>setTimeout(r,600));const t=document.body.innerText;o.payBtn=/Pay entry fee/.test(t);
await A.tjPay({id:'py0123456789'});await new Promise(r=>setTimeout(r,600));o.payView=UI.view==='pay'&&/Cup entry fee/.test(document.body.innerText)&&/₹1,000/.test(document.body.innerText);o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);ok(posts.length===1&&posts[0].amount===100000&&posts[0].kind==='tour'&&posts[0].ref==='t1','charge payload '+JSON.stringify(posts));
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS tour fee ui');await b.close()})()
