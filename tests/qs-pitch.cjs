const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];S.wiz=null;
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];render();UI.qs=null;A.newMatch();
 /* a registered ground with two pitches is picked */
 UI.qg={state:'found',pos:{lat:1,lng:1},items:[{id:'g1',name:'Sky Ground',dist:10,lat:1,lng:1,pitch:'Red soil',pitches:['Red soil','Matting']}]};A.qsPickG({v:'g1'})});
assert.deepEqual(await p.evaluate(()=>[UI.qs.pitchType,UI.qs.gpit]),['Red soil',['Red soil','Matting']],'ground pitch picked for you');
await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(150);
await p.click('button[data-a=ddOpen][data-k=pitchType]');
const names=await p.locator('button[data-a=ddPick][data-k=pitchType]').allInnerTexts();
assert.ok(names[1].startsWith('Red soil (this ground)')&&names[2].startsWith('Matting (this ground)'),'ground pitches first: '+names.slice(0,4));
for(const n of ['Turf','Black soil','Cement','Astro turf','Synthetic','Dry mud','Mixed'])assert.ok(names.some(x=>x.startsWith(n)),n);
assert.ok(await p.locator('#dd-q-pitchType').count(),'search box');
await p.click('button[data-a=ddPick][data-k=pitchType][data-v="Black soil"]');
assert.equal(await p.evaluate(()=>UI.qs.pitchType),'Black soil');assert.match(await p.locator('#modal').innerText(),/Black soil: holds moisture/);
/* the register-a-ground form has the full list as scroll-down selects */
await p.evaluate(()=>{S.tok='x';UI.qs.step=2;UI.qg={state:'found',pos:{lat:2,lng:2},items:[]};UI.qs.gid='';shQsShow()});
const opts=await p.locator('#qg-pitch option').allInnerTexts();assert.ok(opts.includes('Black soil')&&opts.includes('Red soil')&&opts.includes('Matting'),opts.join());
assert.ok(await p.locator('#qg-pitch2').count());
/* start: the match keeps the pitch */
await p.evaluate(()=>{UI.qg=null;UI.qs.gid='';UI.qs.step=2;shQsShow()});
await p.fill('#qs-venue','Soil Ground');await p.click('button[data-a=qsStep][data-v="1"]');await p.click('button[data-a=qsStart]');await p.waitForTimeout(300);
assert.equal(await p.evaluate(()=>S.matches[0].pitchType),'Black soil');
assert.deepEqual(errs,[]);console.log('PASS qs-pitch');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
