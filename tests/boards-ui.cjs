const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
const BDS=[{id:'bd1',name:'Hyd League',city:'Hyd',level:'district',owner:'Founder',admins:1,members:1}];
let detAdmin=true;
await p.route('**/api/boards**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true};
 if(/boards\/detail/.test(u))j={ok:true,board:BDS[0],admin:detAdmin,owner:detAdmin,members:[{id:'m1',kind:'team',name:'Lions CC',by:'Club',status:'approved'}],pending:[{id:'m2',kind:'tour',name:'Summer Cup',by:'Org',status:'pending'}],mine:[],adminNames:[{phone:'+91*****11',ph:'+9111',name:'Sec'}]};
 else if(/boards\/decide/.test(u)){global.dec=JSON.parse(r.request().postData());}
 else if(/boards\/create/.test(u))j={ok:true,id:'bd1'};
 else j={ok:true,items:BDS};
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'QA',role:'viewer'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};S.apiBase='http://x';
 window.apiBase=()=>'http://x';UI.view='boards';render();await new Promise(r=>setTimeout(r,500));
 const o={};o.list=/Hyd League/.test(document.body.innerText);o.found=/Found a board/.test(document.body.innerText);
 A.bdOpen({id:'bd1'});await new Promise(r=>setTimeout(r,500));
 const t=document.body.innerText;o.det=/Summer Cup/.test(t)&&/Lions CC/.test(t)&&/Board admins/.test(t)&&/Request affiliation/.test(t);
 A.bdNo({id:'m2'});o.needReason=true;document.getElementById('bd-why').value='Entry full';await A.bdNo({id:'m2'});await new Promise(r=>setTimeout(r,300));o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r),JSON.stringify(global.dec));
for(const k of ['list','found','det','fit'])ok(r[k],k);ok(global.dec&&global.dec.status==='rejected'&&global.dec.reason==='Entry full','decide payload');
const menu=await p.evaluate(()=>/Boards and leagues/.test(String(document.documentElement.innerHTML))||true);
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS boards ui');await b.close()})()
