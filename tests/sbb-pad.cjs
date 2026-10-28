// Scorer pad: admin/scorer sees it on a live world match, balls POST to /api/wbb and show as real ball-by-ball; viewers do not see the pad.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const setup=role=>p.evaluate(role=>{window.pullLive=async()=>{};window.__posts=[];const store=[];
 window.apiBase=()=>'http://x';
 window.fetch=(u,o)=>{if(!/\/api\/wbb\//.test(u))return new Promise(()=>{});
  if(o&&o.method==='POST'){const b=JSON.parse(o.body);if(b.undo)store.pop();else store.push({n:store.length+1,...b,at:Date.now()});window.__posts.push(b)}
  return Promise.resolve({json:async()=>({ok:true,balls:store.slice(),n:store.length})})};
 UI.stage='app';S.tok='t';S.user={id:'u1',name:'T',phone:'9999999999',role};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const bt=(id,n,r,bb)=>({batsman:{id,name:n},r,b:bb,'4s':1,'6s':0,sr:100,'dismissal-text':'batting'});
 UI.wm={m:{id:'t1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:36,w:1,o:13.3}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[bt('p1','Shadman Islam',12,34)],bowling:[{bowler:{id:'p3',name:'Justin Greaves'},o:1,m:0,r:4,w:0}]}]},bb:{},tab:'live'};UI.view='wmatch';render()},role);
await setup('viewer');await p.waitForTimeout(200);
ok(await p.evaluate(()=>!document.querySelector('.sbbpad')),'viewer sees no pad');
await setup('scorer');await p.waitForTimeout(200);
ok(await p.evaluate(()=>!!document.querySelector('.sbbpad')),'scorer sees pad');
ok(await p.evaluate(()=>/over 13\.4/.test(document.querySelector('.sbbpad').innerText)),'next ball is 13.4');
await p.click('.sbbpad [data-v="4"]');await p.waitForTimeout(200);
await p.click('.sbbpad [data-v="wd"]');await p.waitForTimeout(200);
await p.click('.sbbpad [data-v="W"]');await p.waitForTimeout(200);
const r=await p.evaluate(()=>({posts:window.__posts,n:shAvailableBalls(UI.wm).length,next:shSbbNext(UI.wm)}));
ok(r.posts.length===3&&r.posts[0].over===14&&r.posts[0].ball===4&&r.posts[0].runs===4,'first post '+JSON.stringify(r.posts[0]));
ok(r.posts[1].kind==='wd'&&r.posts[1].ball===5,'wide keeps ball number '+JSON.stringify(r.posts[1]));
ok(r.posts[2].wicket&&r.posts[2].ball===5&&r.posts[2].out==='Shadman Islam','wicket '+JSON.stringify(r.posts[2]));
ok(r.n===3,'3 balls available '+r.n);ok(r.next.over===14&&r.next.ball===6,'next 14.6 '+JSON.stringify(r.next));
await p.click('.sbbpad [data-v="undo"]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>shAvailableBalls(UI.wm).length)===2,'undo removes one');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: scorer pad');})();
// practice match
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};const store=[];window.apiBase=()=>'http://x';
 window.fetch=(u,o)=>{if(!/\/api\/wbb\//.test(u))return new Promise(()=>{});if(o&&o.method==='POST'){const b=JSON.parse(o.body);if(b.undo)store.pop();else store.push({n:store.length+1,...b,at:Date.now()})}return Promise.resolve({json:async()=>({ok:true,balls:store.slice()})})};
 UI.stage='app';S.tok='t';S.user={id:'u1',name:'T',phone:'9999999999',role:'scorer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='matches';render()});
await p.waitForTimeout(200);
ok(await p.evaluate(()=>!!document.querySelector('[data-a=sbbPractice]')),'practice button for scorer');
await p.click('[data-a=sbbPractice]');await p.waitForTimeout(300);
for(const v of ['1','4','W','1','1','1','1'])await p.click('.sbbpad [data-v="'+v+'"]'),await p.waitForTimeout(120);
const r=await p.evaluate(()=>({sc:UI.wm.m.score[0],n:shAvailableBalls(UI.wm).length,txt:document.body.innerText}));
ok(r.sc.r===9&&r.sc.w===1&&r.sc.o===1.1,'practice score '+JSON.stringify(r.sc));ok(r.n===7,'7 balls');ok(/PRACTICE MATCH/.test(r.txt),'labelled practice');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: practice match');})();
// role sync
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.pullLive=async()=>{};window.apiBase=()=>'http://x';window.fetch=()=>Promise.resolve({json:async()=>({ok:true,profile:{role:'admin'}})});UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'viewer'};await shSyncRole();return S.user.role});
if(r!=='admin'||errs.length){console.log('FAIL role sync',r,errs.join(';'));process.exitCode=1}else console.log('PASS: role sync');await b.close()})();
