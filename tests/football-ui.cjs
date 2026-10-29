// World football in the app: list on the Football home, match page with timeline, line-ups with photos, stats.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{
 const list=[{id:'fb5',name:'A vs B',league:'Premier League',country:'England',startsAt:new Date().toISOString(),state:'2H',live:true,ended:false,started:true,minute:67,home:{id:1,name:'Home FC',short:'HOM',img:'',goals:2},away:{id:2,name:'Away FC',short:'AWY',img:'',goals:1}}];
 const match=Object.assign({},list[0],{venue:'Home Park',events:[{id:1,minute:12,kind:'goal',teamId:1,player:'A Forward',result:'1-0'},{id:2,minute:60,kind:'yellow',teamId:2,player:'C Mid'},{id:3,minute:70,kind:'sub',teamId:1,player:'New',related:'Old'}],lineups:{1:{starters:[{id:9,name:'A Forward',number:9,img:''}],bench:[{id:20,name:'Sub One',number:20,img:''}]}},stats:[{name:'Corners',home:4,away:2}]});
 window.fetch=(u)=>{u=String(u);if(/\/api\/fb\/live/.test(u))return Promise.resolve({json:async()=>({ok:true,matches:list})});if(/\/api\/fb\/match/.test(u))return Promise.resolve({json:async()=>({ok:true,match})});return new Promise(()=>{})};
 window.pullLive=async()=>{};UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});S.settings.apiUrl='https://api.test';S.prefs.sports=['cricket','football'];(shGet('football')||{}).on=true;UI.sport='cricket';UI.view='home';render()});
await p.evaluate(()=>A.sgPick({v:'football'}));await p.waitForTimeout(800);
ok(await p.evaluate(()=>/World football/.test(document.getElementById('app').innerText)&&/Premier League/.test(document.getElementById('app').innerText)&&document.querySelectorAll('.fbc').length===1&&/2\s+[\s\S]*1/.test(document.querySelector('.fbc').innerText)&&/67'/.test(document.querySelector('.fbc').innerText)),'list card');
await p.click('.fbc');await p.waitForTimeout(500);
let t=await p.evaluate(()=>document.getElementById('app').innerText);
ok(/HOM/.test(t)&&/A Forward/.test(t)&&/Yellow card/.test(t)&&/for Old/.test(t)&&/1-0/.test(t),'timeline '+t.slice(0,300));
await p.click('[data-a=fbTab][data-v=rc]');await p.waitForTimeout(200);t=await p.evaluate(()=>document.getElementById('app').innerText);ok(/Home FC 2 - 1 Away FC/.test(t)&&/Goals: A Forward 12' for Home FC/.test(t)&&/1 yellow card/.test(t)&&/1 substitution/.test(t),'recap '+t.slice(200,500));
await p.click('[data-a=fbTab][data-v=lu]');await p.waitForTimeout(200);t=await p.evaluate(()=>document.getElementById('app').innerText);ok(/Sub One/.test(t)&&/Line-up not published/.test(t),'line-ups');
await p.click('[data-a=fbTab][data-v=st]');await p.waitForTimeout(200);t=await p.evaluate(()=>document.getElementById('app').innerText);ok(/Corners/.test(t),'stats');
await p.screenshot({path:'/tmp/fb.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: football ui');})();
