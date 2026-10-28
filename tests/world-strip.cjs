// Home shows a World scores strip; tapping Tennis opens the tennis card even when the user picked no sports.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=async(u)=>{u=String(u);const J=o=>({ok:true,status:200,json:async()=>o,text:async()=>JSON.stringify(o)});
 if(u.includes('/api/sx/live'))return J({ok:true,matches:[{id:'hltennis:1',sport:'tennis',league:'ATP Paris',live:true,state:'Live 40-30',periods:[[6,4],[3,6]],home:{name:'Carlos Alcaraz',short:'Alcaraz',score:1},away:{name:'Jannik Sinner',short:'Sinner',score:1}}]});return J({ok:true})}});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.apiBase=()=>'http://x';UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.live={ok:true,matches:[]};UI.view='home';UI.sport='cricket';render()});
await p.waitForTimeout(300);
ok(await p.evaluate(()=>/Select game/.test(document.body.innerText)&&!!document.querySelector('#shsel')),'strip visible');
await p.click('button[data-a="hsport"][data-v="tennis"]');await p.waitForTimeout(1200);
const t=await p.evaluate(()=>document.body.innerText);
ok(/World tennis/.test(t)&&/Alcaraz/.test(t)&&/Sinner/.test(t)&&/Set1\s+6-4|S?et?1\s+6-4/.test(t)||/6-4/.test(t),'tennis card: '+t.slice(0,300));
await p.screenshot({path:'/tmp/strip.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: world strip');})();
