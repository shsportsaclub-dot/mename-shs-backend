// The sport picked in Select game becomes the player's default on every app start.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:412,height:880}}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
const url='file://'+require('path').resolve(__dirname,'../app-index.html');
const setup=async()=>{await p.evaluate(()=>{window.pullLive=async()=>{};window.apiBase=()=>'';UI.stage='app';S.tok='';S.user={id:'u',name:'T',nick:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.live={ok:true,matches:[]};UI.view='home';render()});await p.waitForTimeout(300)};
await p.goto(url);await p.waitForTimeout(400);await setup();
ok(await p.evaluate(()=>UI.sport)==='cricket','default is cricket');
await p.click('.hdr .sgbtn');ok(/★ default/.test(await p.innerText('.sgl')),'default star shown');
await p.click('.sgl button[data-v=tennis]');await p.waitForTimeout(300);
ok(await p.evaluate(()=>S.prefs.primary)==='tennis','primary saved');
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{window.pullLive=async()=>{};UI.stage='app';S.user=S.user||{id:'u',name:'T',nick:'T',phone:'1',role:'viewer'};UI.sportInit=0;render()});await p.waitForTimeout(300);
console.log('after reload sport',await p.evaluate(()=>UI.sport+' primary '+(S.prefs&&S.prefs.primary)));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: default sport');})();
