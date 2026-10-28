// Every ball from the live tracker: dot balls, single balls, honest groups, ribbon + list + last-ball slot.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage({viewport:{width:430,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
const r=await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1};
 const n=t=>({at:Date.now(),inning:1,text:t});
 const notes=[n('Tracking started: Bangladesh 12/1 (8 ov).'),n('Bangladesh 12/1 (8 ov) to 12/1 (8.3 ov): 0 runs from 3 legal balls.'),n('Bangladesh 12/1 (8.3 ov) to 13/1 (8.4 ov): 1 runs from 1 legal balls.'),n('Bangladesh 13/1 (8.4 ov) to 17/1 (9.3 ov): 4 runs from 5 legal balls.'),n('Bangladesh 17/1 (9.3 ov) to 18/1 (9.3 ov): 1 runs from 0 legal balls.')];
 const tb=shTrackBalls(notes);
 UI.wm={m:{id:'tk1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:18,w:1,o:9.3}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[],bowling:[]}]},bb:{notes,tracked:true},tab:'live'};UI.view='wmatch';render();
 return {tb:tb.map(x=>x.over+'.'+x.ball+':'+x.t).join(' '),rib:(document.querySelector('.ribn')||{innerText:''}).innerText.replace(/\n/g,' '),slot:(document.querySelector('.rp .lbs')||{innerText:''}).innerText.replace(/\n/g,' '),list:document.getElementById('app').innerText}});
ok(/^9\.1:0 9\.2:0 9\.3:0 9\.4:1 /.test(r.tb),'balls '+r.tb);
ok(/5b·4/.test(r.tb),'group chip '+r.tb);
ok(/wd\/nb\+1/.test(r.tb),'extra '+r.tb);
ok(/Over 9/.test(r.rib)&&/\b0\b.*\b0\b.*\b0\b/.test(r.rib),'ribbon '+r.rib);
ok(/8\.1/.test(r.list)&&/no run/.test(r.list)&&/does not say which ball/.test(r.list),'list '+r.list.slice(r.list.indexOf('Score updates')-50,r.list.indexOf('Score updates')+600));
await p.screenshot({path:'/tmp/tracked.png'});ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: tracked balls');})();
