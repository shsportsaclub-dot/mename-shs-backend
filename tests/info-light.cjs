// Match Info tab must be readable in the Light look (no dark cards with dark text).
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage({viewport:{width:1100,height:800}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(2500);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.settings.appTheme='mday';S.prefs={...S.prefs,asked:1,welcomed:1};
 UI.wm={m:{id:'x1',name:'Bangladesh vs Sri Lanka',started:false,ended:false,type:'t20',venue:'Mission Road Ground',teams:[{name:'Bangladesh',short:'BAN'},{name:'Sri Lanka',short:'SL'}],status:'Upcoming'},mi:{series:'Hong Kong Sixes 2026',tossWinner:'sri lanka',tossChoice:'bowl'},sc:null,tab:'info'};UI.view='wmatch';render()});
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const lum=c=>{const m=c.match(/\d+(\.\d+)?/g).map(Number);return(m[0]*299+m[1]*587+m[2]*114)/1000};
 const out=[];for(const sel of ['.isub button:not(.on)','.iform']){const e=document.querySelector(sel);if(!e){out.push([sel,'missing']);continue}const cs=getComputedStyle(e);out.push([sel,lum(cs.backgroundColor),lum(cs.color)])}return out});
console.log(JSON.stringify(r));
for(const [s,bg,fg] of r){ok(bg!=='missing',s+' missing');ok(bg>200,s+' bg dark '+bg);ok(fg<120,s+' text light '+fg)}
await p.screenshot({path:'/tmp/infolight.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: info light');})();
