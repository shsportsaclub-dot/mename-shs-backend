const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'?tour=tour-9');await p.waitForTimeout(400);
await p.evaluate(()=>{window.apiBase=()=>'http://x';window.__calls=[];const reqs=[{id:'r1',name:'Lions',short:'LIO',city:'Hyd',by:'Mgr',status:'pending',note:'We are ready'}];
 window.fetch=async(u,o)=>{u=String(u);const m=(o&&o.method)||'GET',j=x=>({json:async()=>x});window.__calls.push(m+' '+u.replace(/^https?:\/\/[^/]+/,''));
  if(/tours\/info/.test(u))return j({ok:true,tour:{id:'tour-9',name:'Summer Cup',organizer:'Org',overs:20,city:'Hyd',teams:2}});
  if(/tours\/requests/.test(u))return j({ok:true,owner:true,items:reqs});
  if(/tours\/join/.test(u))return j({ok:true,id:'r2'});
  if(/tours\/decide/.test(u)){const b=JSON.parse(o.body);reqs[0].status=b.status;return j({ok:true,item:{id:'r1',name:'Lions',short:'LIO',city:'Hyd',status:b.status}})}
  return j({ok:false})};
 UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});render()});
await p.waitForTimeout(800);
ok(await p.evaluate(()=>/Summer Cup/.test(document.body.innerText)&&!!document.getElementById('tj-n')),'join form from ?tour= link');
await p.fill('#tj-n','Lions');await p.click('button[data-a=tjSend]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>window.__calls.some(c=>/POST \/api\/tours\/join/.test(c))),'join posted');
// organiser side
await p.evaluate(()=>{const t={id:'tour-9',name:'Summer Cup',teams:[],fixtures:[],overs:20,kind:'tournament'};S.tours=[t];UI.tid='tour-9';UI.view='tour';UI.ttab='teams';UI.tf={q:''};UI.tr=null;render()});await p.waitForTimeout(300);
const has=await p.evaluate(()=>/Team requests/.test(document.body.innerText));
if(!has){const info=await p.evaluate(()=>({v:UI.view,body:document.body.innerText.slice(0,200)}));console.log(JSON.stringify(info))}
ok(has,'organiser sees Team requests (Teams tab)');
if(has){await p.waitForTimeout(500);await p.click('button[data-a=trOk]');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>S.tours[0].teams.length===1&&S.teams.some(x=>x.name==='Lions')),'approved team added to the tournament');}
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS tour requests UI');await b.close()})()
