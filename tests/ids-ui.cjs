const {chromium}=require('playwright');const assert=require('node:assert/strict'),fs=require('fs'),http=require('http');
(async()=>{const html=fs.readFileSync('app-index.html'),srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html');r.end(html)});await new Promise(r=>srv.listen(18981,'127.0.0.1',r));const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const calls=[];
await p.route('**/*',async r=>{const u=r.request().url();
 if(u==='http://127.0.0.1:18981/')return r.continue();
 if(u.includes('/api/ids/me'))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,player_id:'SH-P-202611-000007',verification_status:'verified'})});
 if(u.includes('/api/ids/batch')){const body=JSON.parse(r.request().postData());calls.push(body);const o={ok:true,players:{},matches:{},errors:[]};body.players.forEach((x,i)=>o.players[x.ref]={id:'SH-P-202611-'+String(10+i).padStart(6,'0'),status:'pending'});body.matches.forEach((x,i)=>o.matches[x.ref]={id:'SH-M-20261101-'+String(1+i).padStart(6,'0'),status:x.status});return r.fulfill({contentType:'application/json',body:JSON.stringify(o)})}
 return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.addInitScript(()=>{window.confirm=()=>true});
await p.goto('http://127.0.0.1:18981/');await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.settings.apiUrl='https://x.test';S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];
 S.players=Array.from({length:4},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:'a',phone:i===0?'9111122222':''}));
 S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:[]}];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.players.map(p=>p.id),xiB:S.players.map(p=>p.id),venue:'QA ground'});m.cat={gender:'men'};m.venue='QA ground';UI.sid=m.id;UI.mid=m.id;{const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p3');F.startInn(f)}UI.view='score';render()});
assert.match(await p.locator('main').innerText(),/Match ID.{0,20}pending|ID pending/i);
await p.evaluate(()=>shIdSync());await p.waitForTimeout(500);
const r=await p.evaluate(()=>({m:S.matches[0].pubId,p:S.players.map(x=>x.shPid),me:S.user.shPid,created:!!S.matches[0].createdAt}));
assert.equal(r.m,'SH-M-20261101-000001');assert.equal(r.p.filter(Boolean).length,4);assert.equal(r.me,'SH-P-202611-000007');assert.ok(r.created);
assert.equal(calls[0].players[0].phone,'9111122222');assert.equal(calls[0].matches[0].sport,'cricket');
assert.match(await p.locator('main').innerText(),/SH-M-20261101-000001/);
/* no second request when nothing changed; a status change re-syncs but keeps the ID */
const n=calls.length;await p.evaluate(()=>shIdSync());await p.waitForTimeout(300);assert.equal(calls.length,n);
await p.evaluate(()=>{S.matches[0].status='done'});await p.evaluate(()=>shIdSync());await p.waitForTimeout(400);assert.equal(calls.length,n+1);assert.equal(await p.evaluate(()=>S.matches[0].pubId),'SH-M-20261101-000001');
/* shown on profile, players list and scorer */
await p.evaluate(()=>{UI.view='players';render()});assert.ok((await p.locator('.shid').allInnerTexts()).some(t=>/^SH-P-/.test(t)),'player list shows IDs');
await p.evaluate(()=>{UI.view='profile';render()});assert.match(await p.locator('main').innerText(),/Your Player ID[\s\S]*SH-P-202611-000007/);
await p.evaluate(()=>{UI.view='score';render()});assert.match(await p.locator('main').innerText(),/Match ID:\s*SH-M-20261101-000001/);
assert.deepEqual(errs,[]);console.log('PASS ids ui');await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)})
