// Match desk: scorer-entered batters/bowler fill in while the provider has none, and provider data takes over automatically.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const show=(o)=>p.evaluate(o=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});window.shRefreshWorldDetails=async()=>{};window.apiBase=()=>'http://x';UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:o.role};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'a1',name:'India v New Zealand',started:true,ended:false,type:'T20',teams:[{name:'India',short:'IND'},{name:'New Zealand',short:'NZ'}],score:o.score,status:'Live'},mi:{},sc:{scorecard:o.sc},bb:{bbb:[]},tab:'live',desk:o.desk};UI.view='wmatch';render()},o).then(async()=>{await p.waitForTimeout(350);return p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '))});
const bt=(n,t,r,b)=>({batsman:{id:n,name:n},'dismissal-text':t,r,b,'4s':1,'6s':0});
const nz={inning:'New Zealand Inning 1',batting:[bt('Conway','not out',60,40)],bowling:[]};
const S1=[{inning:'New Zealand Inning 1',r:150,w:4,o:20},{inning:'India Inning 1',r:60,w:1,o:6.2}];
const desk={id:'a1',t:Date.now(),by:'Hemu',inn:2,w:1,runs:60,s:{n:'Abhishek Sharma',r:31,b:14},n:{n:'Sanju Samson',r:20,b:12},bw:{n:'Matt Henry',o:'2',m:0,r:20,w:1}};
// A: provider has no India innings yet, desk valid -> viewer sees the desk batters, no form
let t=await show({role:'viewer',score:S1,sc:[nz],desk});ok(/Abhishek Sharma/.test(t)&&/Sanju Samson/.test(t)&&/Matt Henry/.test(t),'desk players shown '+t.slice(200,500));ok(!/Conway\s+60/.test(t)&&!/At the crease[^|]*Conway/.test(t),'old innings batters hidden');ok(!/Scorer desk/.test(t),'viewer has no form');
// B
t=await show({role:'scorer',score:S1,sc:[nz],desk});ok(/Scorer desk/.test(t),'scorer form');
// C: provider has the crease -> provider wins, form hidden
t=await show({role:'scorer',score:S1,sc:[nz,{inning:'India Inning 1',batting:[bt('Ishan Kishan','batting',9,6),bt('Rinku','batting',2,3)],bowling:[{bowler:{id:'x',name:'Ben Sears'},o:1,m:0,r:8,w:0}]}],desk});
ok(/Ishan Kishan/.test(t)&&!/Abhishek Sharma/.test(t)&&!/Scorer desk/.test(t),'provider data takes over '+t.slice(200,420));
// D: a wicket fell after the desk entry -> not shown, scorer asked to update
const S2=[S1[0],{inning:'India Inning 1',r:70,w:2,o:7.1}];t=await show({role:'scorer',score:S2,sc:[nz],desk});ok(!/Abhishek Sharma\s+\d/.test(t.replace(/Scorer desk[\s\S]*$/,''))&&/a wicket fell/.test(t),'stale desk flagged');
// E: old desk from another innings is ignored
t=await show({role:'viewer',score:[S1[0]],sc:[nz],desk});ok(!/Abhishek Sharma/.test(t),'other innings ignored');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: match desk');})();
