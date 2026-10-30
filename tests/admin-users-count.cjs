// Admin-only total users pill in the header.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:430,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=async(u)=>String(u).includes('users-count')?{ok:true,status:200,json:async()=>({ok:true,total:37,today:3,live:5})}:String(u).includes('/viewers')?{ok:true,status:200,json:async()=>({ok:true,v:{x1:12}})}:{ok:false,status:500,json:async()=>({ok:false}),text:async()=>''}});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.settings.apiUrl='http://x';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={name:'A',nick:'A',phone:'9999999999',role:'admin',kind:'Fan'};S.tok='t';UI.stage='app';UI.view='home';render();return shUsersPull()});
await p.waitForTimeout(500);
ok(await p.evaluate(()=>/37/.test((document.querySelector('.ucnt')||{}).innerText||'')&&/5/.test((document.querySelector('.ucnt')||{}).innerText||'')),'admin sees total users and live viewers');
await p.screenshot({path:'/tmp/ucnt.png'});
await p.evaluate(()=>{S.user.role='viewer';render()});
ok(await p.evaluate(()=>!document.querySelector('.ucnt')),'non-admin does not see it');
await p.evaluate(async()=>{S.user.role='viewer';UI.wm={m:{id:'x1',name:'IND v PAK',started:true,ended:false,type:'t20',teams:[{name:'India',short:'IND'},{name:'Pakistan',short:'PAK'}],score:[]},mi:{},sc:{scorecard:[]},bb:{bbb:[]},tab:'live'};UI.view='wmatch';await mwPull();render()});
await p.waitForTimeout(300);
ok(await p.evaluate(()=>/12/.test((document.querySelector('.wvw')||{}).innerText||'')),'everyone sees how many are watching a live match');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: admin users count');})();
