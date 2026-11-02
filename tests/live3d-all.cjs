const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];const p=await b.newPage({viewport:{width:420,height:860}});p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};S.sg=S.sg||[];S.sg.push({id:'sgX',sport:'football',tn:['Reds','Blues'],ev:[],ph:'h1'});UI.view='matches';render()});await p.waitForTimeout(300);
const has=await p.evaluate(()=>document.body.innerHTML.includes('data-k="s"'));assert(has,'sport row listed');
await p.evaluate(()=>A.live3d({id:'sgX',k:'s'}));await p.waitForTimeout(300);
const src=await p.evaluate(()=>document.getElementById('l3f').src);assert(/scene=sgame&mid=sgX/.test(src),src);
assert.deepEqual(errs,[]);console.log('PASS live3d all');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
