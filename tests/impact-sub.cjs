const {chromium}=require('playwright');const assert=require('node:assert/strict');
const boot=async(b)=>{const p=await b.newPage({viewport:{width:412,height:900}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
 await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
 await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
  S.players=Array.from({length:26},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<13?'a':'b'}));
  S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,13).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(13).map(p=>p.id)}];render()});return p};
(async()=>{const b=await chromium.launch();
 /* 1. swipe cards in the start flow, subs picked, rule stored on the match */
 let p=await boot(b);await p.evaluate(()=>A.newMatch());await p.waitForTimeout(200);
 await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
 assert.equal(await p.locator('button[data-a=qsRule]').count(),3);
 await p.click('button[data-a=qsRule][data-v=impact]');assert.equal(await p.locator('input[data-c=qssub]').count(),4);
 await p.click('input[data-c=qssub][data-t=a] >> nth=0');await p.click('input[data-c=qssub][data-t=b] >> nth=0');
 await p.click('button[data-a=qsStep][data-v="1"]');await p.fill('#qs-venue','Test Ground');
 await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
 const m0=await p.evaluate(()=>{const m=S.matches[0];return {r:m.subRule,sa:m.subs.a.length,sb:m.subs.b.length}});
 assert.deepEqual(m0,{r:'impact',sa:1,sb:1});assert.deepEqual(p.errs,[]);
 /* super sub needs exactly one */
 p=await boot(b);await p.evaluate(()=>A.newMatch());await p.waitForTimeout(200);await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsRule][data-v=super]');
 await p.click('input[data-c=qssub][data-t=a] >> nth=0');await p.click('input[data-c=qssub][data-t=a] >> nth=1');assert.equal(await p.locator('input[data-c=qssub][data-t=a]:checked').count(),1,'max one super sub');
 /* 2. timing rules on a live innings */
 p=await boot(b);
 const r=await p.evaluate(()=>{const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players.slice(0,11),xiB:S.teams[1].players.slice(0,11)});
  m.subRule='impact';m.subs={a:['p11'],b:['p24']};m.sx=[];UI.sid=m.id;UI.mid=m.id;
  const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p13');F.startInn(f);
  const t=(tm,o,i)=>{UI.sx={t:tm,out:o,inn:i};A.sxApply();return m.sx.length},o=[];
  A.run({v:1});o.push(['mid-over refused',t('a','p10','p11')===0]);
  for(let i=0;i<5;i++)A.run({v:0});
  o.push(['over break allowed',t('a','p10','p11')===1]);
  o.push(['one use per team',t('a','p9','p11')===1]);
  o.push(['replaced player barred from the pool',!csPool(m,'a').includes('p10')]);
  o.push(['not logged as concussion',(m.cs||[]).length===0]);
  m.overs=1;o.push(['over >= cut-off refused',t('b','p23','p24')===1]);
  m.overs=20;o.push(['allowed again within cut-off at the break',t('b','p23','p24')===2]);
  return o});
 assert.ok(r.every(x=>x[1]),JSON.stringify(r));
 /* super sub works mid-over */
 const sup=await p.evaluate(()=>{const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players.slice(0,11),xiB:S.teams[1].players.slice(0,11)});
  m.subRule='super';m.subs={a:['p11'],b:['p24']};m.sx=[];UI.sid=m.id;UI.mid=m.id;const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p13');F.startInn(f);A.run({v:1});
  UI.sx={t:'a',out:'p10',inn:'p11'};A.sxApply();return m.sx.length});
 assert.equal(sup,1,'super sub any time');
 assert.deepEqual(p.errs,[]);console.log('PASS impact and super sub');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
