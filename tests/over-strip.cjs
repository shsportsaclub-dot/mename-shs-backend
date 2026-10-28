// Over-by-over strip from the SH live tracker when the provider sends no deliveries.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage({viewport:{width:430,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
const r=await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1};
 const n=(t,x)=>({at:Date.now(),inning:1,text:t});
 const notes=[n('Tracking started: Bangladesh 0/0 (1.2 ov).'),n('Bangladesh 0/0 (1.2 ov) to 3/0 (3 ov): 3 runs from 10 legal balls.'),n('Bangladesh 3/0 (3 ov) to 3/0 (3.3 ov): 0 runs from 3 legal balls.'),n('Bangladesh 3/0 (3.3 ov) to 9/1 (5 ov): 6 runs from 9 legal balls.')];
 UI.wm={m:{id:'ov1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:9,w:1,o:5}],status:'Live'},mi:null,sc:null,bb:{notes,tracked:true},tab:'live'};UI.view='wmatch';render();
 const a=document.querySelector('.ovs.n');return a?a.innerText.replace(/\n/g,' '):''});
ok(/OVER\s*3/.test(r)&&/OVER\s*4/.test(r),'over chips '+r);
await p.screenshot({path:'/tmp/ovstrip.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: over strip');})();
