const {chromium}=require('playwright');const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{const html=fs.readFileSync('app-index.html'),sv=http.createServer((q,r)=>{r.setHeader('content-type','text/html');r.end(html)});await new Promise(r=>sv.listen(18983,'127.0.0.1',r));
const b=await chromium.launch();try{for(const w of [320,412]){const p=await b.newPage({viewport:{width:w,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url()==='http://127.0.0.1:18983/'?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('http://127.0.0.1:18983/');
await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'scorer',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1};S.teams=[{id:'t1',name:'Hapur Tigers CC',short:'HAP',color:'#f00',players:[],loc:{district:'Hapur',city:'Hapur'}}];UI.view='teams';render()});
await p.locator('[data-a="ctwOpen"]').click();
await p.locator('[data-a="ctwSet"][data-v="Academy Team"]').click();await p.locator('[data-a="ctwNext"]').click();
await p.locator('input[data-k="state"]').fill('Uttar Pradesh');await p.locator('input[data-k="district"]').fill('Hapur');await p.locator('input[data-k="city"]').fill('Hapur');await p.locator('[data-a="ctwNext"]').click();
await p.locator('input[data-k="name"]').fill('Hapur Tigers');await p.locator('[data-a="ctwSearch"]').click();
assert.match(await p.locator('#modal').innerText(),/Hapur Tigers CC[\s\S]*match/i);
assert.equal(await p.locator('#modal [data-a="ctwRequest"]').count(),2);
await p.locator('[data-a="ctwNext"]').click();await p.locator('input[data-k="name"]').fill('Village Heroes');await p.locator('[data-a="ctwNext"]').click();
assert.match(await p.locator('#modal').innerText(),/Academy Team[\s\S]*Cricket[\s\S]*Not verified|User-submitted/);
await p.locator('[data-a="ctwCreate"]').click();
const t=await p.evaluate(()=>S.teams.at(-1));assert.equal(t.name,'Village Heroes');assert.equal(t.cat,'Academy Team');assert.equal(t.verified,false);assert.equal(t.aff.state,'Not Claimed');assert.equal(t.players.length,0);assert.equal(t.loc.district,'Hapur');
// duplicate guard
await p.locator('[data-a="ctwOpen"]').click();await p.locator('[data-a="ctwNext"]').click();await p.locator('input[data-k="city"]').fill('X');await p.locator('[data-a="ctwNext"]').click();
await p.locator('input[data-k="name"]').fill('Village Heroes');await p.locator('[data-a="ctwNext"]').click();await p.locator('[data-a="ctwNext"]').click();await p.locator('[data-a="ctwCreate"]').click();
assert.equal(await p.evaluate(()=>S.teams.length),2,'exact duplicate blocked on first create');
assert.match(await p.locator('#modal').innerText(),/possible match/i);
await p.locator('[data-a="ctwRequest"][data-v="claim"]').first().click();
assert.equal(await p.evaluate(()=>S.teams.find(x=>x.name==='Village Heroes').requests[0].status),'Requested');
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
assert.deepEqual(errs,[]);await p.close()}
console.log('PASS create team: search-first, duplicate guard, claim request, affiliation state, 320/412')}finally{await b.close();sv.close()}})().catch(e=>{console.error(e);process.exit(1)});
