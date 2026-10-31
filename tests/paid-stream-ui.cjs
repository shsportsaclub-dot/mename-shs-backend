const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const posts=[];let gates={},locked=['m1'];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true,items:[]};
 if(/streams\/gate/.test(u)){posts.push(['gate',JSON.parse(r.request().postData())])}
 else if(/pay\/charge/.test(u)&&m==='POST'){posts.push(['charge',JSON.parse(r.request().postData())]);j={ok:true,id:'py0123456789'}}
 else if(/pay\/charge/.test(u))j={ok:true,charge:{id:'py0123456789',title:'Viewing pass',amount:10000,payee:'Org',upi:'o@bank',open:true,mine:[],confirmed:2}};
 else if(/\/streams/.test(u))j={ok:true,streams:{},gates,locked};
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async(args)=>{UI.stage='app';S.user={name:'Fan',role:'viewer'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';const o={},w=ms=>new Promise(r=>setTimeout(r,ms));
 UI.gate={gates:{m1:'py0123456789'},locked:['m1'],ch:{}};let h=streamCard('m1',true);o.lock=/id="pass-lock"/.test(h)&&/Buy pass/.test(h)&&!/<iframe/.test(h);
 document.body.insertAdjacentHTML('beforeend','<div id="t">'+h+'</div>');await w(500);h=streamCard('m1',true);o.price=/₹100/.test(h)&&/Org/.test(h);
 UI.gate.locked=[];h=streamCard('m1',true);o.openForPayer=!/id="pass-lock"/.test(h)&&!/id="pass-setup"/.test(h);
 S.user={name:'Sc',role:'scorer'};UI.gate={gates:{},locked:[],ch:{}};h=streamCard('m1',false);o.setup=/Sell viewing passes/.test(h);
 document.body.insertAdjacentHTML('beforeend','<input id="gt-a" value="150"><input id="gt-u" value="o@bank"><input id="gt-d" value="30"><select id="gt-use"><option value="py0123456789"></option></select>');await A.gtOn({k:'m1'});o.gated=UI.gate.gates.m1==='py0123456789';
 h=streamCard('m1',false);o.on=/Paid viewing is on/.test(h)&&/Make it free/.test(h);o.setup2=/Valid for how many days/.test(streamCard('m9',false));await A.gtUse({k:'m2'});o.reuse=UI.gate.gates.m2==='py0123456789';o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);
const c=posts.find(x=>x[0]==='charge');ok(c&&c[1].amount===15000&&c[1].kind==='pass'&&c[1].ref==='m1'&&c[1].days===30,'charge payload '+JSON.stringify(posts));
ok(posts.some(x=>x[0]==='gate'&&x[1].key==='m1'&&x[1].charge==='py0123456789'),'gate payload');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS paid stream ui');await b.close()})()
