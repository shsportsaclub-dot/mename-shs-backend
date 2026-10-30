// Nicknames may contain spaces (no HTML pattern block).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.prefs=S.prefs||{};S.prefs.welcomed=1;S.user=null;save()});await p.reload();await p.waitForTimeout(600);await p.mouse.click(200,300);await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{A.authTab({v:'register'});const i=document.querySelector('form[data-f=register] input[name=nick]');if(!i)return {missing:1};i.value='Rohit Sharma';return {pattern:i.getAttribute('pattern'),valid:i.checkValidity()}});
if(r.missing||r.pattern||!r.valid){console.log('FAIL',JSON.stringify(r));process.exitCode=1}
if(errs.length){console.log('FAIL',errs.join(';'));process.exitCode=1}
await b.close();if(!process.exitCode)console.log('PASS: nickname with spaces');})();
