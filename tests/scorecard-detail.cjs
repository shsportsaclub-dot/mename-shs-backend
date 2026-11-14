// score-card strip (striker light, runner, bowler figures, over timeline), players status, records
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=card#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Aarav Rao','Omarzai','Hasan Ali','Raj Iqbal','Shah Nair','Dar','Ali Khan','Roy','Raz','Mal','Zaid','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir','Kohli','Das','Nag'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Sky High Kings',short:'SHK',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Hapur Hawks',short:'HAH',color:'#16a34a',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});m.cap={a:'p0',b:'p11'};startInnings(m,0,'p0','p1','p11');m.status='live';const inn=m.innings[0];ball(m,{r:4});ball(m,{r:1});ball(m,{r:6});ball(m,{r:0,w:1,out:inn.cur.s});inn.cur.s='p2';ball(m,{x:'wd',r:0});ball(m,{r:2});S.stream.mid=m.id;S.stream.colors={mode:'team',target:'bat'};save()});
await p.waitForTimeout(500);
for(const st of ['sk1','sk7','sk3']){await p.goto(base+'?scene=card&style='+st+'#overlay');await p.waitForTimeout(1200);await p.screenshot({path:'/tmp/claude-0/mod/sx_'+st+'.png',clip:{x:0,y:520,width:1280,height:200}})}
const t=await p.evaluate(()=>{const x=document.querySelector('.skx-rw');return x?x.innerText.replace(/\s+/g,' '):null});console.log('strip:',t);ok(t&&/OMARZAI|HASAN/i.test(t)&&/RAZ|LONE/i.test(t),'strip has batters+bowler');ok(await p.evaluate(()=>document.querySelectorAll('.skx-ov i').length)>=5,'over timeline balls');
await p.goto(base+'?scene=status&t=2#overlay');await p.waitForTimeout(700);await p.screenshot({path:'/tmp/claude-0/mod/sx_status.png'});
const sr=await p.evaluate(()=>document.querySelectorAll('.stt-r').length);console.log('status rows',sr);ok(sr===22,'22 status rows');
await p.goto(base+'?scene=records&t=2#overlay');await p.waitForTimeout(700);await p.screenshot({path:'/tmp/claude-0/mod/sx_records.png'});
ok(await p.evaluate(()=>document.querySelectorAll('.rcc-p .rcc-r').length)>=3,'records rows');
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: scorecard-detail')})();
