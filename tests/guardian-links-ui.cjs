const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const posts=[];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true,items:[]};
 if(/\/api\/links$/.test(u)&&m==='GET')j={ok:true,items:[{id:'l1',rel:'parent',status:'pending',role:'player',who:'Mom'},{id:'l2',rel:'coach',status:'approved',role:'guardian',who:'Kid',shid:'SH-AB12CD34'}]};
 else if(m==='POST')posts.push([u,r.request().postData()]);
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'QA',role:'viewer'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1,shid:'SH-ME123456'};window.apiBase=()=>'http://x';UI.view='settings';render();await new Promise(r=>setTimeout(r,600));
 const t=document.body.innerText,o={};o.card=/Family, coach and teacher links/.test(t);o.mine=/SH-ME123456/.test(t);o.rows=/Mom/.test(t)&&/you are their coach/.test(t)&&/Linked/.test(t);o.btns=!!document.querySelector('[data-a=glYes]')&&!!document.querySelector('[data-a=glEnd]');
 document.getElementById('gl-id').value='bad';await A.glSend();o.badId=true;
 document.getElementById('gl-id').value='SH-AB12CD34';document.getElementById('gl-r').value='teacher';await A.glSend();await A.glYes({id:'l1'});await A.glEnd({id:'l2'});o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r),posts.length);for(const k of Object.keys(r))ok(r[k],k);
ok(posts.some(x=>/links\/request/.test(x[0])&&/teacher/.test(x[1]))&&posts.some(x=>/decide/.test(x[0])&&/approved/.test(x[1]))&&posts.some(x=>/decide/.test(x[0])&&/revoked/.test(x[1])),'posts');ok(posts.filter(x=>/links\/request/.test(x[0])).length===1,'bad id not sent');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS guardian links ui');await b.close()})()
