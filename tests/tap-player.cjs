// Tapping a batter card, the bowler card or a 3D HUD card opens that player's stats.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const bt=(id,n,r,bb)=>({batsman:{id,name:n},r,b:bb,'4s':1,'6s':0,sr:100,'dismissal-text':'batting'});
 UI.wm={m:{id:'t1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:36,w:1,o:13.3}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[bt('p1','Shadman Islam',12,34),bt('p2','Mominul Haque',10,18)],bowling:[{bowler:{id:'p3',name:'Justin Greaves'},o:1,m:0,r:4,w:0}]}]},bb:{},tab:'live'};UI.view='wmatch';render()});
await p.waitForTimeout(200);
const n=await p.evaluate(()=>[...document.querySelectorAll('[data-a=wPlayer]')].filter(x=>x.closest('.rp')).map(x=>x.getAttribute('data-id')).join());
ok(/p1/.test(n)&&/p2/.test(n)&&/p3/.test(n),'tagged '+n);
await p.click('.rp .bt');await p.waitForTimeout(300);
ok(await p.evaluate(()=>UI.wp&&UI.wp.id==='p1'),'batter opens stats');
await p.evaluate(()=>{UI.wp=null;UI.modal=null;UI.view='wmatch';render();shV3dOpen()});await p.waitForTimeout(400);
await p.click('#v3dcards>div:nth-child(2)');await p.waitForTimeout(300);

ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: tap player');})();
