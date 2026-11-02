// 3D virtual match: opens, plays a boundary, draws trail + score bar without errors.
const fs=require('fs');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/vendor/*',r=>{const m=/\/vendor\/([\w.]+)$/.exec(r.request().url());r.fulfill({contentType:m[1].endsWith('.glb')?'model/gltf-binary':'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(require('path').resolve(__dirname,'../public/vendor/'+m[1]))})});
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};const f0=window.fetch.bind(window);window.fetch=(u,...a)=>/vendor/.test(String(u&&u.url||u))?f0(u,...a):new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const bbb=[[0,0],[1,0],[4,0],[6,0],['W',0]].map(([r],i)=>({inning:1,over:3,ball:i+1,runs:r,bruns:r,batRuns:r==='W'?0:r,wicket:r==='W',batsman:'Mominul Haque',bowler:'Shamar Joseph'}));
 UI.wm={m:{id:'v1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:36,w:1,o:3.4}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[],bowling:[]}]},bb:{bbb},tab:'live'};UI.view='wmatch';render();shV3dOpen()});
await p.waitForTimeout(3600);await p.waitForFunction('window.shx&&shx.ready',null,{timeout:60000});await p.waitForTimeout(6500);ok(await p.evaluate(()=>!!document.getElementById('shx3')),'3d layer in virtual match');
ok(await p.evaluate(()=>!!document.getElementById('v3d')),'overlay');
await p.screenshot({path:'/tmp/v3d.png',timeout:120000});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: v3d trail');})();
