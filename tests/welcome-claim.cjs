const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const o={};S.user=null;UI.stage='app';S.prefs={};UI.wel=null;render();let t=document.body.innerText;o.chips=/How will you use the app\?/.test(t)&&/Coach or parent/.test(t)&&/not chosen here/.test(t);
A.welR({v:'player'});o.sel=UI.wel.r==='player';A.welGo();o.saved=S.prefs.role==='player'&&S.prefs.welcomed===1;
S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=[{id:'p1',name:'Ravi',role:'BAT',phone:'+91 98765 43210'},{id:'p2',name:'Other',role:'BAT',phone:'9111111111'},{id:'p3',name:'Taken',role:'BAT',phone:'9876543210'}];S.teams=[];
S.users=[{id:'u1',nick:'Ravi',phone:'9876543210'},{id:'u2',nick:'Z',phone:'1',pid:'p3'}];S.user=S.users[0];UI.view='profile';render();t=document.body.innerText;
o.card=!!document.getElementById('claim-card');o.match=/Ravi/.test(t)&&/This is me/.test(t)&&!/Other/.test(t.split('Your player profile')[1]||'')&&!/Taken/.test(t.split('Your player profile')[1]||'');
A.claimPl({id:'p2'});o.noForeign=!S.user.pid;A.claimPl({id:'p3'});o.noTaken=!S.user.pid;
A.claimPl({id:'p1'});o.linked=S.user.pid==='p1'&&S.users[0].pid==='p1';render();o.gone=!document.getElementById('claim-card');
o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS welcome claim');await b.close()})()
