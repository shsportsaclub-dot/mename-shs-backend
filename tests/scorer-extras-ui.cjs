// Scorer console: NB+4 / Wd+2 labels, who faced each ball, tap bowler / batter to change them.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:1500}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';UI.sportInit=1;S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:i%3?'BAT':'BOWL',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];
 S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.players.slice(0,11).map(p=>p.id),xiB:S.players.slice(11).map(p=>p.id)});
 startInnings(m,0,'p0','p1','p11');UI.sid=m.id;UI.mid=m.id;UI.view='score';render()});
await p.waitForTimeout(300);
await p.click('button[data-a=ex][data-v=nb]');
let t=await p.evaluate(()=>[...document.querySelectorAll('button[data-a=run]')].map(b=>b.innerText.trim()).join(','));
ok(/NB,NB\+1,NB\+2,NB\+3,NB\+4/.test(t),'no ball labels '+t);
await p.click('button[data-a=run][data-v="4"]');
t=await p.evaluate(()=>document.body.innerText);ok(/Player 0\s+faced Player 11/.test(t)&&/No ball \+4/.test(t),'who faced + label');
await p.click('button[data-a=ex][data-v=wd]');t=await p.evaluate(()=>[...document.querySelectorAll('button[data-a=run]')].map(b=>b.innerText.trim()).join(','));ok(/Wd,Wd\+1,Wd\+2/.test(t),'wide labels '+t);
await p.click('button[data-a=run][data-v="2"]');
const k=await p.evaluate(()=>{const m=S.matches[0],c=calc(m,0);return{runs:c.runs,lg:m.innings[0].lg,ev:m.innings[0].ev.map(e=>e.x+e.r)}});ok(k.runs===(1+4)+(1+2)&&k.lg===0,'NB+4 and Wd+2 count '+JSON.stringify(k));
// change bowler (mid-over)
await p.click('.sc2-bowl');ok(await p.evaluate(()=>/Change bowler/.test(document.getElementById('modal').innerText)),'bowler picker');
await p.click('#modal button[data-a=shSetBowl][data-id=p12]');ok(await p.evaluate(()=>S.matches[0].innings[0].cur.bl==='p12'),'bowler changed');
// batter: swap strike and replace
const s0=await p.evaluate(()=>S.matches[0].innings[0].cur.s);await p.click('.sc2-bat:not(.on)');await p.click('#modal button[data-a=shMakeStrike]');ok(await p.evaluate(s=>S.matches[0].innings[0].cur.s!==s,s0),'strike swapped');
await p.click('.sc2-bat.on');await p.click('#modal button[data-a=shSetBat][data-id=p5]');ok(await p.evaluate(()=>[S.matches[0].innings[0].cur.s,S.matches[0].innings[0].cur.n].includes('p5')),'batter replaced');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: scorer extras ui');})();
