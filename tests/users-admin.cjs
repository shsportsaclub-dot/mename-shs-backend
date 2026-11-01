// Admin "Registered users" list: header count pill opens it, details shown, non-admin blocked.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();
 if(u==='https://x.test/api/admin/users')return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,total:2,users:[{id:'919988402403',nick:'Hemanth',kind:'Player',role:'admin',phone:'+919988402403',email:'',loc:{city:'Hapur',state:'UP',country:'IN'},age:30,shid:'SH-AAAA1111',created:Date.now()-1000,closed:false},{id:'e:a@b.com',nick:'Ravi',kind:'Scorer',role:'scorer',phone:'',email:'a@b.com',loc:null,age:'',shid:'',created:Date.now()-9e8,closed:false}]})});
 return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.tok='t';S.settings.apiUrl='https://x.test';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+919988402403'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};UI.ucount={total:2,today:1,live:0};UI.view='home';render()});
await p.click('.ucnt');await p.waitForTimeout(700);
const t=await p.evaluate(()=>document.getElementById('app').innerText);
assert(/Registered users/i.test(t)&&/Hemanth/.test(t)&&/Ravi/.test(t)&&/\+919988402403/.test(t)&&/a@b\.com/.test(t)&&/Hapur/.test(t),'details '+t.slice(0,300));
await p.evaluate(()=>{UI.ru.f='scorer';render()});assert(!/Hemanth/.test(await p.evaluate(()=>document.querySelector('.ru').innerText)),'filter');
await p.evaluate(()=>{S.user.role='viewer';UI.view='users';render()});assert(/Admins only/.test(await p.evaluate(()=>document.getElementById('app').innerText)),'blocked');
await p.evaluate(()=>{S.user.role='admin';UI.ucount=null;S.settings.ucLast=null;S.tok='';UI.view='home';render()});assert(await p.$('.ucnt'),'pill always visible for admin');
await p.evaluate(()=>{S.user.role='viewer';render()});assert(!(await p.$('.ucnt')),'pill hidden for non admin');
assert.deepEqual(errs,[]);console.log('PASS users admin');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
