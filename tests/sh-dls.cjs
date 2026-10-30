const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});render();A.demo()});await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const m=S.matches.find(x=>x.status==='live')||S.matches[0];UI.sid=m.id;UI.mid=m.id;
 m.paused={reason:'Rain',at:Date.now()-60000,note:''};A.intResume({id:m.id});
 const a=shDls(m);const s1=a.status,g1=a.getBroadcastGraphics();let err='';try{a.approveCalculation({target:150,revisedOvers:15,official:false,source:'x',calculationVersion:'v'})}catch(e){err=e.message}
 const F2={get:k=>({target:'151',overs:'15',note:'rain'})[k]};F.dlsRec(F2);const b=shDls(m);return {s1,g1,err,s2:b.status,g2:b.getBroadcastGraphics(),n:m.dls.interruptions.length}});
console.log(JSON.stringify(r));
ok(r.s1==='AWAITING_OFFICIAL_DLS'&&!r.g1.showTarget,'awaiting after rain stop');ok(/evidence/i.test(r.err),'no approval without official evidence');
ok(r.s2==='OFFICIALLY_APPROVED'&&r.g2.target===151&&r.g2.revisedOvers===15&&r.n===1,'official figure unlocks target');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: sh-dls');})();
