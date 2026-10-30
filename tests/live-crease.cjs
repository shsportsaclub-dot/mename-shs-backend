// Live tab: batters/bowler appear first, even when the provider marks the crease loosely; never show the previous innings' batters.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const show=(sc,score)=>p.evaluate(([sc,score])=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});window.shRefreshWorldDetails=async()=>{};UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'a1',name:'India v New Zealand',started:true,ended:false,type:'T20',teams:[{name:'India',short:'IND'},{name:'New Zealand',short:'NZ'}],score,status:'Live'},mi:{},sc:{scorecard:sc},bb:{bbb:[]},tab:'live'};UI.view='wmatch';render();
 return 1},[sc,score]).then(async()=>{await p.waitForTimeout(350);return p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '))});
const bt=(n,t,r,b)=>({batsman:{id:n,name:n},'dismissal-text':t,r,b,'4s':1,'6s':0});
const bw=[{bowler:{id:'h',name:'Matt Henry'},o:2,m:0,r:20,w:1,eco:10}];
const nz={inning:'New Zealand Inning 1',batting:[bt('Conway','not out',60,40),bt('Mitchell','not out',30,20)],bowling:[]};
const S1=[{inning:'New Zealand Inning 1',r:150,w:4,o:20},{inning:'India Inning 1',r:60,w:1,o:6.2}];
// 1 provider leaves the dismissal blank for current batters
let t=await show([nz,{inning:'India Inning 1',batting:[bt('Abhishek','',31,14),bt('Samson','',20,12),bt('Ishan','c x b y',5,4)],bowling:bw}],S1);
ok(/Abhishek/.test(t)&&/Samson/.test(t)&&!/Ishan\s+STRIKE/.test(t),'blank dismissal still shows the two batters '+t.slice(0,400));ok(/Matt Henry/.test(t),'bowler shown');
// 2 loose mark like "batting*"
t=await show([nz,{inning:'India Inning 1',batting:[bt('Abhishek','batting*',31,14),bt('Samson','Batting',20,12)],bowling:bw}],S1);ok(/Abhishek/.test(t)&&/Samson/.test(t),'batting* shown');
// 3 scorecard lags: only NZ innings present while India are batting -> no Conway/Mitchell, waiting note instead
t=await show([nz],S1);ok(!/Conway|Mitchell/.test(t),'old innings batters hidden '+t.slice(0,300));ok(/as soon as the data provider/.test(t),'waiting note shown');
// 4 batters come before the timeline
t=await show([nz,{inning:'India Inning 1',batting:[bt('Abhishek','batting',31,14),bt('Samson','batting',20,12)],bowling:bw}],S1);ok(t.indexOf('Abhishek')>0&&t.indexOf('Abhishek')<(t.indexOf('Match timeline')<0?1e9:t.indexOf('Match timeline')),'batters above the timeline');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: live crease');})();
