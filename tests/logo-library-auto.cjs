// Team logo library: a logo added once shows automatically for any matching team name; branded page backdrop present.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};S.auc=[];
const c=document.createElement('canvas');c.width=c.height=40;const x=c.getContext('2d');x.fillStyle='#0a0';x.fillRect(0,0,40,40);S.logoLib=[{id:'lgtest',names:['Mumbai Indians','MI'],img:c.toDataURL('image/png')}];
UI.view='auction';UI.au.tab='home';render();shDemoAuc();A.auOpen({v:'demo-hcl'});UI.au.dtab='teams';render()});
await p.waitForTimeout(300);
const r=await p.evaluate(()=>({mi:!!document.querySelector('.aucc[src^="data:image/png"]'),count:document.querySelectorAll('.aucc[src^="data:image/png"]').length,lib:shLogoFor('mumbai indians')?1:0,csk:shLogoFor('Chennai Super Kings')?1:0,short:shLogoFor('MI')?1:0,before:getComputedStyle(document.body,'::before').backgroundImage.startsWith('url')}));
assert(r.mi&&r.count>=1,'crest uses library '+JSON.stringify(r));assert(r.lib&&!r.csk&&r.short,'matching '+JSON.stringify(r));assert(r.before,'backdrop');
await p.evaluate(()=>{UI.view='logolib';render()});assert(/Team logo library/.test(await p.evaluate(()=>document.getElementById('app').innerText)),'page');
await p.evaluate(()=>{S.user.role='viewer';render()});assert(/Admins only/.test(await p.evaluate(()=>document.getElementById('app').innerText)),'blocked');
assert.deepEqual(errs,[]);console.log('PASS logo library auto');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
