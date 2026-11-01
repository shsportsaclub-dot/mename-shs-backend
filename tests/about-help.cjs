// About us, Help centre, Laws study, per-feature help button.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{window.confirm=()=>true;UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};UI.view='about';render()});
const t=async()=>p.evaluate(()=>document.getElementById('app').innerText);
let x=await t();assert(/About us/i.test(x)&&/Career benefit/i.test(x)&&/Cricket/.test(x)&&/Football/.test(x)&&/coming soon|full features|scorer and records/i.test(x),'about');
await p.evaluate(()=>{UI.drawer=true;render()});const first=await p.evaluate(()=>document.querySelector('.drawer .grp').innerText);assert(/about and help/i.test(first),'menu first '+first);
const dots=await p.evaluate(()=>[...document.querySelectorAll('.drawer .mi')].filter(b=>b.querySelectorAll('.e circle[r="1.6"]').length===3).map(b=>b.dataset.v+'|'+b.innerText));assert.deepEqual(dots,[],'dots icons');
await p.evaluate(()=>{UI.drawer=false;UI.view='helpc';render()});x=await t();assert(/Help centre/.test(x)&&/SH Auction/.test(x)&&/Scorer/.test(x));
await p.evaluate(()=>{UI.view='learn';UI.lt='laws';render()});x=await t();assert(/Leg before wicket/.test(x)&&/Players\x27 conduct/.test(x)&&!/\s43\s/.test('x'));
const n=await p.evaluate(()=>document.querySelectorAll('.lw').length);assert.equal(n,42,'42 laws '+n);
for(const k of ['ump','score','form','field','gl'])await p.evaluate(k=>{UI.lt=k;render()},k);
await p.evaluate(()=>{UI.lt='quiz';render()});await p.click('.lq button');await p.waitForTimeout(100);assert(await p.$('.lq .btn'),'quiz next');
await p.evaluate(()=>{UI.view='auction';UI.au=UI.au||{};UI.au.open=null;UI.au.tab='home';render()});
assert(await p.$('.hlpb'),'help button');await p.click('.hlpb');await p.waitForTimeout(100);assert(/SH Auction/.test(await p.evaluate(()=>document.getElementById('sh-hlp').innerText)),'help panel');
await p.click('#sh-hlp .btn:not(.ghost)');assert(!(await p.$('#sh-hlp')),'closed');
assert.deepEqual(errs,[]);await p.screenshot({path:'/tmp/ah.png'});console.log('PASS about help');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
