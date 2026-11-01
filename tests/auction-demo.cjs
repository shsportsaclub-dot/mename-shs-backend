const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.addInitScript(()=>{window.confirm=()=>true});await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};S.auc=[];UI.view='auction';UI.au.tab='home';render();
 const a=S.auc.find(x=>x.id==='demo-hcl');return a?{n:S.auc.length,teams:a.teams.length,players:a.players.length,name:a.name,logo:!!a.logo,t0:a.teams[0].name,cats:a.players.reduce((o,p)=>(o[p.cat]=(o[p.cat]||0)+1,o),{})}:null});
console.log(JSON.stringify(r));assert.ok(r);assert.equal(r.teams,8);assert.equal(r.name,'Hero Champions League');assert.ok(r.logo&&r.players>=40);
assert.ok(await p.locator('.auccard img.aucc').count()>=1,'logo on card');
/* running the whole flow on the demo: open, bid, sell, formation */
await p.evaluate(()=>{A.auOpen({v:'demo-hcl'});UI.au.dtab='live';render();A.auNext({v:'first'})});
await p.evaluate(()=>{const a=aucOf('demo-hcl');A.auBid({v:'ht1'});A.auBid({v:'ht1'});A.auSold();shFmClose()});
const n=await p.evaluate(()=>{const a=aucOf('demo-hcl');return [a.teams[0].players.length,a.teams[0].purse<100000000]});assert.deepEqual(n,[1,true]);
await p.evaluate(()=>{UI.au.dtab='fm';UI.fm.tid='ht1';render()});assert.equal(await p.locator('.fmav').count(),1);
/* removing the demo keeps it removed */
await p.evaluate(()=>{A.auDel({v:'demo-hcl'});render()});assert.equal(await p.evaluate(()=>S.auc.some(x=>x.id==='demo-hcl')),false);
assert.deepEqual(errs,[]);console.log('PASS auction demo');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
