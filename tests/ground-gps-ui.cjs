const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:412,height:900},permissions:['geolocation'],geolocation:{latitude:17.385,longitude:78.4867}}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.apiBase=()=>'http://x';const G=[];window.__posts=[];
 window.fetch=async(u,o)=>{u=String(u);const m=(o&&o.method)||'GET',j=x=>({json:async()=>x});
  if(/\/api\/grounds\?lat/.test(u))return j({ok:true,items:G.map(g=>Object.assign({dist:5},g))});
  if(/\/api\/grounds$/.test(u)&&m==='POST'){const b=JSON.parse(o.body);if(G.length)return j({ok:false,error:'A ground is already registered within 200 m',existing:G[0]});const g={id:'g1',name:b.name,lat:b.lat,lng:b.lng,owned:!!b.owner,matches:0};G.push(g);return j({ok:true,item:g})}
  if(/grounds\/record/.test(u)){window.__posts.push(JSON.parse(o.body));return j({ok:true})}
  return j({ok:false})};
 UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const t=(n)=>({id:'t'+n,name:'Team '+n,short:'T'+n,color:'#123',players:[]});S.teams=[t(1),t(2)];for(const tm of S.teams)for(let i=0;i<3;i++){const p={id:tm.id+'p'+i,name:tm.name+' P'+i,role:'BAT',team:tm.id,bat:'Right-hand',bowl:''};S.players.push(p);tm.players.push(p.id)}
 UI.view='home';render();A.newMatch()});
await p.waitForTimeout(300);
ok(await p.evaluate(()=>/Use my location/.test(document.body.innerText)),'GPS button in Start a match');
await p.click('button[data-a=qsGps]');await p.waitForTimeout(600);
ok(await p.evaluate(()=>/No ground is registered within 200 m/.test(document.body.innerText)),'asks to register when none near');
await p.fill('#qg-name','Sky Turf Ground');await p.click('input#qg-own');await p.click('button[data-a=qsRegG]');await p.waitForTimeout(400);
let q=await p.evaluate(()=>({v:UI.qs.venue,g:UI.qs.gid,t:document.body.innerText.includes('Google Maps')}));ok(q.v==='Sky Turf Ground'&&q.g==='g1'&&q.t,'registered + selected '+JSON.stringify(q));
// second person at same spot gets the existing ground
await p.evaluate(()=>{UI.qg=null;A.newMatch()});await p.click('button[data-a=qsGps]');await p.waitForTimeout(600);
ok(await p.evaluate(()=>/You are at a registered ground/.test(document.body.innerText)&&/Sky Turf Ground/.test(document.body.innerText)),'existing ground offered');
await p.click('button[data-a=qsPickG]');await p.waitForTimeout(200);
await p.evaluate(()=>{for(const id of ['t1p0','t1p1'])UI.qs.xi&&0;});
await p.click('button[data-a=qsStart]');await p.waitForTimeout(800);
const r=await p.evaluate(()=>({n:S.matches.length,gid:(S.venues.find(v=>v.name==='Sky Turf Ground')||{}).gid,posts:window.__posts.length}));
ok(r.n>=1&&r.gid==='g1','match started with ground linked '+JSON.stringify(r));
await p.evaluate(()=>shGroundSync());await p.waitForTimeout(300);
ok(await p.evaluate(()=>window.__posts.length>=1&&window.__posts[0].id==='g1'),'match record sent to the ground');
// Grounds screen
await p.evaluate(()=>{UI.view='gground';render()});await p.waitForTimeout(200);
await p.click('button[data-a=ggFind]');await p.waitForTimeout(600);
ok(await p.evaluate(()=>/Sky Turf Ground/.test(document.body.innerText)&&/View on Google Maps/.test(document.body.innerText)),'grounds screen lists ground with maps link');
ok(await p.evaluate(()=>/google\.com\/maps/.test(document.querySelector('a[href*="google.com/maps"]').href)),'google maps href');
ok(await p.evaluate(()=>MENU2.some(g=>g[1].some(x=>x[0]==='gground'))),'in menu');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: ground gps ui');})();
