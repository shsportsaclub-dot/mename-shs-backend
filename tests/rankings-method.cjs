const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'admin'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];S.players.forEach((p,i)=>p.team=i<11?'a':'b');
const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});S.matches.push(m);startInnings(m,0,'p0','p1','p11');
const bl=()=>{const i=m.innings[0];if(i.cur.bl==null)i.cur.bl='p11'};for(let k=0;k<30;k++){bl();ball(m,{r:k%7===0?6:k%3});}bl();ball(m,{w:'Bowled',out:m.innings[0].cur.s});
UI.view='rankings';UI.rk={scope:'all',state:'',g:'men',cat:'bat'};render();const o={};let t=document.body.innerText;
o.chips=!!document.getElementById('rk-method')&&/Strike rate/.test(t)&&/Sixes/.test(t);o.note=/How this is ranked/.test(t)&&/not an ICC-style rating/.test(t);o.runs=/Most runs/.test(t)&&/Player 0/.test(t);
A.rkM({v:'sr'});t=document.body.innerText;o.sr=/Qualifies with 60\+ balls/.test(t);o.srEmpty=/No player qualifies yet/.test(t);
A.rkM({v:'six'});t=document.body.innerText;o.six=/Most sixes/.test(t)&&/Player 0/.test(t);
A.rkM({v:'avg'});o.avgNote=/3\+ innings/.test(document.body.innerText);
UI.rk.cat='bowl';render();o.bowlChips=/Economy/.test(document.body.innerText);A.rkM({v:'econ'});o.econ=/12\+ overs/.test(document.body.innerText);A.rkM({v:'w'});o.w=/Player 11/.test(document.body.innerText);
UI.rk.cat='fld';render();o.fld=/not recorded per fielder/.test(document.body.innerText);o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))if(k!=='srEmpty')ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS rankings method');await b.close()})()
