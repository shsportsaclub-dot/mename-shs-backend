const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
 S.players=Array.from({length:33},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':i<22?'b':'c'}));
 S.teams=['a','b','c'].map((id,k)=>({id,name:'Team '+id.toUpperCase(),short:id.toUpperCase()+'X',players:S.players.slice(k*11,k*11+11).map(p=>p.id)}));
 S.tours=[{id:'t1',name:'Winter Cup',kind:'',fixtures:[{id:'f1',a:'b',b:'c',date:'2026-11-02'}],overs:10,rules:{ball:'tennis',win:2,tie:1,nr:1}},{id:'t2',name:'Ashes Series',kind:'series',fixtures:[]}];render();UI.qs=null;A.newMatch()});
await p.waitForTimeout(200);
await p.click('button[data-a=ddOpen][data-k=mcat]');
const names=await p.locator('button[data-a=ddPick][data-k=mcat]').allInnerTexts();
for(const n of ['Series','Tournament','League / Franchise','Academy match','Practice / Trial','Demo match'])assert.ok(names.some(x=>x.startsWith(n)),n);
assert.ok(await p.locator('#dd-q-mcat').count(),'search box for a long list');
await p.click('button[data-a=ddPick][data-k=mcat][data-v=tournament]');
const opts=await p.locator('select[data-c=qsTour] option').allInnerTexts();assert.deepEqual(opts,['Not linked (one-off match)','Winter Cup'],'only tournaments, not series');
await p.selectOption('select[data-c=qsTour]','t1');await p.selectOption('select[data-c=qsFix]','f1');
assert.deepEqual(await p.evaluate(()=>[UI.qs.a,UI.qs.b]),['b','c'],'fixture sets the teams');
assert.deepEqual(await p.evaluate(()=>[UI.qs.overs,UI.qs.fmt,UI.qs.ball]),['10','t10','tennis'],'tournament rules applied');
assert.match(await p.locator('#modal').innerText(),/Winter Cup rules[\s\S]*10 overs per side[\s\S]*Tennis ball[\s\S]*Points: win 2/);
await p.evaluate(()=>{A.qsSet({k:'overs',v:'50'});A.qsSet({k:'ball',v:'leather'});A.qsFmt({v:'odi'})});
assert.deepEqual(await p.evaluate(()=>[UI.qs.overs,UI.qs.fmt,UI.qs.ball]),['10','t10','tennis'],'cannot drift from the tournament');
await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStep][data-v="1"]');await p.fill('#qs-venue','Cup Ground');
await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const m=S.matches[0];return m&&{mode:m.mode,tid:m.tid,fid:m.fid,linked:S.tours[0].fixtures[0].mid===m.id}});
assert.deepEqual(r,{mode:'tournament',tid:'t1',fid:'f1',linked:true});
assert.equal(await p.evaluate(()=>S.matches[0].overs),10,'match follows the tournament overs');
/* series list shows series only; individual clears the link */
await p.evaluate(()=>{UI.qs=null;A.newMatch()});await p.click('button[data-a=ddOpen][data-k=mcat]');await p.click('button[data-a=ddPick][data-k=mcat][data-v=series]');
assert.deepEqual(await p.locator('select[data-c=qsTour] option').allInnerTexts(),['Not linked (one-off match)','Ashes Series']);
/* create a tournament right here */
await p.evaluate(()=>{UI.qs=null;A.newMatch()});await p.click('button[data-a=ddOpen][data-k=mcat]');await p.click('button[data-a=ddPick][data-k=mcat][data-v=tournament]');
await p.click('button[data-a=qsTourNewToggle]');await p.fill('#qnt-name','Spring Cup');
await p.click('button[data-a=qsTourNew]');await p.waitForTimeout(150);
const c=await p.evaluate(()=>{const t=S.tours.find(x=>x.name==='Spring Cup');return t&&{id:UI.qs.tid===t.id,teams:t.teams.length,fx:t.fixtures.length,view:UI.view}});
assert.ok(c&&c.id&&c.teams===2&&c.fx>=1,'created and selected '+JSON.stringify(c));assert.notEqual(c.view,'tour','stays in the start flow');
assert.deepEqual(errs,[]);console.log('PASS qs-series');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
