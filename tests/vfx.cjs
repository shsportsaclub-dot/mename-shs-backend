// Broadcast VFX: real scoring events trigger the new SIX / FOUR / OUT / 50 / 100 effects on the overlay page; no old box.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'#overlay');await p.waitForTimeout(500);
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'QA'});startInnings(m,0,'p0','p1','p12');m.status='live';S.stream.mid=m.id;S.stream.gfx={rules:{},mode:'auto'};save();render();window.shFxWatch()});
const count=()=>p.evaluate(()=>document.querySelectorAll('#fxhost .vx').length);
const reset=()=>p.evaluate(()=>{const h=document.getElementById('fxhost');if(h)h.innerHTML=''});
const scene=async(fn,sel,msg)=>{await reset();await p.evaluate(fn);await p.evaluate(()=>{save();window.shFxWatch()});for(let i=0;i<30&&!(await count());i++)await p.waitForTimeout(250);ok((await count())>=1,msg+' plays');ok(!!(await p.$('#fxhost '+sel)),msg+' scene '+sel);await p.waitForTimeout(5300)};
await scene(()=>{ball(S.matches[0],{r:6,x:'',ang:null})},'.vx-ball,.vx-arc','six');
await scene(()=>{ball(S.matches[0],{r:4,x:'',ang:null})},'.vx-rope','four');
await scene(()=>{ball(S.matches[0],{r:0,x:'',w:'Bowled',out:'p0'})},'.vx-slash','bowled out');
ok(await p.evaluate(()=>{const e=document.createElement('div');e.className='ovfx';document.body.appendChild(e);const v=getComputedStyle(e).visibility;e.remove();return v==='hidden'}),'old orange box hidden');
// all scene builders render markup and kinds
const sc=await p.evaluate(()=>shVfx.scenes.map(s=>[s,shVfx.html(s,{title:'X',sub:'y',word:'LBW'}).length]));ok(sc.length===5&&sc.every(x=>x[1]>1200),'five scenes '+JSON.stringify(sc));
// modes differ
const h=await p.evaluate(()=>['BOWLED','LBW','CAUGHT','RUN OUT'].map(w=>shVfx.html('out',{word:w,title:'X'})));ok(new Set(h).size===4,'four distinct dismissal scenes');
ok(/vx-ls/.test(h[1])&&/vx-gl/.test(h[2])&&/vx-sM/.test(h[0]),'mode art');
// self cleans
await reset();await p.evaluate(()=>shVfx.play('g3_four',{title:'x'}));await p.waitForTimeout(5300);ok((await count())===0,'effect removes itself');
// test buttons
await p.evaluate(()=>{window.location.hash='';});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: broadcast vfx');})();
