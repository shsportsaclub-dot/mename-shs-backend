// Player names in commentary / Overs / Heroes 11 text open that player's stats; unknown names are left alone.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const bt=(id,n,r,bb)=>({batsman:{id,name:n},r,b:bb,'4s':1,'6s':0,sr:100,'dismissal-text':'batting'});
 const m={id:'t1',name:'INDW v ZIMW',started:true,ended:false,type:'odi',teams:[{name:'Zimbabwe Women',short:'ZIMW'},{name:'India Women',short:'INDW'}],score:[{inning:'Zimbabwe Women Inning 1',r:25,w:2,o:9}],status:'Live'};
 UI.wm={m,mi:{},sc:{scorecard:[{inning:'Zimbabwe Women Inning 1',batting:[bt('p1','Modester Mupachikwa',16,22)],bowling:[{bowler:{id:'p3',name:'Kranti Gaud'},o:4,m:0,r:9,w:1}]}]},bb:{bbb:[{inning:1,over:8,ball:1,runs:1,batRuns:1,batsman:'Modester Mupachikwa',bowler:'Kranti Gaud'}]},tab:'ov'};UI.view='wmatch';render()});
await p.waitForTimeout(300);
const n=await p.evaluate(()=>[...document.querySelectorAll('.shpn')].map(x=>x.getAttribute('data-id')).join());
ok(/p1/.test(n)||/p3/.test(n),'names tagged '+n);
await p.click('.shpn');await p.waitForTimeout(300);
ok(await p.evaluate(()=>!!UI.wp&&['p1','p3'].includes(UI.wp.id)),'tap opens stats');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: tap names');})();
