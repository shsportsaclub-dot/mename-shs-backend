const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.apiBase=()=>'http://x';
 window.fetch=async(u)=>{u=String(u);return {json:async()=>/paper\?date=2026-10-29/.test(u)?{ok:true,news:[{h:'India beat Australia',sub:'Final report'}],sh:[],world:[{name:'A v B',status:'Team A won by 5 runs'}]}:/\/paper/.test(u)?{ok:true,days:['2026-10-28','2026-10-29'],recent:[],news:[],world:[],sh:[]}:{ok:false}}};
 UI.stage='app';S.user={name:'QA',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));
 S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});m.status='done';m.result='India won by 12 runs';S.matches.push(m);
 UI.view='epaper';UI.ep2={ed:'local'};render();await new Promise(r=>setTimeout(r,400));const o={};
 o.en=/Results/i.test(document.body.innerText)&&/India won by 12 runs/.test(document.body.innerText);
 A.ep3Lang({v:'te'});o.te=/ఫలితాలు/.test(document.body.innerText)&&/12 పరుగుల తేడాతో గెలిచింది/.test(document.body.innerText)&&/లోకల్/.test(document.body.innerText);
 A.ep3Lang({v:'hi'});o.hi=/नतीजे/.test(document.body.innerText)&&/12 रन से जीता/.test(document.body.innerText);
 A.ep3Lang({v:'en'});o.back=/Results/i.test(document.body.innerText);
 await A.ep3Day({v:'2026-10-29'});o.arch=/India beat Australia/.test(document.body.innerText)&&/A v B/.test(document.body.innerText);
 UI.ep2.ed='global';render();o.global=!!document.querySelector('.ep');o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));
for(const k of Object.keys(r))ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS epaper languages + archive');await b.close()})()
