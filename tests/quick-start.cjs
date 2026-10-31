// Quick start: one screen, defaults, remembered choices; ends in a ready match with a locked lineup.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA Scorer',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];render();A.newMatch()});
await p.waitForTimeout(200);
const html=await p.evaluate(()=>document.getElementById('modal').innerText);
ok(/Start a match/.test(html)&&/Teams/.test(html)&&/Players/.test(html)&&/Toss/.test(html),'step screen shown');ok(!/Step 1 of 9/.test(html),'not the 9-step wizard');
// no venue -> refused, nothing created
await p.evaluate(()=>A.qsStart());ok(await p.evaluate(()=>S.matches.length===0),'refused without a ground');
await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
await p.click('details[data-qsd=a] summary');await p.evaluate(()=>{document.querySelector('details[data-qsd=a] .qp details').open=true});await p.fill('#qp-n-a','Rahul Dev');await p.click('button[data-a=qpNew][data-t=a]');
await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
await p.click('button[data-a=ddOpen][data-k=fmt]');await p.click('button[data-a=ddPick][data-k=fmt][data-v=t10]');await p.click('button[data-k=overs][data-v="10"]');await p.click('button[data-k=ball][data-v=tennis]');await p.fill('#qs-venue','Gandhi Ground');
await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
await p.click('button[data-k=dec][data-v=bowl]');
await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const m=S.matches[0];return m&&{overs:m.overs,ball:m.ball,venue:m.venue,dec:m.dec,xiA:m.xi.a.length,status:m.status,ready:m.ready,view:UI.view,sc:m.scorer,gender:m.cat&&m.cat.gender,remembered:S.prefs.qs,wiz:S.wiz,audit:(m.audit||[]).map(a=>a.type)}});
ok(r&&r.overs===10&&r.ball==='tennis'&&r.dec==='bowl'&&/Gandhi Ground/.test(r.venue),'settings applied '+JSON.stringify(r));ok(r&&r.xiA===11&&r.ready&&r.view==='score','lineup + ready '+JSON.stringify(r));
ok(r&&r.remembered.overs==='10'&&r.remembered.ball==='tennis','choices remembered');ok(r&&r.wiz==null,'wizard state cleared');
// second time: defaults come from last match
await p.evaluate(()=>{UI.view='home';A.newMatch()});await p.waitForTimeout(150);
ok(await p.evaluate(()=>UI.qs.overs==='10'&&UI.qs.ball==='tennis'&&UI.qs.venue==='Gandhi Ground'),'defaults remembered');
ok(await p.evaluate(()=>S.venues.length===1),'venue reused not duplicated');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: quick start');})();
