const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};const follows=[];
await p.route('**/api/**',async r=>{const u=r.request().url();if(/push\/follow/.test(u))follows.push(JSON.parse(r.request().postData()));await r.fulfill({json:{ok:true,items:[]}})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Fan',role:'viewer'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';UI.wp={on:true,msg:''};const o={},w=ms=>new Promise(r=>setTimeout(r,ms));
 S.fol={teams:[],tours:[]};A.qrShare({k:'match',id:'m77'});await w(50);o.get=/Get alerts for this match/.test(document.body.innerText);
 A.alToggle({k:'matches',id:'m77'});await w(50);o.on=S.fol.matches.includes('m77')&&/Stop alerts/.test(document.body.innerText);
 await window.shFollowSync();await w(50);
 A.alToggle({k:'matches',id:'m77'});await w(50);o.off=!S.fol.matches.includes('m77')&&/Get alerts for this match/.test(document.body.innerText);
 A.qrShare({k:'tour',id:'t5'});await w(50);o.tour=/Get alerts for this tournament/.test(document.body.innerText);A.alToggle({k:'tours',id:'t5'});await w(50);o.tourOn=S.fol.tours.includes('t5');
 A.qrShare({k:'ground',id:'g1'});await w(50);o.ground=!/Get alerts/.test(document.body.innerText);return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);
ok(follows.some(f=>f.matches&&f.matches.includes('m77')),'follow sync carries the match '+JSON.stringify(follows));
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS alert toggle ui');await b.close()})()
