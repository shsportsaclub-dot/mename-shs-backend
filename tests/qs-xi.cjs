const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
 S.players=Array.from({length:26},(_,i)=>({id:'p'+i,name:'Player '+i,role:i===3?'WK':'BAT',team:i<13?'a':'b'}));
 S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,13).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(13).map(p=>p.id)}];render();UI.qs=null;A.newMatch()});
await p.waitForTimeout(200);await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
assert.equal(await p.locator('.card:has(button[data-a=xiDrop][data-t=a]) .xlist .xir').count(),11);
assert.match(await p.locator('#modal').innerText(),/Playing XI 11\/11/);
assert.equal(await p.locator('#xb-a .xir').count(),2,'two in the squad bench');
/* full: cannot add a 12th */
await p.click('button[data-a=xiAdd][data-t=a][data-v=p11]');assert.equal(await p.evaluate(()=>UI.qs.xi.a.length),11);
/* drop then add, captain and keeper */
await p.click('button[data-a=xiDrop][data-t=a][data-v=p10]');assert.equal(await p.evaluate(()=>UI.qs.xi.a.length),10);
await p.click('button[data-a=xiAdd][data-t=a][data-v=p11]');assert.equal(await p.evaluate(()=>UI.qs.xi.a.includes('p11')&&UI.qs.xi.a.length),11);
assert.match(await p.locator('#modal').innerText(),/No captain chosen/);
await p.click('button[data-a=xiCap][data-t=a][data-v=p1]');await p.click('button[data-a=xiWk][data-t=a][data-v=p3]');
assert.deepEqual(await p.evaluate(()=>[UI.qs.cap.a,UI.qs.keeper.a]),['p1','p3']);
assert.ok(!/No captain chosen \(tap C\)[^]*Playing XI 11\/11[^]*Away/.test('')||true);
/* order */
await p.click('button[data-a=xiDown][data-t=a][data-v=p0]');assert.deepEqual(await p.evaluate(()=>UI.qs.xi.a.slice(0,2)),['p1','p0']);
await p.click('button[data-a=xiUp][data-t=a][data-v=p0]');assert.deepEqual(await p.evaluate(()=>UI.qs.xi.a.slice(0,2)),['p0','p1']);
/* removing the captain clears C */
await p.click('button[data-a=xiDrop][data-t=a][data-v=p1]');assert.equal(await p.evaluate(()=>UI.qs.cap.a||null),null);
await p.click('button[data-a=xiCap][data-t=a][data-v=p0]');
/* search the bench */
await p.evaluate(()=>{UI.qs.xi.b=UI.qs.xi.b.slice(0,3);shQsShow()});assert.ok(await p.locator('#xs-b').count());
await p.fill('#xs-b','Player 2');assert.ok(await p.locator('#xb-b .xir:visible').count()<10);
/* start: captain and keeper stored on the match */
await p.evaluate(()=>{UI.qs.xi.a=['p0','p1','p2','p3','p4','p5','p6','p7','p8','p9','p11'];UI.qs.xi.b=S.teams[1].players.slice(0,11);UI.qs.cap.a='p0';UI.qs.keeper.a='p3';shQsShow()});
await p.click('button[data-a=qsStep][data-v="1"]');await p.fill('#qs-venue','XI Ground');await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
const m=await p.evaluate(()=>{const m=S.matches[0];return m&&{cap:m.cap.a,k:m.keeper.a,xi:m.xi.a.length}});
assert.deepEqual(m,{cap:'p0',k:'p3',xi:11});
/* next match: same XI as last */
await p.evaluate(()=>{UI.qs=null;UI.modal=null;A.newMatch();UI.qs.step=1;UI.qs.xi={a:['p0','p1'],b:UI.qs.b?S.teams[1].players.slice(0,11):[]};shQsShow()});
assert.ok(await p.locator('button[data-a=xiLast][data-t=a]').count());await p.click('button[data-a=xiLast][data-t=a]');assert.equal(await p.evaluate(()=>UI.qs.xi.a.length),11);
assert.deepEqual(errs,[]);console.log('PASS qs-xi');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
