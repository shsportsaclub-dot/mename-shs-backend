// Wagon wheel, select bowler/batter, 260-scene library
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=wagon#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Aarav Sharma','Omarzai','Hasan','Rao','Iqbal','Shah','Nair','Dar','Ali','Khan','Roy','Razzaq','Malik','Zaidi','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:i>=11&&i<16?'BOWL':'BAT',team:i<11?'a':'b',bowl:i%2?'Right-arm fast':'Left-arm orthodox spin',bat:'Right-hand',jersey:i+1}));S.teams=[{id:'a',name:'Sky High Kings',short:'SHK',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Hapur Hawks',short:'HAH',color:'#9d174d',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'Royal Shield Stadium'});m.name='ROYAL SHIELD';startInnings(m,0,'p0','p1','p11');m.status='live';const inn=m.innings[0];inn.cur.bl='p11';let n=0;
 [1,4,6,0,2,1,3,4,6,1,6,4,1,0,2,4,1,6].forEach((x,i)=>{if(!inn.cur.bl)inn.cur.bl='p'+(11+(n++%4));ball(m,{r:x});const e=inn.ev[inn.ev.length-1];if(x>0)e.ang={a:(i*0.73+0.4)%6.28,d:x>=4?1:.3+(i%5)*.12}});S.stream.mid=m.id;save()});
await p.goto(base+'?scene=wagon&t=4#overlay');await p.waitForTimeout(500);
const w=await p.evaluate(()=>{const r=document.querySelector('.wg-wgr');return{t:r.innerText.replace(/\n+/g,' '),lines:document.querySelectorAll('.wg-ln').length,dots:document.querySelectorAll('.wg-dt').length,bar:!!document.querySelector('.rb.rb-tv'),over:document.documentElement.scrollWidth>innerWidth}});console.log(w.t.slice(0,120),w.lines,w.dots);
ok(/WAGON WHEEL/.test(w.t)&&/SHOT MAP/.test(w.t)&&w.lines>=5&&w.lines===w.dots,'wagon content');ok(w.bar,'wagon: score bar at bottom');ok(!w.over,'wagon no overflow');await p.screenshot({path:'/tmp/claude-0/mod/wagon.png'});
for(const sc of ['pick&kind=bowler','pickbat']){await p.goto(base+'?scene='+sc+'&t=3#overlay');await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const c=[...document.querySelectorAll('.pk-cd')];return{n:c.length,on:document.querySelectorAll('.pk-cd.pk-on').length,t:document.querySelector('.pk-pkr').innerText.replace(/\n+/g,' '),over:document.documentElement.scrollWidth>innerWidth,bar:!!document.querySelector('.rb.rb-tv')}});console.log(sc,r.n,r.t.slice(0,90));
 ok(r.n===5&&r.on===1,sc+' 5 cards, one selected');ok(/SELECT (BOWLER|BATTER)/.test(r.t)&&/DONE/.test(r.t),sc+' title');ok(!r.over,sc+' overflow');await p.screenshot({path:'/tmp/claude-0/mod/'+sc.split('&')[0]+'.png'})}
const N=await p.evaluate(()=>shLib.CAT.length);console.log('scenes',N);ok(N>=260,'260 scenes');
const sigs=new Set();let bad=[];
for(let id=1;id<=N;id++){await p.goto(base+'?scene=lib&id='+id+'&t=3#overlay');await p.waitForTimeout(40);
 const r=await p.evaluate(()=>{const pn=document.querySelector('.lb-pn'),hd=document.querySelector('.lb-hd b'),bar=document.querySelector('.rb.rb-tv');if(!pn||!bar)return null;const a=pn.getBoundingClientRect(),c=bar.getBoundingClientRect();return{sig:pn.className+'|'+getComputedStyle(document.querySelector('.lb-lbr')).getPropertyValue('--h')+'|'+getComputedStyle(document.querySelector('.lb-lbr')).getPropertyValue('--ff'),bot:a.bottom,top:c.top,r:a.right,l:a.left,t:pn.innerHTML.length,name:hd.textContent,over:document.documentElement.scrollWidth>innerWidth}});
 if(!r){bad.push(id+' missing');continue}sigs.add(r.sig);if(r.bot>r.top+2)bad.push(id+' overlaps bar '+Math.round(r.bot)+'>'+Math.round(r.top));if(r.r>1281||r.l<-1)bad.push(id+' out of frame');if(r.over)bad.push(id+' overflow');if(r.t<3)bad.push(id+' empty');
 if([1,2,7,13,26,30,41,55,70,100,130,150,200,231,251,260].indexOf(id)>=0)await p.screenshot({path:'/tmp/claude-0/mod/lib_'+id+'.png'})}
console.log('distinct looks',sigs.size,'problems',bad.length,bad.slice(0,25).join(' ; '));ok(sigs.size>=240,'looks distinct '+sigs.size);ok(bad.length===0,'scene problems');
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: scene library');})();
