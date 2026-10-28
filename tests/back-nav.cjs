// Phone Back button steps back through screens and match tabs; the virtual match overlay closes on Back.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage({viewport:{width:430,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1};UI.view='home';render();
 window.__wm={m:{id:'nb1',name:'NZ A v IND A',started:true,ended:false,type:'test',teams:[{name:'New Zealand A',short:'NZ A'},{name:'India A',short:'IND A'}],score:[{inning:'New Zealand A Inning 1',r:96,w:4,o:25.4}],status:'Live'},mi:null,sc:null,bb:null,tab:'live'}});
const st=()=>p.evaluate(()=>[UI.view,UI.wm&&UI.wm.tab].join('|'));
await p.waitForTimeout(450);await p.evaluate(()=>{UI.wm=window.__wm;UI.view='wmatch';render()});
await p.waitForTimeout(450);await p.evaluate(()=>{UI.wm.tab='sc';render()});
await p.waitForTimeout(450);await p.evaluate(()=>{UI.wm.tab='sq';render()});
ok(await st()==='wmatch|sq','at squads');
await p.goBack();await p.waitForTimeout(150);ok(await st()==='wmatch|sc','back to scorecard: '+await st());
await p.goBack();await p.waitForTimeout(150);ok(await st()==='wmatch|live','back to live: '+await st());
await p.goBack();await p.waitForTimeout(150);ok(await st()==='home|undefined'||(await st()).startsWith('home'),'back to home: '+await st());
await p.goForward();await p.waitForTimeout(150);ok((await st()).startsWith('wmatch'),'forward to match');
// virtual match overlay closes on back
await p.waitForTimeout(450);await p.evaluate(()=>{UI.wm.tab='live';render();shV3dOpen()});
ok(await p.evaluate(()=>!!document.getElementById('v3d')),'overlay open');
await p.goBack();await p.waitForTimeout(200);
ok(await p.evaluate(()=>!document.getElementById('v3d')&&UI.view==='wmatch'),'overlay closed, still in match');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: back navigation');})();
