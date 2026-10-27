const {chromium}=require('playwright');const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{const html=fs.readFileSync('app-index.html'),sv=http.createServer((q,r)=>{r.setHeader('content-type','text/html');r.end(html)});await new Promise(r=>sv.listen(18987,'127.0.0.1',r));
const b=await chromium.launch();
const D=[['android',412,860,'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36','','phone','android'],['iphone',390,844,'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1','','phone','ios'],['ipad',820,1180,'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1','','tablet','ios'],['windows',1366,768,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36','','desktop','windows'],['mac',1440,900,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15','','desktop','mac'],['tv',1920,1080,'Mozilla/5.0 (Linux; Android 11; BRAVIA 4K) Chrome/110 Safari/537.36','?tv=1','tv','android']];
try{for(const [n,w,h,ua,q,plat,os] of D){const c=await b.newContext({viewport:{width:w,height:h},userAgent:ua}),p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:18987/')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('http://127.0.0.1:18987/'+q);
await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'scorer',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'Home XI',short:'HOME',color:'#2563eb',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',color:'#dc2626',players:S.players.slice(11).map(p=>p.id)}];
S.matches=[];newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});UI.sid=null;UI.mid=null;UI.view='score';render()});
await p.locator('form[data-f="startInn"]').getByRole('button',{name:'Start innings',exact:true}).click();
const d=await p.evaluate(()=>[document.documentElement.dataset.plat,document.documentElement.dataset.os]);assert.deepEqual(d,[plat,os],n);
const cols=await p.evaluate(()=>getComputedStyle(document.querySelector('.sh-scorer-console')).gridTemplateColumns.split(' ').length);
assert.equal(cols,plat==='phone'?1:2,n+' scorer columns');
const nav=await p.evaluate(()=>{const e=document.querySelector('.bnav');return !!e&&getComputedStyle(e).display!=='none'});assert.equal(nav,plat==='phone'||plat==='tablet',n+' bottom nav');
if(plat==='desktop'){await p.keyboard.press('4');await p.keyboard.press('1');await p.keyboard.press('w');assert.equal(await p.locator('form[data-f="wicket"]').count(),1,'W opens wicket');await p.keyboard.press('Escape');await p.evaluate(()=>{UI.modal=null;renderModal()});await p.keyboard.press('u');
 assert.equal(await p.evaluate(()=>calc(S.matches[0],0).runs),4,'keys 4,1 then undo = 4')}
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,n+' no horizontal scroll');assert.deepEqual(errs,[]);await c.close()}
console.log('PASS device layouts: Android, iPhone, iPad, Windows, Mac, TV')}finally{await b.close();sv.close()}})().catch(e=>{console.error(e);process.exit(1)});
