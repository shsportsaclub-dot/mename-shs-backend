const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const posts=[];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true,items:[]};
 if(/number-requests/.test(u))j={ok:true,items:[{id:'n1',nick:'Ravi',newNumber:'*******111',reason:'Lost SIM',merge:true,otherNick:'Other',kind:'merge'}]};
 else if(/number-change/.test(u)&&m==='GET')j={ok:true,items:[{id:'x',kind:'change',newNumber:'*******222',status:'pending'}]};
 else if(/scorer\/lookup/.test(u))j={ok:true,found:true,profile:{shid:'SH-AB12CD34',name:'Ravi',kind:'Player',city:'Hyd'}};
 else if(m==='POST'){posts.push([u,r.request().postData()])}
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'QA',role:'admin'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';UI.view='settings';render();await new Promise(r=>setTimeout(r,600));
 const t=document.body.innerText,o={};o.card=/Change my number/.test(t);o.pending=/Waiting for admin/.test(t);o.adm=/MERGE with account "Other"/.test(t);o.lk=/Find a player by phone/.test(t);
 document.getElementById('lk-p').value='9111111111';await A.lkFind();await new Promise(r=>setTimeout(r,300));o.found=/SH-AB12CD34/.test(document.body.innerText)&&!/9111111111/.test(document.body.innerText.replace(/Mobile number/,''));
 const n=S.players.length;A.lkAdd();o.added=S.players.length===n+1&&S.players[S.players.length-1].shid==='SH-AB12CD34';
 document.getElementById('nc-p').value='9222222222';document.getElementById('nc-pin').value='1234';document.getElementById('nc-r').value='Lost SIM';await A.ncSend();
 o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r),posts.length);
for(const k of ['card','pending','adm','lk','found','added','fit'])ok(r[k],k);ok(posts.some(x=>/number-change/.test(x[0])&&/9222222222/.test(x[1])),'post sent');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS number change ui');await b.close()})()
