// Clear history + one complete demo match.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
demoMatch();demoMatch();const before=S.matches.length;UI.view='matches';render();const btn=!!document.querySelector('[data-a=demoFresh]');A.demoFresh();const modal=!!UI.modal;A.demoFreshGo();
const m=S.matches[0];return{before,btn,modal,n:S.matches.length,status:m&&m.status,inn:m&&m.innings.length,res:m&&m.result||'' ,teams:S.teams.length}});
assert(r.before===2&&r.btn&&r.modal,JSON.stringify(r));assert(r.n===1&&r.status==='done'&&r.inn===2,'complete demo '+JSON.stringify(r));
assert.deepEqual(errs,[]);console.log('PASS demo fresh',JSON.stringify(r));await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
