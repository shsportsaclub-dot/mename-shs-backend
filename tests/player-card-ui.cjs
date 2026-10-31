const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),errs=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
const puts=[];
const mk=async(url,setup)=>{const ctx=await b.newContext({viewport:{width:390,height:800}}),p=await ctx.newPage();p.on('pageerror',e=>{if(!/writeText/.test(e.message))errs.push(e.message)});
 await p.route('**/api/shared/players/**',async r=>{if(r.request().method()==='PUT'){puts.push(r.request().postData());return r.fulfill({json:{ok:true}})}
  return r.fulfill({json:{ok:true,item:{data:{c:{id:'pl1',name:'Ravi',role:'BAT',team:'Lions',city:'Hyd',shid:'SH-AB12CD34',m:5,r:120,w:2,hs:61,f50:1,f100:0}}}}})});
 await p.addInitScript(setup);await p.goto(url);await p.waitForTimeout(1800);return p};
const file='file://'+require('path').resolve(__dirname,'../app-index.html');
// 1) share publishes
let p=await mk(file,()=>{});
let r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Ravi',role:'viewer',pid:'p0'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1,shid:'SH-AB12CD34'};window.apiBase=()=>'http://x';
 S.players=[{id:'p0',name:'Ravi',role:'BAT'}];S.teams=[];A.ppShare({id:'p0'});await new Promise(r=>setTimeout(r,500));return true});
ok(puts.length===1&&/"name":"Ravi"/.test(puts[0])&&!/phone|dob/.test(puts[0]),'published card');
// 2) stranger opens link for unknown player
p=await mk(file+'?player=pl1',()=>{window.__pre=1});
r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Viewer',role:'viewer'};S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';S.players=[];render();await new Promise(r=>setTimeout(r,1800));const t=document.body.innerText;return {card:/Ravi/.test(t)&&/120/.test(t)&&/Lions/.test(t),fit:document.documentElement.scrollWidth<=innerWidth,view:UI.view}});
console.log(JSON.stringify(r));ok(r.card,'card shown');ok(r.fit,'fit');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS player card ui');await b.close()})()
