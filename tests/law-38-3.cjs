const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});S.matches.push(m);startInnings(m,0,'p0','p1','p11');UI.sid=m.id;UI.view='score';
ball(m,{r:1});ball(m,{r:2});const before=calc(m,0),c0=m.innings[0].cur,non=c0.n;
document.body.insertAdjacentHTML('beforeend','<div id="wm">'+wicketModal(m)+'</div>');const hasBox=!!document.querySelector('#wm input[name=pre]');
const f=new FormData();f.set('w','Run out');f.set('out',non);f.set('pre','on');F.wicket(f);
const k=calc(m,0),o={hasBox,lgB:before.lg,lg:k.lg,wk:k.wk,runs:k.runs,runsB:before.runs,out:k.bat[non]&&k.bat[non].out,blW:(k.bowl.p11||{}).w,blB:(k.bowl.p11||{}).b,n:m.innings[0].cur.n,fow:k.fow.length};
const f2=new FormData();f2.set('w','Bowled');f2.set('out',m.innings[0].cur.s);f2.set('pre','on');const wk=calc(m,0).wk;F.wicket(f2);o.refused=calc(m,0).wk===wk;
return o});
console.log(JSON.stringify(r));
ok(r.hasBox,'checkbox in wicket form');ok(r.lg===r.lgB,'ball not counted');ok(r.wk===1&&r.fow===1,'one wicket');ok(r.runs===r.runsB,'no runs');ok(/^run out/.test(r.out||''),'label '+r.out);ok(r.blW===0&&r.blB===r.blB,'bowler no credit');ok(r.n===null,'non-striker gone');ok(r.refused,'refused for non run-out');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS law 38.3');await b.close()})()
