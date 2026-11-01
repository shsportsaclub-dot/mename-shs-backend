// Schedule (upcoming by day), Archives (results by year/series) and tappable match cards.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
const now=Date.now(),D=86400000;const mk=(i,st)=>{const t=new Date(now+i*D*(st==='rec'?-1:1)).toISOString().slice(0,19);return{id:'w'+i,name:'Team A'+i+' vs Team B'+i+', '+i+'th Match, Test Series 2026',type:i%2?'t20':'odi',status:st==='live'?'A need 10':st==='up'?'Match not started':'A won by 5 wkts',venue:'Ground '+i,date:t.slice(0,10),time:t,started:st!=='up',ended:st==='rec',teams:[{name:'Team A'+i,shortname:'TA'},{name:'Team B'+i,shortname:'TB'}],score:[]}};
UI.live={ok:true,matches:[mk(1,'live'),mk(2,'up'),mk(3,'up'),mk(4,'rec'),mk(5,'rec')],updated:new Date().toISOString()};A.demo();UI.view='home';render()});
await p.click('.wser button:has-text("Schedule"), nav button:has-text("Schedule"), [data-v=sched]');await p.waitForTimeout(300);
let v=await p.evaluate(()=>UI.view);assert.equal(v,'sched','nav schedule '+v);
let t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/Team A2 vs Team B2/.test(t)&&/Team A3 vs Team B3/.test(t)&&/LIVE NOW/i.test(t)&&/\d{1,2} NOV/i.test(t)&&!/won by 5/.test(t),'schedule '+t.slice(200,700));
await p.click('.scr[data-id=w2]');await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>UI.view+'|'+(UI.wm&&UI.wm.m.id)),'wmatch|w2','open world');
await p.evaluate(()=>{UI.view='arch';render()});t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/Archives/i.test(t)&&/Team A4 vs Team B4/.test(t)&&/A won by 5 wkts/.test(t)&&!/Team A2 vs/.test(t),'archives '+t.slice(200,600));
await p.click('[data-a=arT][data-v=ser]');t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/Test Series 2026/.test(t),'series');
await p.click('[data-a=arS]');assert(/Team A5/.test(await p.evaluate(()=>document.getElementById('app').innerText)),'series filter');
await p.evaluate(()=>{UI.view='matches';UI.mtab='all';render()});await p.click('.cbm[data-mid=w1] .sr');await p.waitForTimeout(400);const r1=await p.evaluate(()=>UI.view+'|'+(UI.wm&&UI.wm.m.id));assert.equal(r1,'wmatch|w1','tap world card '+r1);
await p.evaluate(()=>{UI.view='matches';render()});await p.click('.card.cbm:has(.ft) .sr');await p.waitForTimeout(300);assert(await p.evaluate(()=>UI.view!=='matches'),'tap SH card');
await p.evaluate(()=>{UI.view='reels';UI.reelsOpen=0;render()});t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/SH Sports Club on YouTube/i.test(t)&&/Open channel/i.test(t),'videos hub');
await p.evaluate(()=>{UI.view='tours';render()});t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/Test Series 2026/.test(t)&&/Your tournaments/i.test(t),'series list');
await p.click('[data-a=serOpen]');await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>UI.view),'sched','series open');
assert.deepEqual(errs,[]);console.log('PASS schedule archive');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
