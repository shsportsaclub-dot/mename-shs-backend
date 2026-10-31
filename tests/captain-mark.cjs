const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'QA'});m.cap={a:'p0',b:'p12'};m.keeper={a:'p3',b:'p13'};UI.sid=m.id;UI.mid=m.id;
 const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p12');F.startInn(f);ball(m,{r:1,x:'',ang:null});
 return {card:tCard(m),live:tLive(m)}});
assert.match(r.card,/Player 0 \(c\)/,'batter captain');assert.match(r.card,/Player 12 \(c\)/,'bowler captain');assert.match(r.card,/Player 13 †|Player 3 †/);assert.doesNotMatch(r.card,/Player 1 \(c\)/);
assert.deepEqual(errs,[]);console.log('PASS captain-mark');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
