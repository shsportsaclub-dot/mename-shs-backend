// Football rules and study page: opens from the sports hub, tabs work, quiz scores, mobile 390px has no overflow.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='sgames';render()});await p.waitForTimeout(300);
ok(await p.$('[data-a=slOpen][data-v=football]'),'entry button');
await p.click('[data-a=slOpen][data-v=football]');await p.waitForTimeout(200);
let t=await p.evaluate(()=>document.body.innerText);ok(/Law 11: Offside/.test(t)&&/Law 17/.test(t)&&/2026\/27/.test(t),'laws list');
ok((await p.$$('.slp .lw')).length===17,'17 laws');
for(const k of ['off','score','form','pos','gl']){await p.click('[data-a=slTab][data-v='+k+']');await p.waitForTimeout(100);ok((await p.evaluate(()=>document.querySelector('.slp .card').innerText.length))>80,'tab '+k)}
await p.click('[data-a=slTab][data-v=quiz]');
for(let i=0;i<10;i++){await p.click('[data-a=slqPick][data-v="2"]');await p.click('[data-a=slqNext]')}
t=await p.evaluate(()=>document.querySelector('.slp').innerText);ok(/Score: \d+ \/ 10/.test(t),'quiz score '+t.slice(0,80));
ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no overflow');
await p.click('[data-a=slTab][data-v=laws]');await p.screenshot({path:'/tmp/claude-0/pt/learn.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: sport learn');})();
