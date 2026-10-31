const {chromium}=require('playwright');const assert=require('node:assert/strict');
const boot=async(b,teams=true)=>{const p=await b.newPage({viewport:{width:412,height:900}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
 await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
 await p.evaluate(t=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
  S.players=Array.from({length:26},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<13?'a':'b'}));
  S.teams=t?[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,13).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(13).map(p=>p.id)},{id:'c',name:'Zebras',short:'ZEB',players:[]}]:[];render()},teams);return p};
(async()=>{const b=await chromium.launch();
 /* 1. no saved teams: only Create team form */
 let p=await boot(b,false);await p.evaluate(()=>{UI.qs=null;A.newMatch()});await p.waitForTimeout(200);
 assert.equal(await p.locator('button[data-a=qtMode]').count(),4,'two tabs per slot');
 assert.ok(await p.locator('#qt-n-a').count(),'create form shown when there are no teams');
 /* create team A by typing */
 await p.fill('#qt-n-a','Lions');await p.click('button[data-a=qtCreate][data-s=a]');await p.waitForTimeout(150);
 assert.equal(await p.evaluate(()=>T(UI.qs.a).name),'Lions');
 /* 2. with saved teams: Select team list, search, pick */
 p=await boot(b,true);await p.evaluate(()=>{UI.qs=null;A.newMatch();UI.qs.a='';UI.qs.b='';shQsShow()});await p.waitForTimeout(200);
 assert.equal(await p.locator('#qt-pl-a .qt-row').count(),3);
 await p.fill('#qt-q-a','zeb');assert.equal(await p.locator('#qt-pl-a .qt-row:visible').count(),1);
 await p.fill('#qt-q-a','nomatch');assert.equal(await p.locator('#qt-pl-a .qt-none:visible').count(),1);
 await p.fill('#qt-q-a','');await p.click('#qt-pl-a .qt-row[data-v=a]');await p.waitForTimeout(100);
 assert.equal(await p.evaluate(()=>UI.qs.a),'a');
 assert.equal(await p.locator('#qt-pl-b .qt-row').count(),2,'team A is not offered again for B');
 await p.click('button[data-a=qtMode][data-s=b][data-v=new]');assert.ok(await p.locator('#qt-n-b').count());
 await p.click('button[data-a=qtMode][data-s=b][data-v=pick]');await p.click('#qt-pl-b .qt-row[data-v=b]');
 assert.equal(await p.evaluate(()=>UI.qs.b),'b');
 /* change team goes back to the picker */
 await p.click('button[data-a=qtClear][data-s=a]');assert.ok(await p.locator('#qt-pl-a').count());await p.click('#qt-pl-a .qt-row[data-v=a]');
 /* 3. players step: instant add to XI and as impact substitute */
 await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
 assert.ok(await p.locator('#qq-n-a').isVisible(),'quick add visible without opening anything');
 await p.fill('#qq-n-a','Ravi Kumar');await p.fill('#qq-m-a','9876543210');await p.selectOption('#qq-r-a','WK');await p.click('button[data-a=qqAdd][data-t=a][data-sub="0"]');await p.waitForTimeout(200);
 let r=await p.evaluate(()=>{const t=T('a'),pl=S.players.find(x=>x.name==='Ravi Kumar');return {in:!!pl,role:pl&&pl.role,phone:pl&&pl.phone,inTeam:t.players.includes(pl.id),inXI:UI.qs.xi.a.includes(pl.id),n:UI.qs.xi.a.length}});
 assert.deepEqual(r,{in:true,role:'WK',phone:'9876543210',inTeam:true,inXI:false,n:11},'XI full: added to the squad only');
 await p.evaluate(()=>{UI.qs.xi.a=UI.qs.xi.a.slice(0,10);shQsShow()});await p.fill('#qq-n-a','Fits In');await p.click('button[data-a=qqAdd][data-t=a][data-sub="0"]');await p.waitForTimeout(200);
 assert.ok(await p.evaluate(()=>UI.qs.xi.a.includes(S.players.find(x=>x.name==='Fits In').id)),'joins the XI when there is room');
 await p.click('button[data-a=qsRule][data-v=impact]');
 await p.fill('#qq-n-as','Spare One');await p.click('button[data-a=qqAdd][data-t=a][data-sub="1"]');await p.waitForTimeout(200);
 r=await p.evaluate(()=>{const pl=S.players.find(x=>x.name==='Spare One');return {in:!!pl,inXI:UI.qs.xi.a.includes(pl.id),sub:UI.qs.sub.a.includes(pl.id)}});
 assert.deepEqual(r,{in:true,inXI:false,sub:true});
 assert.ok(await p.locator('input[data-c=qssub][data-t=a]:checked').count()>=1);
 /* Enter key adds */
 await p.fill('#qq-n-bs','Spare Two');await p.press('#qq-n-bs','Enter');await p.waitForTimeout(200);
 assert.ok(await p.evaluate(()=>UI.qs.sub.b.some(id=>P(id).name==='Spare Two')));
 /* super sub allows only one */
 await p.click('button[data-a=qsRule][data-v=super]');
 await p.fill('#qq-n-as','Another');await p.click('button[data-a=qqAdd][data-t=a][data-sub="1"]');await p.waitForTimeout(200);
 assert.equal(await p.evaluate(()=>UI.qs.sub.a.length),1,'Super Sub is one');
 assert.deepEqual(p.errs,[]);console.log('PASS qs-add');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
