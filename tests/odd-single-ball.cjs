// One ball can never be shown as 5 or 7 runs: a single-ball jump that is not 0,1,2,3,4,6 is an honest "?".
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const t=await p.evaluate(()=>{const n=x=>({at:Date.now(),inning:1,text:x});
 const L=shTrackBalls([n('Tracking started: India 10/0 (1 ov).'),n('India 10/0 (1 ov) to 15/0 (1.1 ov): 5 runs from 1 legal balls.'),n('India 15/0 (1.1 ov) to 22/0 (1.2 ov): 7 runs from 1 legal balls.'),n('India 22/0 (1.2 ov) to 26/0 (1.3 ov): 4 runs from 1 legal balls.'),n('India 26/0 (1.3 ov) to 32/0 (1.4 ov): 6 runs from 1 legal balls.')]);
 return L.map(x=>x.over+'.'+x.ball+':'+x.t+(x.runs?'('+x.runs+')':'')).join(' ')});
const bad=/:5\b|:7\b/.test(t);
if(bad||!/2\.1:\?\(5\)/.test(t)||!/2\.2:\?\(7\)/.test(t)||!/2\.3:4\(4\)/.test(t)||!/2\.4:6\(6\)/.test(t)||errs.length){console.log('FAIL',t,errs.join(';'));process.exitCode=1}else console.log('PASS: odd single ball');await b.close()})();
