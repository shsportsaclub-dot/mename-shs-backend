const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.apiBase=()=>'http://x';window.__c=[];
 window.fetch=async(u,o)=>{u=String(u);window.__c.push(u.replace(/^https?:\/\/[^/]+/,''));return {json:async()=>/signout-all/.test(u)?{ok:true,token:'newtok'}:/me\/close/.test(u)?{ok:true}:{ok:false}}};
 UI.stage='app';S.user={id:'u1',name:'QA',role:'viewer',phone:'9999999999'};S.tok='oldtok';S.prefs={...S.prefs,asked:1,welcomed:1};UI.view='settings';render();const o={};
 o.card=!!document.getElementById('a11y-card')&&!!document.getElementById('acct-card');
 A.a11y({k:'size',v:'2'});o.xl=document.documentElement.classList.contains('a11y-xl');
 A.a11y({k:'rm',v:'on'});o.rm=document.documentElement.classList.contains('a11y-rm');
 A.a11y({k:'hc',v:'1'});A.a11y({k:'tt',v:'1'});o.hc=document.documentElement.classList.contains('a11y-hc')&&document.documentElement.classList.contains('a11y-tt');
 o.saved=S.settings.a11y.size===2&&S.settings.a11y.rm==='on';
 await A.signoutAll();o.tok=S.tok==='newtok';
 render();document.getElementById('ac-cf').value='NOPE';await A.closeAcct();o.noclose=S.user!==null&&!window.__c.some(c=>/me\/close/.test(c));
 document.getElementById('ac-cf').value='CLOSE';document.getElementById('ac-pin').value='1234';await A.closeAcct();o.closed=window.__c.some(c=>/me\/close/.test(c))&&S.user===null;
 A.a11y({k:'size',v:'0'});A.a11y({k:'rm',v:''});A.a11y({k:'hc',v:'0'});A.a11y({k:'tt',v:'0'});return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS a11y + account');await b.close()})()
