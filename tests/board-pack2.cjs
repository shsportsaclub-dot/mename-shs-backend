// Broadcast pack 2: player card, tournament fours/sixes, run rate graph, welcome, review
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

const meas=sel=>p.evaluate(sel=>{const w=document.querySelector(sel);if(!w)return null;const r=w.getBoundingClientRect();return{w:r.width,h:r.height,t:w.innerText.replace(/\n+/g,' '),over:document.documentElement.scrollWidth>innerWidth}},sel);
const cases=[['pcard','?scene=pcard&who=striker','.pc',/BALLS.*FOURS.*SIXES.*SR/,'pc1'],['pcard','?scene=pcard&who=bowler','.pc',/FIGURES.*OVERS.*ECON.*DOTS/,'pc2'],['tstat','?scene=tstat&kind=fours','.ts',/TOURNAMENT FOURS/,'ts1'],['tstat','?scene=tstat&kind=sixes','.ts',/TOURNAMENT SIXES/,'ts2'],['rrgraph','?scene=rrgraph','.rg',/RUN RATE.*CRR/,'rg1'],['welcome','?scene=welcome','.wc',/WELCOME TO.*UNITED TIGERS.*VS.*EMIRATES EAGLES.*10 OVERS/,'wc1'],['review','?scene=review&r=pending','.rv',/REPLAY.*REVIEW/,'rv1'],['review','?scene=review&r=out','.rv',/REPLAY.*OUT/,'rv2'],['review','?scene=review&r=notout','.rv',/NOT OUT/,'rv3'],['review','?scene=review&r=um','.rv',/UMPIRE'S CALL/,'rv4']];
for(const [n,u,sel,re,f] of cases){await p.goto(base+u+'#overlay');await p.waitForTimeout(1900);const r=await meas(sel);console.log(f,JSON.stringify(r&&r.t));ok(r&&r.w>200&&re.test(r.t)&&!r.over,n+' '+u+' '+JSON.stringify(r));await p.screenshot({path:'/tmp/claude-0/vid/b2_'+f+'.png'})}
await p.goto(base+'?scene=rrgraph#overlay');await p.waitForTimeout(900);ok(await p.evaluate(()=>document.querySelectorAll('.rg-ln').length>=1),'graph line');
await p.goto(base);await p.waitForTimeout(300);ok(await p.evaluate(()=>{window.pullLive=async()=>{};UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='stream';render();return /More broadcast scenes \(6\)/.test(document.body.innerHTML)}),'Stream card');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: broadcast pack 2');})();
