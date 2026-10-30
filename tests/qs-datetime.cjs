const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Australia',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
render();A.newMatch();const q=UI.qs;q.step=2;shQsShow();
const has=!!document.getElementById('qs-date')&&!!document.getElementById('qs-time')&&!!document.getElementById('qs-ov');
document.getElementById('qs-date').value='2026-11-02';document.getElementById('qs-time').value='14:30';document.getElementById('qs-ov').value='12';
shQsRead();q.venue='QA Ground';q.step=3;shQsShow();A.qsStart();const m=S.matches[S.matches.length-1];
return {has,overs:m&&m.overs,date:m&&m.date,time:m&&m.time,st:m&&m.startTime}});
console.log(JSON.stringify(r));const ok=r.has&&r.overs===12&&r.date==='2026-11-02'&&/^2026-11-02T/.test(r.time||'')&&r.st==='14:30'&&!errs.length;console.log(ok?'PASS qs date/time/overs':'FAIL '+errs);process.exitCode=ok?0:1;await b.close()})()
