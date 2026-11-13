// Every one of the 220 tickers has its own live-data modules, chip style and entrance; modules must not collide with the ticker headline.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=main#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Clarke','Omarzai','Hasan','Rao','Iqbal','Shah','Nair','Dar','Ali','Khan','Roy','Razzaq','Malik','Zaidi','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'United Tigers',short:'UNT',color:'#7c3aed',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Emirates Eagles',short:'EME',color:'#0f766e',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:10,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'H'});m.name='ABU DHABI T10';startInnings(m,0,'p0','p1','p11');m.status='live';const inn=m.innings[0];inn.cur.bl='p11';[1,1,0,4,0,1,6,4,'W',1,6,1,2,4,1].forEach(x=>{if(!inn.cur.s)inn.cur.s='p3';if(x==='W')ball(m,{r:0,w:1,out:inn.cur.s});else ball(m,{r:x})});S.stream.mid=m.id;save()});
const sigs=new Set();let n=0,hits=[];
const NV=await p.evaluate(()=>[shAL.FAM.length,shAL.EVS.length]);
for(let f=1;f<=NV[0];f++)for(let e=0;e<NV[1];e++){const ev=await p.evaluate(e=>shAL.EVS[e],e);
 await p.goto(base+'?scene=anim&id='+f+'_'+ev+'&t=2.6#overlay');await p.waitForTimeout(90);
 const r=await p.evaluate(()=>{const c=[...document.querySelectorAll('.al-mdk .al-mc')];if(!c.length)return null;const sig=c.map(x=>x.className+'|'+x.querySelector('small').textContent).join('/');
  const rs=c.map(x=>x.getBoundingClientRect());const al=document.querySelector('.al');const hd=[...al.querySelectorAll('b,span')].filter(x=>!x.closest('.al-mdk')&&!x.closest('.al-mo')&&x.getBoundingClientRect().width>5&&getComputedStyle(x).opacity!=='0').map(x=>x.getBoundingClientRect());
  let hit=0;for(const a of rs)for(const h of hd){if(a.left<h.right-2&&a.right>h.left+2&&a.top<h.bottom-2&&a.bottom>h.top+2)hit++}
  return{sig,hit,n:c.length,right:Math.max(...rs.map(x=>x.right)),bottom:Math.max(...rs.map(x=>x.bottom)),txt:c[0].innerText.replace(/\n/g,' ')}});
 n++;ok(r&&r.n===3,'3 modules '+f+'_'+ev);if(!r)continue;sigs.add(r.sig);if(r.hit)hits.push(f+'_'+ev+':'+r.hit);ok(r.right<=1280&&r.bottom<=720,'in frame '+f+'_'+ev);
 if(f===1&&ev==='six')console.log(r.txt);}
console.log('tickers',n,'distinct module sets',sigs.size,'collisions',hits.length,hits.slice(0,30).join(' '));
ok(sigs.size>=220,'module sets distinct '+sigs.size);
ok(hits.length<=10,'headline/module collisions '+hits.length);
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: ticker modules');})();
