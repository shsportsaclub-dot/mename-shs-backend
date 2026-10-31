const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'admin'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
S.tours=[{id:'t1',name:'Summer Cup',teams:['a','b'],overs:20,kind:'tournament',fixtures:[{id:'f1',a:'a',b:'b',date:'2026-11-05',mid:null,stage:'League'},{id:'f2',a:'a',b:'b',mid:'m9',stage:'League'}]}];
const o={};S.wiz=wzFresh();wzShow();let t=document.getElementById('modal')?document.getElementById('modal').innerText:document.body.innerText;
o.sport=/Sport/.test(t)&&/Cricket/.test(t);
A.wzMode({v:'tournament'});t=document.body.innerText;o.fixList=/Link to a tournament/.test(t)&&/Start this fixture/.test(t)&&!/next update/.test(t);o.hideDone=(t.match(/Start this fixture/g)||[]).length===1;
A.wzFix({t:'t1',id:'f1'});o.linked=S.wiz&&S.wiz.tid==='t1'&&S.wiz.fid==='f1'&&S.wiz.step===3&&S.wiz.a==='a';
S.wiz=wzFresh();wzShow();A.wzSport({v:'football'});o.sgnew=UI.view==='sgnew'&&UI.sgnew==='football'&&S.wiz===null;
o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS wizard sport');await b.close()})()
