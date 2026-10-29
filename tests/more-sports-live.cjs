// Baseball and American football join the live-feed sports (same all-sports provider route), with their own period labels.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:430,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=async(u)=>{const sp=(String(u).match(/sport=([a-z-]+)/)||[])[1]||'x';const mk=(n,a,b2)=>({id:'hl'+sp+':'+n,sport:sp,league:'Test League',country:'US',startsAt:new Date().toISOString(),live:true,ended:false,state:'In progress',periods:[[a,b2]],home:{id:'1',name:'Home '+sp,short:'HOM',img:'',score:a},away:{id:'2',name:'Away '+sp,short:'AWY',img:'',score:b2}});return {ok:true,status:200,json:async()=>({ok:true,matches:[mk(1,3,2)]}),text:async()=>'{}'}}});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
for(const sp of ['baseball','american-football']){
 await p.evaluate(sp=>{S.settings.apiUrl='http://x';UI.sportInit=1;UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.sport=sp;UI.view='home';render()},sp);
 await p.waitForTimeout(900);
 const t=await p.evaluate(()=>document.getElementById('app').innerText);
 ok(/HOM|Home/.test(t)&&/3/.test(t),sp+' lists a live match: '+t.slice(0,120));
}
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: more sports live');})();
