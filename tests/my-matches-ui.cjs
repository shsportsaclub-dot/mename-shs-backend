const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.route('**/api/**',async r=>{const u=r.request().url();let j={ok:true,items:[]};
 if(/me\/matches/.test(u))j={ok:true,items:[{id:'mq1',status:'live',date:'2026-11-01',a:'Lions',b:'Tigers',result:''}]};
 else if(/shared\/matches\/mq1/.test(u))j={ok:true,item:{id:'mq1',owner:'other',ownerName:'Scorer',updated:5,data:{m:{id:'mq1',a:'tA',b:'tB',status:'live',innings:[],cur:0,overs:20,xi:{},date:'2026-11-01'},teams:{tA:{id:'tA',name:'Lions',short:'LIO',color:'#111'},tB:{id:'tB',name:'Tigers',short:'TIG',color:'#222'}},players:{}}}};
 await r.fulfill({json:j})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'Fan',role:'viewer'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';S.matches=[];const o={},w=ms=>new Promise(r=>setTimeout(r,ms));
 // the match the scorer shares carries who is in the squad (numbers go to the server only, inside the private link field)
 S.teams=[{id:'a',name:'A',short:'A',players:['p1','p2','p3']},{id:'b',name:'B',short:'B',players:[]}];S.players=[{id:'p1',name:'One',phone:'+919000000002'},{id:'p2',name:'Two',shid:'SH-AB12CD34'},{id:'p3',name:'Three',rid:'pr1'}];
 const pk=shPack('matches',{id:'x',a:'a',b:'b',xi:{a:['p1','p2','p3']},subs:{}});o.link=pk.link&&pk.link.phones[0]==='+919000000002'&&pk.link.shids[0]==='SH-AB12CD34'&&pk.link.rids[0]==='pr1';
 await window.shMineLoad();await w(300);UI.view='matches';render();await w(100);
 const t=document.body.innerText;o.card=!!document.getElementById('mine-card')&&/Lions v Tigers/.test(t)&&/LIVE/.test(t);o.pulled=S.matches.some(m=>m.id==='mq1');
 await A.mineOpen({id:'mq1'});await w(100);o.open=UI.view==='match'&&UI.mid==='mq1';o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS my matches ui');await b.close()})()
