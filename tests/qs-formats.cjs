// Start a match: ground type, match type, format tabs (Academic / Test / ODI / T20 / T10 / Hundred), overs presets or typed, ball, pitch.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];render();A.newMatch()});
await p.waitForTimeout(200);
const txt=()=>p.evaluate(()=>document.getElementById('modal').innerText);
let t=await txt();
ok(/Ground/.test(t)&&/Open ground/.test(t)&&/Open box cricket/.test(t)&&/Indoor box cricket/.test(t),'ground types first');
ok(/Individual/.test(t)&&/Corporate/.test(t)&&/Board cricket/.test(t)&&/Club cricket/.test(t)&&/Demo match/.test(t),'match types');
ok(await p.evaluate(()=>{const e=document.querySelector('.qs-scroll');return getComputedStyle(e).overflowX==='auto'}),'scrolling row');
ok(t.indexOf('Team A')>=0&&t.indexOf('Team A')<t.indexOf('Ground'),'teams come first, then ground and match type');
await p.click('button[data-k=gtype][data-v=ibox]');await p.click('button[data-k=mcat][data-v=corporate]');
ok(await p.evaluate(()=>UI.qs.gtype==='ibox'&&UI.qs.mcat==='corporate'),'chips set');
await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
t=await txt();
for(const f of ['Academic','Test','ODI 50','T20','T10','The Hundred'])ok(t.includes(f),'tab '+f);
const order=await p.evaluate(()=>[...document.querySelectorAll('button[data-a=qsFmt]')].map(x=>x.dataset.v).join());ok(order==='academic,test,odi,t20,t10,hundred','tab order '+order);
ok(/Overs per side/.test(t)&&/Or type the overs yourself/.test(t),'T20 overs choices + manual');
// Test tab: 1..5 days
await p.click('button[data-a=qsFmt][data-v=test]');t=await txt();
ok(['1 day','2 days','3 days','4 days','5 days'].every(x=>t.includes(x))&&!/Overs per side/.test(t),'test days');
await p.click('button[data-k=overs][data-v="903"]');ok(await p.evaluate(()=>UI.qs.overs==='903'&&UI.qs.fmt==='test'),'3 days');
// Academic: overs presets and typed overs
await p.click('button[data-a=qsFmt][data-v=academic]');ok(await p.evaluate(()=>UI.qs.overs==='10'),'academic default');
await p.fill('#qs-ov','13');await p.click('button[data-k=ball][data-v=tennis]');
ok(await p.evaluate(()=>UI.qs.overs==='13'&&UI.qs.ball==='tennis'),'typed overs kept after another choice');
ok(await p.evaluate(()=>document.getElementById('qs-ov').value==='13'),'typed value still shown');
// ODI and Hundred
await p.click('button[data-a=qsFmt][data-v=odi]');ok(await p.evaluate(()=>UI.qs.overs==='50'),'odi 50');
await p.click('button[data-k=overs][data-v="45"]');ok(await p.evaluate(()=>UI.qs.overs==='45'),'odi 45');
await p.click('button[data-a=qsFmt][data-v=hundred]');t=await txt();ok(await p.evaluate(()=>UI.qs.overs==='20.5')&&/100 balls/.test(t),'hundred');
// order: format, ball, pitch, date, ground
const ord=['Format','Ball','Pitch','Match date','Ground / venue'].map(x=>t.indexOf(x));ok(ord.every((v,i)=>v>=0&&(i===0||v>ord[i-1])),'section order '+ord);
await p.click('button[data-a=qsFmt][data-v=t10]');await p.click('button[data-k=pitchType][data-v=Cement]');await p.fill('#qs-venue','Box Arena');
await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const m=S.matches[0];return m&&{overs:m.overs,gtype:m.gtype,level:m.cat&&m.cat.level,pitch:m.pitchType,ball:m.ball,rem:S.prefs.qs,area:((S.venues[0]||{}).areas||[]).map(a=>a.name).join()}});
ok(r&&r.overs===10&&r.gtype==='ibox'&&r.level==='corporate'&&r.pitch==='Cement'&&r.ball==='tennis','saved on the match '+JSON.stringify(r));
ok(r&&r.rem.fmt==='t10'&&r.rem.gtype==='ibox'&&r.rem.mcat==='corporate'&&/Indoor box cricket/.test(r.area),'remembered + area '+JSON.stringify(r));
ok(await p.evaluate(()=>/Indoor box cricket/.test(mHead(S.matches[0]))&&/Corporate/.test(mHead(S.matches[0]))),'shown on the match header');
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'fits phone');
// a Demo match type marks the match as demo (kept out of stats and sync) and is not remembered as the default
await p.evaluate(()=>{S.matches=[];A.newMatch()});await p.waitForTimeout(150);
ok(await p.evaluate(()=>UI.qs.mcat==='corporate'),'last real type remembered');
await p.click('button[data-k=mcat][data-v=demo]');await p.fill('#qs-venue','Demo Ground').catch(()=>{});
await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStep][data-v="1"]');await p.fill('#qs-venue','Demo Ground');await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
const d=await p.evaluate(()=>{const m=S.matches[0];return m&&{demo:isDemo(m),level:m.cat&&m.cat.level,rem:S.prefs.qs.mcat}});
ok(d&&d.demo===true&&d.level===''&&d.rem==='corporate','demo match '+JSON.stringify(d));
// 24-hour expiry: a fresh demo stays, an older one goes, a real match is never touched
const x=await p.evaluate(()=>{const m=S.matches[0];const stamped=typeof m.demoAt==='number';const keepNow=window.shPurgeDemo()===0&&S.matches.length===1;
 m.demoAt=Date.now()-23*36e5;const at23=window.shPurgeDemo()===0&&S.matches.length===1;
 S.matches.push({id:'real1',a:'a',b:'b',status:'live',innings:[],cur:0,overs:20,xi:{}});S.matches.push({id:'old',a:'a',b:'b',status:'done',innings:[],cur:0,overs:20,xi:{},umpires:'Demo umpires'});
 m.demoAt=Date.now()-25*36e5;UI.sid=m.id;const gone=window.shPurgeDemo();return{stamped,keepNow,at23,gone,left:S.matches.map(x=>x.id),sid:UI.sid,oldStamped:typeof (S.matches.find(x=>x.id==='old')||{}).demoAt}});
ok(x.stamped&&x.keepNow&&x.at23,'fresh demo kept '+JSON.stringify(x));ok(x.gone===1&&x.left.join()==='real1,old'&&x.sid===null&&x.oldStamped==='number','25h demo deleted, real match and just-seen demo kept '+JSON.stringify(x));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: qs formats');})();
