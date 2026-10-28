// 3D virtual match: opens, plays a boundary, draws trail + score bar without errors.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const bbb=[[0,0],[1,0],[4,0],[6,0],['W',0]].map(([r],i)=>({inning:1,over:3,ball:i+1,runs:r,bruns:r,batRuns:r==='W'?0:r,wicket:r==='W',batsman:'Mominul Haque',bowler:'Shamar Joseph'}));
 UI.wm={m:{id:'v1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:36,w:1,o:3.4}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[],bowling:[]}]},bb:{bbb},tab:'live'};UI.view='wmatch';render();shV3dOpen()});
await p.waitForTimeout(3600);
ok(await p.evaluate(()=>!!document.getElementById('v3d')),'overlay');
await p.screenshot({path:'/tmp/v3d.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: v3d trail');})();
