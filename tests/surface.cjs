// Tennis: surface (hard / clay / grass / carpet) and indoor / outdoor on the court, for world matches and the local scorer.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u',name:'T',phone:'1',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const m={id:'t9',sport:'tennis',tn:['A. Rao','K. Reddy'],cfg:{best:3,final:'adv',noad:false,surf:'clay',ind:false},first:0,pts:[],date:'2026-10-28',by:'T'};
 for(let i=0;i<4;i++)m.pts.push({w:0,k:'pt',t:i});for(let i=0;i<4;i++)m.pts.push({w:1,k:'pt',t:i});
 S.sg=[m];UI.sgid='t9';UI.view='sgame';render()});
await p.waitForTimeout(300);
let t=await p.evaluate(()=>({svg:!!document.querySelector('svg[aria-label="Tennis court"]'),clay:document.querySelector('#arsvg').innerHTML.includes('#c4623a'),txt:document.getElementById('app').innerText}));
ok(t.svg&&t.clay&&/OUTDOOR/i.test(t.txt),'local scorer clay outdoor');
await p.click('[data-a="arIn"][data-v="tennis|1"]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>/INDOOR/.test(document.getElementById('arsvg').innerHTML)),'indoor toggle');
await p.click('[data-a="arSurf"][data-v="tennis|grass"]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.querySelector('#arsvg').innerHTML.includes('#4f9a3d')),'grass');
await p.click('[data-a="arSurf"][data-v="tennis|clay"]');await p.waitForTimeout(200);
await p.screenshot({path:'/tmp/clay.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: surface');})();
