// Match header shows the last delivery result, then "Ball" while waiting; dot ball shows 0.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage({viewport:{width:430,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
const slot=()=>p.evaluate(()=>{const e=document.querySelector('.rp .lbs');return e?e.innerText.replace(/\n/g,' '):null});
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1};
 window.__bbb=[{inning:1,over:3,ball:1,runs:1,bruns:1,batsman:'A',bowler:'B'},{inning:1,over:3,ball:2,runs:0,bruns:0,batsman:'A',bowler:'B'}];
 UI.wm={m:{id:'lb1',name:'NZ A v IND A',started:true,ended:false,type:'test',teams:[{name:'New Zealand A',short:'NZ A'},{name:'India A',short:'IND A'}],score:[{inning:'New Zealand A Inning 1',r:96,w:4,o:25.4}],status:'Live'},mi:{},sc:{scorecard:[{inning:'New Zealand A Inning 1',batting:[],bowling:[]}]},bb:{bbb:window.__bbb},tab:'live'};UI.view='wmatch';render()});
let t=await slot();ok(t&&/LAST BALL\s+0/.test(t),'dot ball shows 0: '+t);
await p.evaluate(()=>{UI.lb.lb1.at=Date.now()-10000;render()});
t=await slot();ok(t&&/BALL/.test(t)&&!/LAST/.test(t),'waiting state: '+t);
await p.evaluate(()=>{window.__bbb.push({inning:1,over:3,ball:3,runs:5,bruns:0,wide:true,batsman:'A',bowler:'B'});render()});
t=await slot();ok(/LAST BALL\s+wd\+4/.test(t),'wide+4 shown: '+t);
await p.evaluate(()=>{UI.wm.m.ended=true;render()});ok(await slot()===null,'hidden when ended');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: last ball slot');})();
