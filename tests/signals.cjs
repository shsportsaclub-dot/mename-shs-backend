const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'scorer',kind:'Scorer',phone:'+910000000000'};S.matches=[];
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'QA'});m.cat={gender:'men'};UI.sid=m.id;UI.mid=m.id;
 const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p12');F.startInn(f);UI.view='score';render()});
await p.waitForTimeout(300);
for(const v of ['wd','nb','b','lb'])assert.ok(await p.locator(`button[data-a=ex][data-v=${v}] i.us svg`).count(),'icon on '+v);
const sig=async(f)=>{await p.evaluate(f);await p.waitForTimeout(80);return p.evaluate(()=>{const e=document.getElementById('sh-sig');return e?e.innerText.replace(/\s+/g,' ').trim():''})};
assert.match(await sig(()=>ball(S.matches[0],{r:0,x:'wd'})),/WIDE/);
assert.match(await sig(()=>ball(S.matches[0],{r:0,x:'nb'})),/NO BALL/);
assert.match(await sig(()=>ball(S.matches[0],{r:4,x:'',ang:null})),/FOUR/);
assert.match(await sig(()=>ball(S.matches[0],{r:6,x:'',ang:null})),/SIX/);
assert.match(await sig(()=>ball(S.matches[0],{r:0,x:'b'})),/BYE/);
assert.match(await sig(()=>ball(S.matches[0],{r:0,x:'lb'})),/LEG BYE/);
assert.match(await sig(()=>ball(S.matches[0],{w:'Bowled',out:'p0',fld:'',r:0,x:''})),/OUT[\s\S]*Player 0/i);
/* fifty */
const f=await p.evaluate(()=>{const m=S.matches[0];const inn=m.innings[m.cur];return inn.cur&&inn.cur.s});
/* a plain dot ball shows nothing */
await p.waitForTimeout(1800);assert.equal(await p.evaluate(()=>!!document.getElementById('sh-sig')),false,'pop-up goes away');
/* guide and toggle */
await p.evaluate(()=>A.sigGuide());assert.ok(await p.locator('.sgg svg').count()>=15,'guide has signals and players');assert.match(await p.locator('#modal').innerText(),/DISREGARD LAST SIGNAL[\s\S]*Bowler/);
await p.evaluate(()=>{UI.modal=null;renderModal();S.settings.sigOff=true;});assert.equal(await sig(()=>ball(S.matches[0],{r:4,x:'',ang:null})),'','off switch');
assert.deepEqual(errs,[]);console.log('PASS signals');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
