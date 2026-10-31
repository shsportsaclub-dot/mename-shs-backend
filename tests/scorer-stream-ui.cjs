const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'scorer',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 S.matches=[];newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});UI.view='score';render()});
assert.equal(await p.locator('.sh-scstr').count(),1,'card on scorer screen');
assert.match(await p.locator('.sh-scstr').innerText(),/Not set up/);
await p.fill('.sh-scstr input[name=url]','https://www.youtube.com/live/abcdefghijk');await p.click('.sh-scstr form button.btn');await p.waitForTimeout(300);
const r=await p.evaluate(()=>[getStream('m'+S.matches[0].id),document.querySelector('.sh-scstr').innerText.includes('Video link set')]);
assert.equal(r[0],'https://www.youtube.com/live/abcdefghijk');assert.ok(r[1]);
assert.deepEqual(errs,[]);console.log('PASS scorer stream');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
