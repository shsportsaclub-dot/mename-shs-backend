// Virtual match: the provider's default badge (CRICKET DATA logo) is never shown as a player photo; initials are shown. A real photo still shows.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const PX='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const run=async(img1,img2)=>{await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);await p.evaluate(([i1,i2])=>{const f=document.getElementById('v3d');if(f&&window.__v3dClose)window.__v3dClose();window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const bbb=[[0,0],[1,0]].map(([r],i)=>({inning:1,over:3,ball:i+1,runs:r,bruns:r,batRuns:r,wicket:false,batsman:'Jayden Lennox',bowler:'Manav Suthar'}));
 UI.wm={m:{id:'v1',name:'NZA v INA',started:true,ended:false,type:'test',teams:[{name:'NZ A',short:'NZA'},{name:'India A',short:'INA'}],score:[{inning:'NZ A Inning 1',r:36,w:1,o:3.4}],status:'Live'},mi:{},sc:{scorecard:[{inning:'NZ A Inning 1',batting:[{batsman:{name:'Jayden Lennox',playerImg:i1},r:17,b:52,'dismissal-text':'batting'}],bowling:[{bowler:{name:'Manav Suthar',playerImg:i2},o:15,r:56,w:0}]}]},bb:{bbb},tab:'live'};UI.view='wmatch';render();window.shV3dOpen()},[img1,img2]);await p.waitForTimeout(1200);return p.evaluate(()=>{const c=document.getElementById('v3dcards');if(!c)return{imgs:-1,txt:'no cards'};return{imgs:c.querySelectorAll('img').length,txt:c.innerText.replace(/\s+/g,' ')}})};
let r=await run('https://h.cricapi.com/img/icon512.png','https://h.cricapi.com/img/icon512.png');
ok(r.imgs===0&&/JL/.test(r.txt)&&/MS/.test(r.txt),'placeholder replaced by initials '+JSON.stringify(r));
r=await run(PX,'https://h.cricapi.com/img/icon512.png');
ok(r.imgs===1,'real photo still shown '+JSON.stringify(r));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: v3d placeholder photos');})();
