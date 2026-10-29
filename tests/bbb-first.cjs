// Matches where the provider sends ball-by-ball are listed first.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const mk=(id,bbb,s,e)=>({id,bbb,started:s,ended:e,name:id,teams:[{name:id+'A'},{name:id+'B'}],score:[],time:'2026-10-29T10:00:00Z'});
 UI.live={ok:true,matches:[mk('a',false,true,false),mk('b',true,true,false),mk('c',false,true,false),mk('d',true,true,false),mk('e',undefined,false,false),mk('f',true,false,false)]};UI.wbbb=false;
 const F=wFilter();return {live:F.live.map(m=>m.id).join(''),up:F.up.map(m=>m.id).join('')}});
ok(r.live==='bdac','live order '+r.live);ok(r.up[0]==='f','upcoming order '+r.up);
await p.evaluate(()=>{UI.wbbb=true});ok(await p.evaluate(()=>wFilter().live.map(m=>m.id).join(''))==='bd','filter still works');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: bbb first');})();
