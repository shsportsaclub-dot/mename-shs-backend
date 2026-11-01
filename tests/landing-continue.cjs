const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'scorer',kind:'Scorer',phone:'+910000000000',pid:'p3'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 S.matches=[];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});startInnings(m,0,'p0','p1','p12');m.status='live';[1,2,4].forEach(r=>ball(m,{r}));UI.view='home';render()});
await p.waitForTimeout(300);
assert.equal(await p.locator('#sh-cont').count(),1,'continue scoring card');assert.match(await p.locator('#sh-cont').innerText(),/7-0/);assert.equal(await p.locator('#sh-mine').count(),1,'player sees the match in My matches (p3 is in the XI)');
await p.click('#sh-cont [data-a=scoreIt]');await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>UI.view),'score');
/* a different user who is not in the XI and did not score does not see it */
const n=await p.evaluate(()=>{S.user={name:'Other',role:'viewer',phone:'+910000000001',pid:'p30'};UI.view='home';render();return document.querySelectorAll('#sh-mine,#sh-cont').length});assert.equal(n,0);
/* Marketplace landing */
await p.evaluate(()=>{S.user={name:'QA',role:'admin',kind:'Scorer',phone:'+910000000000'};UI.view='market';UI.mk.home=true;render()});
assert.ok(await p.locator('.hubw').count()===1&&await p.locator('.hubt').count()>=5,'market welcome and tiles');assert.match(await p.locator('.hubw').innerText(),/Welcome to the Marketplace/);
await p.click('.hubt[data-v=rent]');await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>UI.mk.tab),'rent');assert.equal(await p.locator('.hubb').count(),1);
await p.click('.hubb');assert.ok(await p.locator('.hubt').count()>=5,'back to landing');
/* Social landing */
await p.evaluate(()=>{UI.view='social';UI.st2.open=false;render()});assert.equal(await p.locator('.hubt').count(),16);assert.match(await p.locator('.hubw').innerText(),/Welcome to the Social studio/);
await p.click('.hubt[data-v=toss]');await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>UI.st2.tpl),'toss');assert.ok(await p.locator('#socCv').count()===1,'editor opens');assert.equal(await p.locator('.hubt').count(),0);
await p.click('.hubb');assert.equal(await p.locator('.hubt').count(),16);
assert.deepEqual(errs,[]);console.log('PASS landing + continue');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
