// Timeline must not repeat the same score because the provider spells the team name in different cases.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const n=await p.evaluate(()=>{localStorage.clear();const W=m=>({m:Object.assign({id:'dd1',started:true,ended:false},m)});
 shTlObserve(W({score:[{inning:'Zimbabwe Women Inning 1',r:5,w:0,o:'0.3'}]}));
 shTlObserve(W({score:[{inning:'zimbabwe women Inning 1',r:5,w:0,o:0.3}]}));
 return shTlObserve(W({score:[{inning:'Zimbabwe Women Inning 1',r:5,w:0,o:0.3}]})).length});
if(n!==1||errs.length){console.log('FAIL',n,errs.join(';'));process.exitCode=1}else console.log('PASS: timeline dedupe');await b.close()})();
