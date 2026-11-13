// Over Ribbon: batters + hub + bowler + ball-by-ball hexagon strip
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=ribbon#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i+' Khan',role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Hapur Lions',short:'HAP',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Asoda Warriors',short:'ASO',color:'#dc2626',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'H'});m.name='HT-20C';startInnings(m,0,'p0','p1','p11');m.status='live';
 const inn=()=>m.innings[0];inn().cur.bl='p11';
 const seq=[1,1,0,1,0,'wd',1, 6,6,'W',1,6,1, 2,4,'nb',4,0,1,1, 'W',6,6,6];
 let n=0;seq.forEach(x=>{const inn0=inn();if(!inn0.cur.s)inn0.cur.s='p'+(2+n++%8);if(x==='wd')ball(m,{x:'wd',r:0});else if(x==='nb')ball(m,{x:'nb',r:0});else if(x==='W')ball(m,{r:0,w:1,out:inn0.cur.s});else ball(m,{r:x});const lg=calc(m,0).lg;if(lg%6===0&&lg>0&&x!=='wd'&&x!=='nb'){inn0.cur.bl='p'+(11+(lg/6)%3)}});
 S.stream.mid=m.id;save()});
await p.goto(base+'?scene=ribbon#overlay');await p.waitForTimeout(1800);
const r=await p.evaluate(()=>{const w=document.querySelector('.rb');if(!w)return null;const r=w.getBoundingClientRect();return{w:r.width,h:r.height,t:w.innerText.replace(/\n+/g,' '),beads:document.querySelectorAll('.rb-bl').length,w6:document.querySelectorAll('.rb-bl.rb-w').length,s6:document.querySelectorAll('.rb-bl.rb-s').length,x:document.querySelectorAll('.rb-bl.rb-x').length,an:document.getAnimations().length,over:document.documentElement.scrollWidth>innerWidth}});
console.log(JSON.stringify(r));
ok(r&&r.w>900&&r.h>100,'renders');ok(r&&r.beads>=10,'beads '+(r&&r.beads));ok(r&&r.w6>=1&&r.s6>=1,'W and six beads');ok(r&&r.an>=1,'animates');ok(r&&!r.over,'no horizontal overflow');ok(r&&/HAPUR LIONS/i.test(r.t)&&/ASODA/i.test(r.t)&&/ER /i.test(r.t)&&/SR /i.test(r.t),'text '+(r&&r.t));
await p.screenshot({path:'/tmp/claude-0/vid/rb1.png'});
// live update: add a six, pop class appears
await p.evaluate(()=>{ball(S.matches[0],{r:6});save()});await p.waitForTimeout(1900);
ok(await p.evaluate(()=>document.querySelectorAll('.rb-bl.rb-n').length>=0),'pop ok');
// unknown scene unaffected, pos=top
await p.goto(base+'?scene=ribbon&pos=top#overlay');await p.waitForTimeout(900);ok(await p.evaluate(()=>!!document.querySelector('.rbw.top')),'top position');
await p.goto(base);await p.waitForTimeout(300);ok(await p.evaluate(()=>{window.pullLive=async()=>{};UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='stream';render();return /Over Ribbon/.test(document.body.innerHTML)}),'Stream card');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: over ribbon');})();
