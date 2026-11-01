// A live match shows a 3D Live entry and opens the in-app 3D stream.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
const m=demoMatch();m.status='live';UI.view='matches';render();const t1=document.getElementById('app').innerText;
UI.mid=m.id;UI.view='match';render();const t2=document.getElementById('app').innerText;
A.live3d({id:m.id});const f=document.getElementById('l3f');return{matches:/3D Live/.test(t1),match:/Watch in 3D/.test(t2),view:UI.view,src:f&&f.getAttribute('src')}});
assert(r.matches&&r.match&&r.view==='live3d'&&/scene=ccast&mid=/.test(r.src),JSON.stringify(r));
await p.evaluate(()=>{S.matches.forEach(m=>m.status='done');UI.view='matches';render()});assert(!/3D Live/.test(await p.evaluate(()=>document.getElementById('app').innerText)),'hidden when not live');
assert.deepEqual(errs,[]);console.log('PASS live3d');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
