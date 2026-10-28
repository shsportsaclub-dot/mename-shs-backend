// The headline score is re-added from scorecard rows when the provider's score field lags behind them.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{
 const mk=(sc,extras)=>({m:{id:'f1',score:[{inning:'Bangladesh Inning 1',r:110,w:2,o:35.1}]},sc:{scorecard:[{inning:'Bangladesh Inning 1',extras,batting:[{batsman:{name:'A'},r:20,'dismissal-text':'b X'},{batsman:{name:'B'},r:15,'dismissal-text':'c Y b Z'},{batsman:{name:'C'},r:52,'dismissal-text':'batting'},{batsman:{name:'D'},r:19,'dismissal-text':'batting'}],bowling:[{bowler:{name:'P'},o:'15.0',r:50},{bowler:{name:'Q'},o:'13.0',r:40},{bowler:{name:'R'},o:'8.2',r:25}]}]}});
 const W=mk(0,{b:2,lb:1,w:3,nb:1}),a=shDeriveScore(W),s=W.m.score[0];
 const W2=mk(0,null),a2=shDeriveScore(W2);
 const W3=mk(0,{b:0,lb:0,w:0,nb:0});W3.m.score[0].o=40;const a3=shDeriveScore(W3);
 return {a,r:s.r,w:s.w,o:s.o,a2,a3}});
ok(r.a&&r.r===20+15+52+19+7&&r.w===2&&r.o==='36.2','derived '+JSON.stringify(r));
ok(!r.a2,'no extras, no guess');ok(!r.a3,'never moves score backwards');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: fresh score');})();
