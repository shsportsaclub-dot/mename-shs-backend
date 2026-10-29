// Win chance under each team name in the live hero (model estimate, not betting odds).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const open=(score,over,status)=>p.evaluate(([score,over,status])=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'a1',name:'ZIMW v INDW',started:true,ended:false,type:'ODI',overs:50,teams:[{name:'Zimbabwe Women',short:'ZIMW'},{name:'India Women',short:'INDW'}],score,status},mi:{},sc:{scorecard:[]},bb:{bbb:[]},tab:'live'};UI.view='wmatch';render()},[score,over,status]);
// first innings: projected only
await open([{inning:'Zimbabwe Women Inning 1',r:25,w:2,o:9}],9,'Live');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/wc3.png'});
let t=await p.evaluate(()=>[...document.querySelectorAll('.hero .tm small.wc')].map(x=>x.innerText));
{const q=t.map(x=>+(x.match(/(\d+)%/)||[])[1]);ok(t.length===2&&q[0]+q[1]===100&&q[0]>=25&&q[0]<=75,'1st inns '+t)}
// chase: percentages add to 100, favourite starred
await open([{inning:'Zimbabwe Women Inning 1',r:200,w:10,o:50},{inning:'India Women Inning 1',r:150,w:3,o:35}],35,'Live');await p.waitForTimeout(300);
t=await p.evaluate(()=>[...document.querySelectorAll('.hero .tm small.wc')].map(x=>x.innerText));
const n=t.map(x=>+(x.match(/(\d+)%/)||[])[1]);
ok(t.length===2&&n[0]+n[1]===100&&/★/.test(n[0]>=50?t[0]:t[1]),'chase '+t);
await p.screenshot({path:'/tmp/wc2.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: win chance',t.join(' / '));})();
