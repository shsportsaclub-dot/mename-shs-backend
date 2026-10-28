// Illustrated avatar: the provider photo is turned into a bold-outline portrait on the device; toggle back to the photo.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const c=document.createElement('canvas');c.width=c.height=200;const g=c.getContext('2d');g.fillStyle='#7aa';g.fillRect(0,0,200,200);g.fillStyle='#d9a47c';g.beginPath();g.ellipse(100,105,55,70,0,0,7);g.fill();g.fillStyle='#222';g.fillRect(55,50,90,22);g.fillRect(70,95,22,8);g.fillRect(110,95,22,8);g.fillRect(80,140,40,10);
 const img=c.toDataURL('image/png');window.__img=img;
 const bt=(id,n)=>({batsman:{id,name:n,playerImg:img},r:12,b:30,'4s':1,'6s':0,sr:40,'dismissal-text':'batting'});
 const bbb=[[1,0],[4,0]].map(([r],i)=>({inning:1,over:3,ball:i+1,runs:r,bruns:r,batRuns:r,batsman:'Shadman Islam',bowler:'Justin Greaves'}));
 UI.wm={m:{id:'a1',name:'BAN v WI',started:true,ended:false,type:'test',teams:[{name:'Bangladesh',short:'BAN'},{name:'West Indies',short:'WI'}],score:[{inning:'Bangladesh Inning 1',r:36,w:1,o:3.2}],status:'Live'},mi:{},sc:{scorecard:[{inning:'Bangladesh Inning 1',batting:[bt('p1','Shadman Islam'),bt('p2','Mominul Haque')],bowling:[{bowler:{id:'p3',name:'Justin Greaves',playerImg:img},o:1,m:0,r:4,w:0}]}]},bb:{bbb},tab:'live'};UI.view='wmatch';render();shV3dOpen()});
await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const im=document.querySelector('#v3dcards img');return {src:im?im.src.slice(0,30):'',same:im?im.src===window.__img:null,btn:document.getElementById('v3dtn').textContent}});
ok(/^data:image\/png/.test(r.src)&&r.same===false,'illustrated card '+JSON.stringify(r));
await p.click('#v3dtn');await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.querySelector('#v3dcards img').src===window.__img&&/Photo/.test(document.getElementById('v3dtn').textContent)),'toggle back to photo');
await p.click('#v3dtn');await p.waitForTimeout(3500);await p.screenshot({path:'/tmp/toon.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: avatar toon');})();
