const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'Org',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Australia',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
const t={id:'t1',name:'Summer Cup',teams:['a','b'],fixtures:[],overs:20,kind:'tournament',org:'Hema'};S.tours=[t];
const m=newMatch({a:'a',b:'b',overs:2,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});m.tid='t1';S.matches.push(m);startInnings(m,0,'p0','p1','p11');
const bl=(k)=>{const i=m.innings[k];if(i.cur.bl==null)i.cur.bl=k?'p0':'p11'};for(let i=0;i<12;i++){bl(0);if(m.innings[0].done||m.status==='done')break;ball(m,{r:i%3+1})}
if(m.innings.length<2&&m.status!=='done'){try{startInnings(m,1,'p11','p12','p0')}catch(e){}}for(let i=0;i<12&&m.status!=='done';i++){bl(1);ball(m,{r:1})}
m.status='done';m.win='a';m.result='India won';
UI.tid='t1';UI.view='tour';UI.ttab='awd';UI.tf={q:''};render();const o={};
o.box=/Certificates/.test(document.body.innerText)&&!!document.querySelector('[data-a=certOpen][data-k=winner]');
o.btns=document.querySelectorAll('[data-a=certOpen]').length;
const w=document.querySelector('[data-a=certOpen][data-k=winner]');A.certOpen({t:'t1',k:'winner',id:'a'});o.cert=/Tournament Winners/.test(document.body.innerText)&&/India/.test(document.body.innerText)&&/Summer Cup/.test(document.body.innerText);
A.closeModal({dataset:{}},{dataset:{}},{});o.closed=!document.querySelector('.cert')&&!document.body.classList.contains('cert-print');
A.certAll({t:'t1'});o.all=document.querySelectorAll('.cert').length===2;o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
await p.evaluate(()=>A.certOpen({t:'t1',k:'orange',id:'p1'}));await p.screenshot({path:'/tmp/cert.png'});console.log(JSON.stringify(r));for(const k of ['box','cert','closed','all','fit'])ok(r[k],k);ok(r.btns>=3,'buttons '+r.btns);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS certificates');await b.close()})()
