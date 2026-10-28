const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.stack.split('\n').slice(0,3).join(' | ')));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.pullLive=async()=>{};window.apiBase=()=>'http://x';const calls=[];window.fetch=(u,o)=>{calls.push((o&&o.method||'GET')+' '+u+' '+(o&&o.body||''));return Promise.resolve({json:async()=>/scorers/.test(u)?{ok:true,scorers:[{id:'a@b.c',nick:'Ann',role:'scorer',fixed:false}],invited:['n@x.com']}:{ok:true}})};
 UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'admin'};UI.view='svc';render();await new Promise(r=>setTimeout(r,300));
 const t=document.body.innerText;UI.scl={ok:true,scorers:[{id:'a@b.c',nick:'Ann',role:'scorer',fixed:false}],invited:['n@x.com']};UI.svc={loading:1};let h='';try{h=XV.svc()}catch(e){}window.__h=h;document.getElementById('sc-in').value='x@y.com';A.scAdd();await new Promise(r=>setTimeout(r,200));
 return {rows:/Ann/.test(window.__h||'')&&/n@x\.com/.test(window.__h||''),card:/Scorers \(who can score/.test(t),post:calls.some(c=>/^POST .*admin\/scorers .*x@y\.com/.test(c))}});
if(!r.card||!r.rows||!r.post){console.log('FAIL',JSON.stringify(r),errs.join(';'));process.exitCode=1}else console.log('PASS: scorer admin ui');await b.close()})();
