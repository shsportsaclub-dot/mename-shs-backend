const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:390,height:900},permissions:['geolocation'],geolocation:{latitude:17.385,longitude:78.4867}}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.apiBase=()=>'http://x';const g={id:'g1',name:'Sky Ground',lat:17.385,lng:78.4867,owned:false,matches:0,photos:1,rating:4,reviews:1,dist:3};const ph=[{id:'a',img:'data:image/gif;base64,R0lGODlhAQABAAAAACw=',by:'Fan',mine:false}];window.__rv=[];
 window.fetch=async(u,o)=>{u=String(u);const m=(o&&o.method)||'GET',j=x=>({json:async()=>x});
  if(/\/api\/grounds\?lat/.test(u))return j({ok:true,items:[g]});
  if(/grounds\/detail/.test(u))return j({ok:true,item:g,photos:ph,reviews:[{stars:4,text:'Nice nets',by:'Fan'}]});
  if(/grounds\/review/.test(u)){window.__rv.push(JSON.parse(o.body));return j({ok:true})}
  return j({ok:false})};
 UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='gground';render()});
await p.click('button[data-a=ggFind]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>/add at least 2 photos/.test(document.body.innerText)&&/4 \(1 review\)/.test(document.body.innerText)),'summary shows rating and photo nudge');
await p.click('button[data-a=gdOpen]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>!!document.querySelector('.gd-p img')&&/Nice nets/.test(document.body.innerText)&&!!document.querySelector('.gd-add')),'photos, review, add button');
await p.click('button[data-a=gdStar][data-v="5"]');await p.click('button[data-a=gdRate]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>window.__rv.length===1&&window.__rv[0].stars===5),'rating posted');
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS ground photos/ratings UI');await b.close()})()
