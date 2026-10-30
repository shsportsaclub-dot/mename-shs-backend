const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.apiBase=()=>'http://x';window.__net=false;window.__puts=[];
 window.fetch=(u,o)=>{u=String(u);if(!/\/api\/shared\/matches\//.test(u))return Promise.resolve({json:async()=>({ok:false})});
  if(!window.__net){if(window.__hang)return new Promise((_,rej)=>{o.signal&&o.signal.addEventListener('abort',()=>rej(new Error('aborted')))});return Promise.reject(new TypeError('Failed to fetch'))}
  window.__puts.push(JSON.parse(o.body).data.m);return Promise.resolve({status:200,json:async()=>({ok:true})})};
 UI.stage='app';S.user={name:'QA',role:'admin',kind:'Scorer',phone:'9999999999'};S.tok='tok';S.prefs={...S.prefs,asked:1,welcomed:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));
 S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});S.matches.push(m);startInnings(m,0,'p0','p1','p11');
 const o={};await shPush();o.pendOffline0=shPend();
 for(let i=0;i<8;i++){const inn=m.innings[0];if(inn.cur.bl==null)inn.cur.bl='p11';ball(m,{r:i%5})}save();
 UI.sh.busy=false;await shPush();o.state=UI.sh.state;o.pend=shPend();o.chip=/waiting to sync|Offline/.test(shChip());
 // reload-like: hash cleared, still pending after a restart
 UI.sh.hash={};o.pendAfterRestart=shPend();
 window.__net=true;await shPush();o.sent=window.__puts.length;o.balls=window.__puts.length?window.__puts[window.__puts.length-1].innings[0].ev.length:0;o.pendAfter=shPend();
 // hanging connection must not block later syncs
 window.__net=false;window.__hang=true;ball(m,{r:1});UI.sh.busy=false;const t0=Date.now();const hp=shPush();setTimeout(()=>{},0);o.hangStarted=true;
 return o});
console.log(JSON.stringify(r));
ok(r.pend>=1&&r.pendAfterRestart>=1,'pending while offline and after restart');ok(r.state==='offline','state offline');ok(r.sent>=1&&r.balls===8,'all 8 balls delivered when back online');ok(r.pendAfter===0,'nothing pending after sync');
const hung=await p.evaluate(()=>new Promise(res=>{const t=Date.now();const iv=setInterval(()=>{if(!UI.sh.busy){clearInterval(iv);res(Date.now()-t)}},500);setTimeout(()=>{clearInterval(iv);res(-1)},26000)}));
ok(hung>0&&hung<24000,'hung request released by timeout ('+hung+'ms)');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS offline sync');await b.close()})()
