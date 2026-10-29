// Dragging the screen down at the top refreshes live data without reloading the page; not active on the scoring screen.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:412,height:880},hasTouch:true,isMobile:true}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=async()=>({ok:true,status:200,json:async()=>({ok:true,matches:[],items:[]}),text:async()=>''})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.__n=0;window.pullLive=async()=>{window.__n++};window.apiBase=()=>'http://x';window.__marker=1;UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.live={ok:true,matches:[]};UI.view='home';render()});
const drag=(y1,y2,sel)=>p.evaluate(([y1,y2,sel])=>{const t=sel?document.querySelector(sel):document.body;const mk=(y)=>new Touch({identifier:1,target:t,clientX:200,clientY:y});const f=(type,y,l)=>t.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:l?[]:[mk(y)],targetTouches:l?[]:[mk(y)],changedTouches:[mk(y)]}));f('touchstart',y1);for(let y=y1;y<=y2;y+=20)f('touchmove',y);f('touchend',y2,1)},[y1,y2,sel]);
await drag(120,330,'#app');await p.waitForTimeout(500);
ok(await p.evaluate(()=>window.__n)>=1,'pull refreshed live data');ok(await p.evaluate(()=>window.__marker===1),'page was not reloaded');
await p.evaluate(()=>{window.__n=0});await drag(120,150,'#app');await p.waitForTimeout(300);ok(await p.evaluate(()=>window.__n)===0,'short drag does nothing');
await p.evaluate(()=>{window.__n=0;UI.view='score'});await drag(120,330,'#app');await p.waitForTimeout(300);ok(await p.evaluate(()=>window.__n)===0,'not active while scoring');
await p.evaluate(()=>{UI.view='home';render()});await p.evaluate(()=>{const d=document.createElement('div');d.id='hz';d.className='hscroll';d.style.cssText='overflow-x:auto;width:200px;height:40px';d.innerHTML='<div style="width:900px;height:20px">x</div>';document.getElementById('app').prepend(d)});await drag(120,330,'#hz');await p.waitForTimeout(300);ok(await p.evaluate(()=>window.__n)===0,'not active on horizontal strips');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: pull to refresh');})();
