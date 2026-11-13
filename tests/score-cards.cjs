// Score card package: 12 distinct score-bar styles, stats board, result scorecard, selection, live data.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=card#overlay');await p.waitForTimeout(400);
const U=await p.evaluate(()=>{const ids=shSk.ids,o={n:ids.length,kf:{},pal:{},roots:{},ns:true,bad:[]};ids.forEach(id=>{const t=shSk.D[id],h=t.html(shSk.SAMPLE);o.kf[id]=(t.css.match(/@keyframes ([\w-]+)/g)||[]).map(x=>x.slice(11));o.pal[id]=[...new Set((t.css+h).match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)||[])].map(x=>x.toLowerCase());o.roots[id]=(h.match(/^<div class="([^" ]+)/)||[])[1];if(![...h.matchAll(/class="([^"]+)"/g)].every(m=>m[1].split(/\s+/).every(c=>c.startsWith(id))))o.ns=false;if(/undefined|NaN|\[object/.test(h))o.bad.push(id);if(!/Hapur Lions/i.test(h)||!/168\/4/.test(h))o.bad.push(id+':data')});return o});
ok(U.n===12,'12 styles '+U.n);ok(U.ns,'classes namespaced');ok(!U.bad.length,'sample html ok '+U.bad);
const kfs=[].concat(...Object.values(U.kf));ok(new Set(kfs).size===kfs.length,'keyframes unique');ok(new Set(Object.values(U.roots)).size===12,'distinct roots');
const ids=Object.keys(U.pal);let worst=0,pair='';for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=new Set(U.pal[ids[i]]),c=new Set(U.pal[ids[j]]);const inter=[...a].filter(x=>c.has(x)).length,uni=new Set([...a,...c]).size,jac=uni?inter/uni:0;if(jac>worst){worst=jac;pair=ids[i]+'/'+ids[j]}}
ok(worst<0.5,'palettes differ (worst '+worst.toFixed(2)+' '+pair+')');
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Hapur Lions',short:'HAP',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Asoda Warriors',short:'ASO',color:'#dc2626',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'H'});m.name='HT-20C';window.__bl=o=>{const m=S.matches[0],inn=m.innings[m.cur];if(!inn.cur.bl)inn.cur.bl='p'+(11+(Math.floor(inn.lg/6)%3));ball(m,o)};startInnings(m,0,'p0','p1','p11');m.status='live';[1,4,0,6,1,0,2].forEach(r=>__bl({r}));S.stream.mid=m.id;save()});
for(let i=1;i<=12;i++){await p.goto(base+'?scene=card&style=sk'+i+'#overlay');await p.waitForTimeout(700);const r=await p.evaluate(()=>{const w=document.querySelector('.skw');if(!w)return null;const r=w.getBoundingClientRect();return{w:r.width,h:r.height,t:w.innerText.toUpperCase(),an:document.getAnimations().length}});ok(r&&r.w>400&&r.h>40&&/HAPUR LIONS|HAPUR/.test(r.t)&&/14\/0/.test(r.t),'sk'+i+' live '+JSON.stringify(r&&r.t.replace(/\n/g,' ')));ok(r&&r.an>=1,'sk'+i+' animates')}
// stats and result
await p.goto(base+'?scene=stats#overlay');await p.waitForTimeout(2200);let t=await p.evaluate(()=>document.body.innerText.toUpperCase());for(const w of ['MATCH STATS','RUN RATE','FOURS','SIXES','EXTRAS','DOT BALLS','HIGHEST PARTNERSHIP','14/0'])ok(t.includes(w),'stats '+w);
await p.evaluate(()=>{S.matches[0].status='done';S.matches[0].result='Hapur Lions won by 4 wickets';save()});
await p.goto(base+'?scene=resultcard#overlay');await p.waitForTimeout(1800);t=await p.evaluate(()=>document.body.innerText.toUpperCase());ok(t.includes('HAPUR LIONS V ASODA WARRIORS')&&t.includes('WON BY 4 WICKETS')&&/14/.test(t),'result card text');
// selection persists and drives the default scene
await p.goto(base+'#overlay');await p.waitForTimeout(300);await p.evaluate(()=>{A.skStyle({v:'sk7'})});ok(await p.evaluate(()=>S.stream.cardStyle==='sk7'),'style selected');
await p.goto(base+'?scene=card#overlay');await p.waitForTimeout(600);ok(await p.evaluate(()=>!!document.querySelector('.sk7')),'default scene uses selected style');
// stream UI lists styles
await p.goto(base);await p.waitForTimeout(300);ok(await p.evaluate(()=>{window.pullLive=async()=>{};UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='stream';render();return /Score card styles \(12\)/.test(document.body.innerHTML)}),'Stream tab shows 12 style previews');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: score cards');})();
