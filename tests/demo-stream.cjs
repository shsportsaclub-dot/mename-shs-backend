// The demo match plays a full match in the 3D stream from local data (no server) and replays ball by ball.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const info=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
const m=demoShow();commit();UI.mid=m.id;UI.view='match';render();const t=document.getElementById('app').innerText;
return{id:m.id,status:m.status,inn:m.innings.map(i=>i.ev.length),res:m.result||'',watch:/Watch in 3D/.test(t)}});
console.log(JSON.stringify(info));
assert(info.watch,'watch in 3D shown for demo');assert(info.status==='done'&&info.inn.length===2&&info.inn.every(n=>n>=12),'full 2-innings demo');
const q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));
await q.goto('file://'+process.cwd()+'/app-index.html?scene=ccast&mid='+info.id+'#overlay');await q.waitForTimeout(5000);
const txt=await q.evaluate(()=>document.body.innerText);assert(!/Connecting to the match/.test(txt),'no connecting: '+txt.slice(0,120));
const has=await q.evaluate(()=>!!document.getElementById('ccg'));assert(has,'3D canvas present');
const sc1=await q.evaluate(()=>document.getElementById('ccs')&&document.getElementById('ccs').innerText);
await q.waitForTimeout(14000);
const sc2=await q.evaluate(()=>document.getElementById('ccs')&&document.getElementById('ccs').innerText);
console.log('score t5:',sc1,'| t19:',sc2);assert(sc2&&sc2!==sc1,'score advances ball by ball');
await q.screenshot({path:'/tmp/claude-0/ec/demo-stream.png'});
assert.deepEqual(errs,[]);console.log('PASS demo stream');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
