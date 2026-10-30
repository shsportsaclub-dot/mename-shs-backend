const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
for(const th of ['hero','mday']){
await p.evaluate(th=>{UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='home';S.settings.theme=th;document.documentElement.dataset.theme=th;render()},th);await p.waitForTimeout(300);
const t=await p.evaluate(()=>[...document.querySelectorAll('.cbnav button')].map(x=>x.textContent));console.log(th,JSON.stringify(t),await p.evaluate(()=>window.shTheme()));
ok(['Live Scores','Schedule','Archives','News','Series','Teams','Videos','Rankings','ePaper','Social','Market'].every(x=>t.includes(x)),th+' has full menu');
ok(await p.evaluate(()=>document.querySelectorAll('.cbnav').length===1),th+' one menu only');
if(th==='hero'){await p.click('.cbnav button[data-v=epaper]');await p.waitForTimeout(200);ok(await p.evaluate(()=>UI.view==='epaper'),'ePaper opens');await p.evaluate(()=>{UI.view='home';render()});await p.click('.cbnav button[data-v=social]');await p.waitForTimeout(200);ok(await p.evaluate(()=>UI.view==='social'),'Social opens');await p.evaluate(()=>{UI.view='home';render()});await p.screenshot({path:'/tmp/claude-0/sky.png'})}}
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: skyhigh nav');})();
