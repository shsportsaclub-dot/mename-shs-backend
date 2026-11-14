// Auto scene director + mini stats + dismissal fielder + left-hand mirror
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=wagon#overlay');await p.waitForTimeout(400);
const build=(balls,finish,second,left)=>p.evaluate(([balls,finish,second,left])=>{S.matches=[];const nmz=Array.from({length:22},(_,i)=>(i<11?'A':'B')+(i%11+1));S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:'BAT',team:i<11?'a':'b',bat:left&&i===0?'Left-hand':'Right-hand',bowl:'Right-arm fast'}));
 S.teams=[{id:'a',name:'Alpha',short:'ALP',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Beta',short:'BET',color:'#9d174d',players:S.players.slice(11).map(p=>p.id)}];
 const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'Test Ground'});m.cap={a:'p0',b:'p11'};
 if(balls>0){startInnings(m,0,'p0','p1','p11');m.status='live';const inn=m.innings[0];inn.cur.bl='p11';for(let i=0;i<balls;i++){if(!inn.cur.bl)inn.cur.bl='p'+(11+Math.floor(i/6)%5);ball(m,{r:i%3===0?4:1});const e=inn.ev[inn.ev.length-1];e.ang={a:(i*.9)%6.28,d:.8}}
  if(second){startInnings(m,1,'p11','p12','p0');m.innings[1].cur.bl='p0';for(let i=0;i<second;i++){if(!m.innings[1].cur.bl)m.innings[1].cur.bl='p'+(Math.floor(i/6)%5);ball(m,{r:1})}}}
 if(finish){m.status='done';m.win='a';m.result='Alpha won by 10 runs'}
 S.stream.mid=m.id;save();return m.cur},[balls,finish,second,left]);
const txt=async(q)=>{await p.waitForTimeout(900);await p.goto(base+'?scene=auto'+(q||'')+'#overlay');await p.waitForTimeout(500);return p.evaluate(()=>document.querySelector('.ov')?document.querySelector('.ov').innerText.replace(/\n+/g,' '):'NONE')};
await build(0);let t=await txt();console.log('pre-match:',t.slice(0,80));ok(/THE TOSS/.test(t),'toss before first ball');
await build(37);t=await txt();console.log('pp end:',t.slice(0,80));ok(/POWERPLAY 1-6 OVERS/.test(t),'powerplay strip at pp end');
await build(70);t=await txt();console.log('mid:',t.slice(0,80));ok(!/POWERPLAY|HIGHLIGHTS|THE TOSS|INNINGS BREAK/.test(t),'normal overlay mid-innings');
await build(120);t=await txt();console.log('innings end:',t.slice(0,80));ok(/INNINGS HIGHLIGHTS|INNINGS 1/.test(t),'highlights at innings end');
await p.evaluate(()=>{UI.au.tl.t0-=30});await p.waitForTimeout(1800);t=await p.evaluate(()=>document.querySelector('.ov').innerText.replace(/\n+/g,' '));console.log('break:',t.slice(0,80));ok(/INNINGS BREAK/.test(t)&&/TARGET/.test(t),'innings break card after highlights');
await build(120,true,100);t=await txt();console.log('done:',t.slice(0,80));ok(/PLAYER OF THE MATCH/.test(t),'result: player of the match');
await build(40);await p.waitForTimeout(900);await p.goto(base+'?scene=mini#overlay');await p.waitForTimeout(400);t=await p.evaluate(()=>document.querySelector('.mn').innerText.replace(/\n+/g,' '));console.log('mini:',t.slice(0,100));ok(/BATTER/.test(t)&&/BOWLER/.test(t)&&/RR/.test(t),'mini table');
/* dismissal with fielder */
await p.evaluate(()=>{const m=S.matches[0],inn=m.innings[0];ball(m,{w:'Caught',out:inn.cur.s,fld:'Omarzai',r:0});save()});await p.waitForTimeout(900);await p.goto(base+'?scene=dismiss#overlay');await p.waitForTimeout(400);
t=await p.evaluate(()=>document.querySelector('.rs').innerText.replace(/\n+/g,' '));console.log('dismiss:',t.slice(0,140));ok(/CAUGHT/.test(t)&&/C OMARZAI B/.test(t),'caught picture names fielder');
/* left-hand mirror */
await build(12,false,0,true);await p.waitForTimeout(900);await p.goto(base+'?scene=wagon&who=team&t=3#overlay');await p.waitForTimeout(400);t=await p.evaluate(()=>document.querySelector('.wg-wgr').innerText.replace(/\n+/g,' '));ok(/LEFT-HANDERS MIRRORED/.test(t),'left-hander mirrored note');
ok(!errs.length,errs.slice(0,3).join(';'));if(!process.exitCode)console.log('PASS: auto director');await b.close()})();
