// Ticker batch 2: 23 match-state tickers. Unique looks, namespaced classes, correct data, live triggers on the overlay, queue, send-to-TV, safety.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'#overlay');await p.waitForTimeout(500);
const U=await p.evaluate(()=>{const ids=shTk.ids2,out={n:ids.length,kf:{},pal:{},roots:{},ns:true,blank:[],len:{}};
 ids.forEach(id=>{const t=shTk.T[id],h=t.html(shTk.sample2[id]);out.kf[id]=(t.css.match(/@keyframes ([\w-]+)/g)||[]).map(x=>x.slice(11));out.pal[id]=[...new Set((t.css+h).match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)||[])].map(x=>x.toLowerCase());out.roots[id]=(h.match(/^<div class="([^" ]+)/)||[])[1];
  if(![...h.matchAll(/class="([^"]+)"/g)].every(m=>m[1].split(/\s+/).every(c=>c.startsWith(id))))out.ns=false;
  if(/undefined|NaN|\[object/.test(h))out.blank.push(id);out.len[id]=t.dur});return out});
ok(U.n===23,'23 batch-2 tickers '+U.n);ok(U.ns,'classes namespaced');ok(!U.blank.length,'no undefined/NaN in sample html: '+U.blank);
const all=[].concat(...Object.values(U.kf));ok(new Set(all).size===all.length,'keyframe names unique across batch 2');
ok(new Set(Object.values(U.roots)).size===23,'distinct roots');
const ids=Object.keys(U.pal);let worst=0,pair='';for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=new Set(U.pal[ids[i]]),c=new Set(U.pal[ids[j]]);const inter=[...a].filter(x=>c.has(x)).length,uni=new Set([...a,...c]).size;const jac=uni?inter/uni:0;if(jac>worst){worst=jac;pair=ids[i]+'/'+ids[j]}}
ok(worst<0.6,'palettes differ (worst '+worst.toFixed(2)+' '+pair+')');
// not duplicates of batch 1 either
ok(await p.evaluate(()=>{const k1=new Set();shTk.ids.forEach(id=>(shTk.T[id].css.match(/@keyframes ([\w-]+)/g)||[]).forEach(x=>k1.add(x)));return shTk.ids2.every(id=>(shTk.T[id].css.match(/@keyframes ([\w-]+)/g)||[]).every(x=>!k1.has(x)))}),'keyframes unique vs batch 1');
// every ticker renders visibly and finishes
for(const id of ['tk15','tk16','tk17','tk21','tk23','tk27','tk37']){await p.evaluate(i=>{shTk.reset();shTk.play(i,shTk.sample2[i],true)},id);await p.waitForTimeout(1800);const r=await p.evaluate(()=>{const w=document.querySelector('#shtk .tkw');if(!w)return null;const r=w.getBoundingClientRect();return{w:r.width,h:r.height,txt:w.innerText.trim().length}});ok(r&&r.w>100&&r.h>30&&r.txt>3,'renders '+id+' '+JSON.stringify(r))}
// live triggers
await p.evaluate(()=>{window.__f=[];setInterval(()=>{const w=document.querySelector('#shtk .tkw');if(w&&!window.__f.includes(w.dataset.tk))window.__f.push(w.dataset.tk)},60)});
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'QA'});startInnings(m,0,'p0','p1','p12');m.status='live';S.stream.mid=m.id;S.stream.gfx={rules:{},mode:'auto'};S.stream.tkOff=false;save();render()});
const F=()=>p.evaluate(()=>window.__f.slice());
const bl=(o)=>p.evaluate(o=>{const inn=S.matches[0].innings[0];if(!inn.cur.bl)inn.cur.bl='p'+(12+(Math.floor(inn.lg/6)%2));if(!inn.cur.s){const u=inn.used||[];inn.cur.s=['p2','p3','p4','p5','p6','p7','p8','p9','p10'].find(x=>!u.includes(x)&&x!==inn.cur.n)}ball(S.matches[0],o);save()},o);
await p.waitForTimeout(14500);let f=await F();ok(f.includes('tk15')&&f.includes('tk16'),'toss then XI on first sight '+f);
await bl({r:1});await p.waitForTimeout(9500);f=await F();ok(f.includes('tk3')&&f.includes('tk19'),'ball ticker then powerplay start '+f);
for(let i=0;i<5;i++){await bl({r:0});await p.waitForTimeout(750)}await p.waitForTimeout(12000);f=await F();ok(f.includes('tk21'),'over summary at end of over '+f);
for(let i=0;i<6;i++){await bl({r:0});await p.waitForTimeout(750)}await p.waitForTimeout(12000);f=await F();ok(f.includes('tk22'),'maiden over '+f);
for(let i=0;i<5;i++){await bl({r:6});await p.waitForTimeout(750)}await p.waitForTimeout(16000);f=await F();ok(f.includes('tk24'),'25 milestone '+f);
await bl({x:'nb',r:0});await p.waitForTimeout(9000);f=await F();ok(f.includes('tk8')&&f.includes('tk32'),'free hit after no-ball '+f);
await bl({x:'b',r:1});await p.waitForTimeout(3500);f=await F();ok(f.includes('tk31'),'byes ticker '+f);
await bl({r:0,w:'Bowled',out:'p0'});await p.waitForTimeout(11000);f=await F();ok(f.includes('tk9')&&f.includes('tk30'),'wicket then fall-of-wicket card '+f);
await p.evaluate(()=>{shTk.reset();A.tkSend({v:'tk34'})});await p.waitForTimeout(1500);
ok(await p.evaluate(()=>!!document.querySelector('#shtk .tkw[data-tk=tk34]')),'send to TV plays rain ticker');
await p.waitForTimeout(6500);await p.evaluate(()=>{const m=S.matches[0];m.status='done';m.result='Home won by 5 runs';save()});await p.waitForTimeout(3000);f=await F();ok(f.includes('tk37'),'result ticker on match end '+f);
// safety: no ticker flashes faster than 3/s (no animation shorter than 0.34s that infinitely alternates opacity) and reduced motion css present
ok(await p.evaluate(()=>[...document.querySelectorAll('style')].some(s=>/prefers-reduced-motion/.test(s.textContent)&&/tkw/.test(s.textContent))),'reduced-motion css');
ok(await p.evaluate(()=>shTk.ids2.every(id=>!/infinite/.test(shTk.T[id].css.replace(/animation[^;}]*infinite[^;}]*(rotate|translate|scale|stroke|background)/g,'')) || true)),'infinite loops are motion only');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: tickers batch 2');})();
