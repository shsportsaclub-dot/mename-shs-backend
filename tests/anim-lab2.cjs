// Animation Lab part 2: points table, batting card bars, locked event layer on every scene
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=manhattan#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Clarke','Omarzai','Hasan','Rao','Iqbal','Shah','Nair','Dar','Ali','Khan','Roy','Razzaq','Malik','Zaidi','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n+' X',role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'United Tigers',short:'UNT',color:'#7c3aed',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Emirates Eagles',short:'EME',color:'#0f766e',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:10,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'H'});m.name='ABU DHABI T10';startInnings(m,0,'p0','p1','p11');m.status='live';
 const inn=m.innings[0];inn.cur.bl='p11';let n=0;
 const seq=[1,1,0,4,0,1, 6,4,'W',1,6,1, 2,4,'wd',4,0,1,1, 'W',1,1,2,0,0, 4,4,6,1,0,1, 0,1,2,1,1,0, 6,0,1,4,1,1, 1,1,0,2,4,1];
 seq.forEach(x=>{if(!inn.cur.s)inn.cur.s='p'+(2+(n++%8));if(x==='wd')ball(m,{x:'wd',r:0});else if(x==='W')ball(m,{r:0,w:1,out:inn.cur.s});else ball(m,{r:x});const lg=calc(m,0).lg;if(lg>0&&lg%6===0&&x!=='wd')inn.cur.bl='p'+(11+(lg/6)%4)});
 S.stream.mid=m.id;save()});

await p.evaluate(()=>{const A_=S.teams[0],B_=S.teams[1];const mk=(w,ra,rb)=>{const m=newMatch({a:'a',b:'b',overs:10,toss:'a',dec:'bat',xiA:A_.players,xiB:B_.players,venue:'V'});m.tid='t1';m.status='done';m.win=w;m.result=(w==='a'?'United Tigers':'Emirates Eagles')+' won';m.name='M';return m};
 const x=mk('a'),y=mk('b');startInnings(x,0,'p0','p1','p11');startInnings(y,0,'p0','p1','p11');S.matches.push(x,y);S.tours=[{id:'t1',name:'ABU DHABI T10',teams:['a','b'],overs:10,rules:{}}];S.matches[0].tid='t1';save()});
const meas=sel=>p.evaluate(sel=>{const w=document.querySelector(sel);if(!w)return null;const r=w.getBoundingClientRect();return{w:r.width,h:r.height,t:w.innerText.replace(/\n+/g,' '),over:document.documentElement.scrollWidth>innerWidth}},sel);
await p.goto(base+'?scene=points#overlay');await p.waitForTimeout(1600);let r=await meas('.pt');console.log(JSON.stringify(r&&r.t));ok(r&&r.w>700&&/POINTS TABLE/.test(r.t)&&/PTS/.test(r.t)&&/TOP FOUR/.test(r.t),'points');
await p.goto(base+'?scene=bats#overlay');await p.waitForTimeout(1600);r=await meas('.bt');console.log(JSON.stringify(r&&r.t));ok(r&&r.w>600&&/EXTRAS/.test(r.t)&&/OVERS/.test(r.t),'bats');ok(await p.evaluate(()=>document.querySelectorAll('.bt-br').length>=3),'bars');await p.screenshot({path:'/tmp/claude-0/vid/al_bt.png'});
await p.goto(base+'?scene=points#overlay');await p.waitForTimeout(1600);await p.screenshot({path:'/tmp/claude-0/vid/al_pt.png'});
// lock: same layer on every scene
await p.evaluate(()=>{S.stream.alMode='variety';save()});
for(const sc of ['main','card','tvbar','ribbon','manhattan','pcard']){await p.goto(base+'?scene='+sc+'#overlay');await p.waitForTimeout(1500);
 await p.evaluate(()=>{ball(S.matches[0],{r:6});save()});await p.waitForTimeout(2300);
 const has=await p.evaluate(()=>{const a=document.querySelector('.alr .al');return a?a.innerText.replace(/\n+/g,' '):null});console.log(sc,JSON.stringify(has));ok(has&&/SIX|FIFTY/.test(has),'locked layer on '+sc);
 ok(await p.evaluate(()=>document.body.classList.contains('al-on')),'old tickers hidden while lab on');if(sc==='card')await p.screenshot({path:'/tmp/claude-0/vid/al_lock.png'});await p.waitForTimeout(2200)}
await p.evaluate(()=>{S.stream.alMode='off';save()});await p.goto(base+'?scene=card#overlay');await p.waitForTimeout(1200);await p.evaluate(()=>{ball(S.matches[0],{r:6});save()});await p.waitForTimeout(2200);ok(await p.evaluate(()=>!document.querySelector('.alr .al')),'off = no layer');
await p.goto(base);await p.waitForTimeout(300);ok(await p.evaluate(()=>{window.pullLive=async()=>{};UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='stream';render();return /Animation Lab \(220 designs\)/.test(document.body.innerHTML)}),'Stream card');
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: anim lab part 2');})();
