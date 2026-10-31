const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const posts=[];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true,items:[]};
 if(/streams\/gate/.test(u))posts.push(['gate',JSON.parse(r.request().postData())]);
 else if(/pay\/charge/.test(u)&&m==='POST'){posts.push(['charge',JSON.parse(r.request().postData())]);j={ok:true,id:'py0123456789'}}
 else if(/pay\/charge/.test(u))j={ok:true,charge:{id:'py0123456789',title:'Cup viewing pass',amount:30000,days:0,payee:'Org',upi:'o@bank',open:true,mine:[]}};
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Org',role:'admin'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';const o={},w=ms=>new Promise(r=>setTimeout(r,ms));
 S.players=Array.from({length:4},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'A',short:'A',players:['p0','p1']},{id:'b',name:'B',short:'B',players:['p2','p3']}];S.tours=[{id:'t1',name:'Cup',teams:['a','b'],overs:20,kind:'tournament',fixtures:[],rules:{}}];UI.view='tour';UI.tid='t1';UI.ttab='info';render();
 o.offer=/Sell a viewing pass/.test(document.getElementById('trpass').innerText);
 document.getElementById('tp-a').value='300';document.getElementById('tp-u').value='o@bank';document.getElementById('tp-d').value='30';await A.trPassOn();
 o.saved=S.tours[0].passCharge==='py0123456789'&&S.tours[0].passDays===30;render();o.on=/Viewing pass is on/.test(document.getElementById('trpass').innerText);
 // a viewer: the server says this match is locked by the tournament pass
 S.user={name:'Fan',role:'viewer'};UI.gate={gates:{},locked:['mmm1'],by:{mmm1:'py0123456789'},ch:{}};let h=streamCard('mmm1',true);o.lock=/id="pass-lock"/.test(h)&&/Buy pass/.test(h);
 await w(400);h=streamCard('mmm1',true);o.price=/₹300/.test(h);
 S.user={name:'Org',role:'admin'};UI.view='tour';render();await A.trPassOff();o.off=!S.tours[0].passCharge;o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);
const c=posts.find(x=>x[0]==='charge');ok(c&&c[1].amount===30000&&c[1].kind==='pass'&&c[1].ref==='t1'&&c[1].days===30,'charge '+JSON.stringify(posts));
ok(posts.some(x=>x[0]==='gate'&&x[1].key==='T:t1'&&x[1].charge==='py0123456789')&&posts.some(x=>x[0]==='gate'&&x[1].key==='T:t1'&&x[1].charge===null),'gate payloads');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS tour pass ui');await b.close()})()
