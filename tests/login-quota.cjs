// Sign-in must survive a reload even when the big app state cannot be stored (iPhone storage limits).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext(),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
const url='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='scoringheroes.v1'&&String(v).length>20000)throw new DOMException('quota','QuotaExceededError');return o.call(this,k,v)}});
await p.goto(url);await p.waitForTimeout(500);
await p.evaluate(()=>{S.user={name:'Hema',nick:'Hema',phone:'9999999999',role:'viewer',kind:'Fan',photo:'data:image/jpeg;base64,'+'A'.repeat(60000)};S.tok='tok123';UI.stage='app';commit()});
await p.reload();await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!S.user&&S.user.phone==='9999999999'&&S.tok==='tok123'),'still signed in after reload although the big state did not fit');
await p.evaluate(()=>{A.logout()});await p.reload();await p.waitForTimeout(500);
ok(await p.evaluate(()=>!S.user),'sign out really signs out');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: login survives storage limit');})();
