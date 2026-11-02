// Every score bar style renders from a match without errors and fills the overlay.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];const p=await b.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(500);
for(const [id] of await p.evaluate(()=>window.SH_BUGS)){
 const info=await p.evaluate(id=>{const m=demoMatch();S.matches=[m];S.stream.mid=m.id;S.stream.bug=id;document.body.classList.add('ovpage');document.documentElement.style.background='#243b2a';document.body.style.background='#243b2a';const R=document.getElementById('app');R.innerHTML=overlayHTML();R.style.maxWidth='none';R.style.padding='0';return{len:R.innerHTML.length,has:R.querySelector(id==='classic'?'.ovbug':'.bgx-'+id)!=null}},id);
 assert(info.has,'style '+id+' rendered');await p.waitForTimeout(150);await p.screenshot({path:'/tmp/bug-'+id+'.png'});}
assert.deepEqual(errs,[]);console.log('PASS bug styles');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
