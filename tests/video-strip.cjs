const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'scorer',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 S.matches=[];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});
 startInnings(m,0,'p0','p1','p12');m.status='live';
 [1,4,0,6,2].forEach(r=>ball(m,{r}));
 S.streams={['m'+m.id]:'https://example.com/v.mp4'};UI.streams=S.streams;
 const h=streamCard('m'+m.id,true);return {swin:/class="swin/.test(h),strip:/class="vstrip"/.test(h),txt:(h.match(/vs-s"><b>[^<]*<\/b><span>[^<]*/)||[''])[0],chips:(h.match(/class="ch/g)||[]).length,none:/class="vstrip"/.test(streamCard('m'+m.id,false))}});
console.log(r);
assert.ok(r.swin&&r.strip&&!r.none);assert.match(r.txt,/13-0/);assert.ok(r.chips>=5);
// mini player on scroll (real match page)
await p.evaluate(()=>{const m=S.matches[0];UI.sid=m.id;UI.mid=m.id;UI.view='match';UI.tab='live';render()});await p.waitForTimeout(400);
const n=await p.locator('.swin').count();console.log('swin on page',n,await p.evaluate(()=>UI.view));
if(n){assert.ok(await p.locator('.vstrip').count()>=1,'strip on page');
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(500);
 const mini=await p.evaluate(()=>document.querySelector('.swin').classList.contains('mini'));console.log('mini after scroll',mini);
 await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(500);
 assert.equal(await p.evaluate(()=>document.querySelector('.swin').classList.contains('mini')),false,'restored');}
assert.deepEqual(errs,[]);console.log('PASS video strip');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
