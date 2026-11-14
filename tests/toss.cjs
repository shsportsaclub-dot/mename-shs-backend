// Toss: full screen scene, coin chip in every ticker, toss library scenes. Only supplied coin images (gold, red, silver).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=toss#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Aarav Sharma','Omarzai','Hasan','Rao','Iqbal','Shah','Nair','Dar','Ali','Khan','Roy','Razzaq','Malik','Zaidi','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:i>=11&&i<16?'BOWL':'BAT',team:i<11?'a':'b',bowl:'Right-arm fast',bat:'Right-hand',jersey:i+1}));S.teams=[{id:'a',name:'Sky High Kings',short:'SHK',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Hapur Hawks',short:'HAH',color:'#9d174d',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'b',dec:'bowl',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'Royal Shield Stadium'});m.name='ROYAL SHIELD';startInnings(m,0,'p0','p1','p11');m.status='live';m.tossInfo={mode:'coin',caller:'a',call:'H',result:'T',winner:'b',chose:'bowl'};S.stream.mid=m.id;save()});
for(const st of ['gold','red','silver']){await p.goto(base+'?scene=toss&style='+st+'&t=4#overlay');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const t=document.querySelector('.tr-trr').innerText.replace(/\n+/g,' ');const f=document.querySelector('.tr-cf').style.backgroundImage,c=document.querySelector('.tr-cb').style.backgroundImage;const tr=getComputedStyle(document.querySelector('.tr-tcn')).transform;return{t,f,c,tr,bar:!!document.querySelector('.rb.rb-tv'),over:document.documentElement.scrollWidth>innerWidth}});
 console.log(st,r.t.slice(0,150));ok(/HAPUR HAWKS WON THE TOSS/.test(r.t)&&/ELECTED TO BOWL FIRST/.test(r.t)&&/COIN SHOWS\s*TAILS/.test(r.t)&&/SKY HIGH KINGS CALLED HEADS/.test(r.t),st+' texts');
 ok(r.f.includes('/coins/'+st+'-heads.webp')&&r.c.includes('/coins/'+st+'-tails.webp'),st+' images');ok(r.bar,st+' score bar');ok(!r.over,st+' overflow');
 await p.screenshot({path:'/tmp/claude-0/mod/toss_'+st+'.png'})}
// mid-flip frame
await p.goto(base+'?scene=toss&style=red&t=1.5#overlay');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/mod/toss_mid.png'});
// all 6 flip variants render
for(let a=0;a<6;a++){await p.goto(base+'?scene=toss&anim='+a+'&t=1.2#overlay');await p.waitForTimeout(150);ok(await p.evaluate(()=>!!document.querySelector('.tr-tcn')&&getComputedStyle(document.querySelector('.tr-tcn')).animationName!=='none'),'flip variant '+a)}
// library toss scenes 31-40
for(let id=31;id<=40;id++){await p.goto(base+'?scene=lib&id='+id+'&t=4#overlay');await p.waitForTimeout(150);const r=await p.evaluate(()=>{const pn=document.querySelector('.lb-pn'),bar=document.querySelector('.rb.rb-tv');return{t:pn.innerText.replace(/\n+/g,' '),img:!!pn.querySelector('.lb-cf'),bot:pn.getBoundingClientRect().bottom,top:bar?bar.getBoundingClientRect().top:999}});ok(/WON THE TOSS/.test(r.t)&&r.img&&r.bot<=r.top+2,'lib toss '+id+' '+r.t.slice(0,60));if(id===31||id===34||id===38)await p.screenshot({path:'/tmp/claude-0/mod/tosslib_'+id+'.png'})}
// ticker chip in every ticker
const evs=['four','six','wicket','fifty','hundred','hattrick','freehit','noball','wide','maiden','drs'];let miss=[];const looks=new Set();
for(let f=1;f<=20;f++){for(const e of evs){await p.goto(base+'?scene=anim&id='+f+'_'+e+'&t=3#overlay');await p.waitForTimeout(40);
 const r=await p.evaluate(()=>{const c=document.querySelector('.al-tcc');if(!c)return null;const n=c.querySelector('.al-tcn');return{cls:n.className,img:c.querySelector('.al-cf').style.backgroundImage.replace(/.*coins\//,'').replace(/-heads.*/,''),txt:c.parentElement.innerText.replace(/\n+/g,' ')}});
  if(!r){miss.push(f+'_'+e);continue}if(e==='four')looks.add(r.img+'|'+r.cls.replace(/al-/g,''));if(!/TOSS/.test(r.txt))miss.push('txt '+f+'_'+e)}}
console.log('ticker coin chips: missing',miss.length,'distinct coin looks',looks.size,[...looks].slice(0,9).join(' ; '));ok(miss.length===0,'coin chip in every ticker: '+miss.slice(0,5));ok(looks.size>=9,'coin looks '+looks.size);
await p.goto(base+'?scene=anim&id=3_six&t=3#overlay');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/mod/tk_chip.png'});
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: toss');})();
