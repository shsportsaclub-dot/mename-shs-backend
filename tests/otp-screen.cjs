// OTP screen: number shown, test code with autofill, boxes; unregistered numbers must register first.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user=null;S.tok='';S.users=[];S.settings.loginMode='otp';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});window.fetch=async(u,o)=>{u=String(u);const J=x=>({ok:true,status:200,json:async()=>x,text:async()=>JSON.stringify(x)});if(u.includes('/mo/start'))return J({ok:false,error:'not enabled'});if(u.includes('/otp/send')){const b=JSON.parse(o.body);window.__sent=b;return J(window.__known?{ok:true,devOtp:'123456',devCode:'123456'}:{ok:false,noAccount:true,error:'No account for this number. Please register.'})}if(u.includes('/otp/verify'))return J({ok:true,token:'tok',profile:{nick:'Hemasundar',kind:'Player',role:'viewer',age:40,loc:'Hapur',email:'a@b.c'}});return J({ok:true})};UI.view='home';render()});await p.waitForTimeout(300);
// unregistered number -> register tab
await p.evaluate(()=>{F.login({get:k=>k==='phone'?'8977141413':''})});await p.waitForTimeout(200);
ok(await p.evaluate(()=>UI.authTab)==='register'&&await p.evaluate(()=>UI.login.step)===1,'unregistered goes to Register');
// registered number -> OTP screen
await p.evaluate(()=>{window.__known=true;F.login({get:k=>k==='phone'?'8977141413':''})});await p.waitForTimeout(300);
const t=await p.evaluate(()=>document.querySelector('.otpx').innerText);
ok(/\+91 89771 41413/.test(t)&&/Player/.test(t)&&/Test mode/.test(t)&&/1-Tap Autofill/.test(t),'screen text '+t.slice(0,200));
ok(await p.evaluate(()=>document.querySelectorAll('.otpx .ob').length)===6,'6 boxes');
await p.screenshot({path:'/tmp/otp.png'});
// typing in boxes goes to hidden field
await p.fill('.otpx .ob >> nth=0','1');await p.keyboard.type('23456');
ok(await p.evaluate(()=>document.getElementById('otpv').value)==='123456','boxes -> hidden '+await p.evaluate(()=>document.getElementById('otpv').value));
// autofill logs in
await p.click('[data-a=otpFill]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>!!S.user&&S.user.nick==='Hemasundar'),'autofill logs in with server profile (new device, no local user)');
ok(await p.evaluate(()=>window.__sent.mode==='login'),'server asked in login mode');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: otp screen');})();
