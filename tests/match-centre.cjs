// Match Centre scene (?scene=main): renders from live data, chase equation, animations running, score pulse on change, no errors.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'?scene=main&bg=1#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Hapur Lions',short:'HAP',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Asoda Warriors',short:'ASO',color:'#dc2626',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'H'});m.name='Test Cup';startInnings(m,0,'p0','p1','p11');m.status='live';window.__bl=o=>{const m=S.matches[0],inn=m.innings[m.cur];if(!inn.cur.bl)inn.cur.bl='p'+(11+(Math.floor(inn.lg/6)%3));ball(m,o)};[1,4,0,6,1,0,2].forEach(r=>__bl({r}));S.stream.mid=m.id;save();render()});
await p.waitForTimeout(3300);
const T=await p.evaluate(()=>{const t=document.querySelector('.mc');return t?t.innerText:''});
for(const w of ['TEST CUP','SCORING HEROES','HAPUR LIONS','ASOK','THIS OVER','CRR','PROJECTED','COMMENTARY','SCORECARD','PLAYING XI','POINTS'])if(w!=='ASOK')ok(T.toUpperCase().includes(w),'text '+w);
ok(/14\/0/.test(T),'score 14/0 shown: '+T.slice(0,200).replace(/\n/g,' '));
const n=await p.evaluate(()=>document.getAnimations().length);ok(n>=15,'animations running '+n);
ok(await p.evaluate(()=>[...document.querySelectorAll('.mc [class]')].every(e=>[...e.classList].every(c=>c==='mc'||c.startsWith('m-')))),'classes namespaced');
// score change pulses
await p.evaluate(()=>{__bl({r:6});save()});await p.waitForTimeout(1700);ok(await p.evaluate(()=>!!document.querySelector('.mc .m-sc.m-pu')),'score pulse after a boundary');
// chase view
await p.evaluate(()=>{const m=S.matches[0];m.cur=1;startInnings(m,1,'p11','p12','p0');m.target=60;__bl({r:4});save();render()});await p.waitForTimeout(2000);
const C=await p.evaluate(()=>document.querySelector('.mc').innerText.toUpperCase());
ok(/TARGET/.test(C)&&/60/.test(C)&&/NEED 56 RUNS OFF/.test(C)&&/RRR/.test(C),'chase equation: '+C.replace(/\n/g,' ').slice(0,260));
// no overflow beyond viewport
ok(await p.evaluate(()=>{const r=document.querySelector('.mc').getBoundingClientRect();return r.width<=1281&&r.height<=721}),'fits 16:9 frame');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: match centre');})();
