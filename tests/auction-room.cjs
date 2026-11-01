// Owner bid room screen (no account) and organiser button.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
let room={ver:3,open:true,cur:{id:'p1',name:'Rohit Sharma',role:'BAT',base:100,photo:''},bid:120,bidTeam:'t2',next:140,teams:[{id:'t1',name:'Lions',short:'LI',purse:1000,max:600,ok:true},{id:'t2',name:'Tigers',short:'TI',purse:900,max:500,ok:true}],log:[{t:'TI',a:120}]};let posted=null;
await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(/\/api\/aucroom\/au1\/bid/.test(u)){posted=JSON.parse(r.request().postData());room={...room,ver:4,bid:140,bidTeam:'t1',next:160};return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,room})})}
if(/\/api\/aucroom\/au1/.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,room})});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html?bid=au1');await p.waitForTimeout(1500);
let t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/Rohit Sharma/.test(t)&&/Join as team owner/.test(t),'owner screen '+t.slice(0,200));
await p.evaluate(()=>{C.brTeam('t1');C.brCode('abc123')});await p.waitForTimeout(300);
t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/BID\s*140/.test(t),'bid button '+t.slice(0,300));
await p.screenshot({path:'/tmp/bidroom.png'});
await p.evaluate(()=>A.brBid());await p.waitForTimeout(500);assert(posted&&posted.team==='t1'&&posted.code==='ABC123'&&posted.ver===3,'posted '+JSON.stringify(posted));
t=await p.evaluate(()=>document.getElementById('app').innerText);assert(/You are leading/.test(t),'leading '+t.slice(0,300));
// organiser button
await p.evaluate(()=>{S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};UI.stage='app';UI.view='auction';UI.au.tab='home';render();A.auOpen({v:'demo-hcl'});render()});await p.waitForTimeout(300);
assert(await p.evaluate(()=>!!document.querySelector('[data-a=roomOpen]')),'organiser button');
assert.deepEqual(errs,[]);console.log('PASS auction room');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
