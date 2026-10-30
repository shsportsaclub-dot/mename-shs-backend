// Scorer: rain interruption and the match result by the DLS method (standard edition), both a revised target and a result when play cannot resume.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:430,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{UI.stage='app';UI.sportInit=1;S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:i%3?'BAT':'BOWL',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];
 S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.players.slice(0,11).map(p=>p.id),xiB:S.players.slice(11).map(p=>p.id)});
 startInnings(m,0,'p0','p1','p11');UI.sid=m.id;UI.mid=m.id;
 // team 1: 150 off 20 overs
 let guard=0;while(m.status==='live'&&m.cur===0&&guard++<400){const k=calc(m,0);const need=150-k.runs;const left=120-k.lg;ball(m,{r:left>0?Math.min(6,Math.max(0,Math.round(need/left))):0});const c=m.innings[0].cur;if(c.s===null||c.n===null){const a=avail(m);if(c.s===null&&a.length){c.s=a[0];m.innings[0].used.push(a[0])}const a2=avail(m);if(c.n===null&&a2.length){c.n=a2[0];m.innings[0].used.push(a2[0])}}if(c.bl===null){c.bl=bowlOpts(m)[0]}}
 const t1=calc(m,0).runs;
 startInnings(m,1,'p11','p12','p0');
 guard=0;while(m.status==='live'&&calc(m,1).lg<48&&guard++<400){ball(m,{r:1});const c=m.innings[1].cur;if(c.bl===null)c.bl=bowlOpts(m)[0]}
 const k=calc(m,1);
 return {t1,runs:k.runs,lg:k.lg,status:m.status,id:m.id}});
ok(r.status==='live'&&r.lg===48,'setup: chase in progress '+JSON.stringify(r));
const out=await p.evaluate(()=>{const m=S.matches[0];F.rain({get:k=>({lost:'',end:'on'})[k]},{dataset:{id:m.id}});return {status:m.status,result:m.result,par:m.dlsPar}});
console.log(JSON.stringify(out));ok(out.par>=30&&out.par<=60,'DLS par score is sensible '+out.par);ok(/Home XI won by 2 runs \(DLS method\)/.test(out.result),'result names the winner by runs with DLS: '+out.result);
ok(out.status==='done'&&/DLS method|No result/.test(out.result),'rain with no resumption gives a DLS result: '+out.result);
await p.evaluate(()=>{UI.view='score';render()});
ok(await p.evaluate(()=>!!document.querySelector('[data-a=rainOpen]')||/DLS/.test(document.body.innerText)),'DLS reachable from the scorer');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: scorer dls');})();
