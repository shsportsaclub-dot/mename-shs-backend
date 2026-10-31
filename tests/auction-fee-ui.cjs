const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const posts=[];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();let j={ok:true,items:[]};
 if(/pay\/charge/.test(u)&&m==='POST'){posts.push(JSON.parse(r.request().postData()));j={ok:true,id:'py0123456789'}}
 else if(/pay\/charge/.test(u))j={ok:true,charge:{id:'py0123456789',title:'Registration fee',amount:20000,payee:'Org',upi:'o@bank',open:true,mine:[]}};
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Org',role:'admin'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';const o={},w=ms=>new Promise(r=>setTimeout(r,ms));
 const a={id:'au1',name:'Premier',reg:{open:true,fee:200,from:'',to:'',cats:[{n:'A',base:500}]},players:[],teams:[]};S.auc=[a];UI.rg.org=[];
 let h=rgOrgHtml(a);o.offer=/Collect the fee by UPI/.test(h)&&/Show QR code/.test(h);
 document.body.insertAdjacentHTML('beforeend','<input id="rgf-u" value="org@okbank">');await A.rgFeeOn({v:'au1'});o.saved=a.reg.feeCharge==='py0123456789';
 h=rgOrgHtml(a);o.on=/Fee by UPI is on/.test(h)&&/Review payments/.test(h);
 // config form must keep the charge
 const fd=new FormData();fd.set('aid','au1');fd.set('open','on');fd.set('fee','200');fd.set('cats','A:500');await F.rgConfig(fd);o.kept=a.reg.feeCharge==='py0123456789';
 UI.rg.info=Object.assign({},a);UI.rg.reg=null;UI.view='aucreg';S.user={name:'Pl',role:'viewer'};render();o.pay=/Pay fee by UPI/.test(document.body.innerText);
 UI.rg.reg={id:'RG-1',pid:'SH-1',status:'PAYMENT_PENDING',paid:false,fee:200,form:{}};render();o.pay2=/Pay fee by UPI/.test(document.body.innerText)&&/I have paid, refresh/.test(document.body.innerText);
 UI.rg.reg.paid=true;render();o.paidHides=!/Pay fee by UPI/.test(document.body.innerText);
 A.rgQr({v:'au1'});await w(150);o.qr=!!document.querySelector('#rgQrBox canvas');o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);
ok(posts.length===1&&posts[0].amount===20000&&posts[0].kind==='aucreg'&&posts[0].ref==='au1','charge '+JSON.stringify(posts));
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS auction fee ui');await b.close()})()
