const {chromium}=require('playwright');const assert=require('node:assert/strict');
const boot=async(b,bit)=>{const p=await b.newPage({viewport:{width:412,height:900}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.addInitScript(v=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true;crypto.getRandomValues=a=>{a[0]=v;return a}},bit);
 await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
 await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
  S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));
  S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];render();UI.qs=null;A.newMatch();UI.qs.venue='Toss Ground';UI.qs.step=3;shQsShow()});return p};
(async()=>{const b=await chromium.launch();
 /* the coin is only an animation: the people select the winner and the choice */
 let p=await boot(b,1);
 await p.click('button[data-a=qsStart]');assert.match(await p.evaluate(()=>document.body.innerText),/Select who won the toss/);
 await p.click('button[data-a=qsFlip]');
 assert.equal(await p.locator('.coin.spinH').count(),1,'coin spins');
 assert.equal(await p.evaluate(()=>!!UI.qs.tsel),false,'the coin does not decide the winner');
 await p.click('button[data-a=qsToss][data-k=tcall][data-v=b]');await p.click('button[data-a=qsToss][data-k=tside][data-v=T]');
 await p.click('button[data-k=toss][data-v=a]');await p.click('button[data-k=dec][data-v=bowl]');
 assert.match(await p.locator('#modal').innerText(),/Home won the toss and chose to bowl first. Away called TAILS/);
 await p.waitForTimeout(200);assert.equal(await p.locator('.coin.spinH').count(),0,'no replay when other things change');
 await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
 assert.deepEqual(await p.evaluate(()=>{const m=S.matches[0];return {toss:m.toss,dec:m.dec,i:m.tossInfo}}),{toss:'a',dec:'bowl',i:{mode:'coin',caller:'b',call:'T',result:'H',winner:'a',chose:'bowl'}});
 /* caller and call are optional */
 p=await boot(b,0);await p.click('button[data-k=toss][data-v=b]');await p.click('button[data-k=dec][data-v=bat]');
 await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
 assert.deepEqual(await p.evaluate(()=>{const m=S.matches[0];return {toss:m.toss,dec:m.dec,c:m.tossInfo.caller}}),{toss:'b',dec:'bat',c:''});
 assert.deepEqual(p.errs,[]);console.log('PASS qs-toss');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
