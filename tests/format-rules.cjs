const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:i%2?'BOWL':'BAT',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 const out={};
 const mk=(ov,fmt)=>{const m=newMatch({a:'a',b:'b',overs:ov,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});if(fmt)m.fmt=fmt;return m};
 for(const [ov,f] of [[20,'t20'],[10,'t10'],[50,'odi'],[900,'test'],[20,'academic']]){const m=mk(ov,f),R=shFmtRules(m);out[f]=[R.name,R.quotaBalls,R.limited]}
 const h=mk(20.5);out.hundred=[shFmtRules(h).name,shFmtRules(h).quotaBalls,h.bpo];
 /* T20: bowler limit and no consecutive overs */
 const m=mk(20,'t20');UI.sid=m.id;UI.mid=m.id;UI.view='score';
 const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p2');f.set('bl','p13');F.startInn(f);
 const seq=['p15','p13','p17','p13','p15','p13'];  /* overs 2..7 */
 const over=()=>{for(let i=0;i<6;i++)ball(m,{r:0,x:'',ang:null})};
 over();out.dbg0=[m.innings[0].lg,JSON.stringify(m.innings[0].cur),m.status];
 A.pickBowl({id:'p13'});out.consec=m.innings[0].cur.bl;   /* refused: bowled the last over */
 for(const id of seq){A.pickBowl({id});over()}
 out.dbg=[m.innings[0].lg,JSON.stringify(m.innings[0].cur),Object.keys(calc(m,0).bowl)];out.p13=(calc(m,0).bowl.p13||{b:0}).b/6;           /* 4 overs */
 A.pickBowl({id:'p19'});over();            /* over 8 */
 A.pickBowl({id:'p13'});out.quota=m.innings[0].cur.bl;     /* refused: quota reached */
 render();out.card=!!document.querySelector('.sh-fr');out.cardTxt=(document.querySelector('.sh-fr summary')||{}).innerText;
 return out});
assert.deepEqual(r.t20,['T20',24,true]);assert.deepEqual(r.t10,['T10',12,true]);assert.deepEqual(r.odi,['ODI',60,true]);assert.equal(r.test[0],'Test');assert.equal(r.test[2],false);assert.deepEqual(r.academic,['Academic',24,false]);assert.deepEqual(r.hundred,['The Hundred',20,5]);
console.log(JSON.stringify(r.dbg0));assert.equal(r.consec,null,'consecutive over refused');assert.equal(r.p13,4);assert.equal(r.quota,null,'5th over refused');assert.ok(r.card,'rules card in scorer');
assert.deepEqual(errs,[]);console.log('PASS format rules',r.cardTxt,JSON.stringify(r.dbg));await b.close()})().catch(e=>{console.error(e);process.exit(1)})
