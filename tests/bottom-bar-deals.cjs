const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}});
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'t',role:'admin',phone:'+910000000000'};render()});
await p.click('.bnav button:has-text("Shop")');
const r=await p.evaluate(()=>({v:UI.view,t:UI.mk.tab,on:[...document.querySelectorAll('.bnav button.on')].map(x=>x.textContent),n:document.querySelectorAll('.bnav button').length,fab:!!document.querySelector('.fabfloat')}));
await p.screenshot({path:'/tmp/bn.png'});
await p.click('.bnav button:has-text("Deals")');
const r2=await p.evaluate(()=>[UI.mk.tab,[...document.querySelectorAll('.bnav button.on')].map(x=>x.textContent)]);
console.log(JSON.stringify(r),JSON.stringify(r2));await b.close()})()
