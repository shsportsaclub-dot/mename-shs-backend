const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'Scorer',role:'scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));S.players[0].ext={stats:[{src:'Club league',m:10,r:200}]};
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});S.matches.push(m);
A.ppOpen({id:'p0'});UI.pp.tab='trophies';render();const o={};let t=document.body.innerText;
o.ver=/VERIFIED: SCORED IN SH/.test(t);o.self=/Career entries/.test(t)&&/Nothing declared yet/.test(t);o.form=!!document.getElementById('sd-x');
document.getElementById('sd-y').value='2019';document.getElementById('sd-x').value='Played for Lions CC';A.selfAdd({p:'p0'});
o.added=(S.players[0].self||[]).length===1;render();t=document.body.innerText;o.shown=/Played for Lions CC/.test(t)&&/SELF-DECLARED/.test(t);
document.getElementById('sd-y').value='1800';document.getElementById('sd-x').value='bad year here';A.selfAdd({p:'p0'});o.badYear=S.players[0].self.length===1;
A.selfDel({p:'p0',id:S.players[0].self[0].id});o.del=S.players[0].self.length===0;
S.user={name:'Someone',role:'viewer'};render();o.noForm=!document.getElementById('sd-x');S.user={name:'Me',role:'viewer',pid:'p0'};render();o.ownForm=!!document.getElementById('sd-x');o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS career labels');await b.close()})()
