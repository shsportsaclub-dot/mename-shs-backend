const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const calls=[];
await p.route('**/api/**',async r=>{const u=r.request().url(),m=r.request().method();calls.push(m+' '+u.replace(/^.*\/api/,'/api'));let j={ok:true,items:[]};
 if(/push\/key/.test(u))j={ok:true,key:'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'};
 if(/push\/test/.test(u))j={ok:true,sent:1};await r.fulfill({json:j})});
await p.addInitScript(()=>{let sub=null;const pm={getSubscription:async()=>sub,subscribe:async o=>{window.__appKey=o.applicationServerKey.length;sub={endpoint:'https://push.example/e1',toJSON(){return{endpoint:this.endpoint,keys:{p256dh:'x',auth:'y'}}},unsubscribe:async()=>{sub=null;return true}};return sub}};
 Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve({pushManager:pm}),register:async()=>({}),addEventListener(){}},configurable:true});window.PushManager=function(){};
 window.Notification=function(){};Notification.permission='default';Notification.requestPermission=async()=>{Notification.permission='granted';return'granted'}});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Org',role:'viewer'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';UI.view='settings';render();const o={},w=ms=>new Promise(r=>setTimeout(r,ms));
 o.card=!!document.getElementById('wp-card')&&/Turn on notifications/.test(document.getElementById('wp-card').innerText);
 await A.wpOn();await w(100);o.on=/On/.test(document.querySelector('#wp-card h3').innerText)&&/Send a test/.test(document.getElementById('wp-card').innerText);o.key=window.__appKey===65;
 S.fol={teams:['tA','tB'],tours:[]};await window.shFollowSync();await w(50);await A.wpTest();await w(50);o.test=/Test sent/.test(document.getElementById('wp-card').innerText);
 await A.wpOff();await w(50);o.off=/Turn on notifications/.test(document.getElementById('wp-card').innerText);o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);
ok(calls.some(c=>/POST .*push\/follow/.test(c)),'follow sync');ok(calls.some(c=>/POST .*push\/follow/.test(c)),'follow sync');ok(calls.some(c=>/POST .*push\/subscribe/.test(c))&&calls.some(c=>/POST .*push\/unsubscribe/.test(c)),'api calls '+calls);
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS web push ui');await b.close()})()
