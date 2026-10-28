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
