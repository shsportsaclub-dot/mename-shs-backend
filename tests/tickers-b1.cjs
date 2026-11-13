// Ticker batch 1: 14 situation tickers. Unique look (keyframes, class roots, palettes, svg paths), correct ticker per context, live wiring on the overlay, priority.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'#overlay');await p.waitForTimeout(500);
const U=await p.evaluate(()=>{const ids=shTk.ids,out={n:ids.length,kf:{},pal:{},paths:{},roots:{}};const sample={batter:'A',bowler:'B',runs:2,score1:'1 (1)',how:'c C b B',dotsOver:2,dotsRow:4,sixCtx:'x'};
 ids.forEach(id=>{const t=shTk.T[id];out.kf[id]=(t.css.match(/@keyframes ([\w-]+)/g)||[]).map(x=>x.slice(11));out.pal[id]=[...new Set((t.css+t.html(sample)).match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)||[])].map(x=>x.toLowerCase());out.paths[id]=(t.html(sample).match(/ d="[^"]+"/g)||[]);out.roots[id]=(t.html(sample).match(/^<div class="([^" ]+)/)||[])[1]});return out});
ok(U.n===14,'14 tickers '+U.n);
const all=[].concat(...Object.values(U.kf));ok(new Set(all).size===all.length&&all.length>=14,'keyframe names unique');
ok(new Set(Object.values(U.roots)).size===14,'distinct root classes');
const ids=Object.keys(U.pal);let worst=0,pair='';for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=new Set(U.pal[ids[i]]),c=new Set(U.pal[ids[j]]);const inter=[...a].filter(x=>c.has(x)).length,uni=new Set([...a,...c]).size;const jac=uni?inter/uni:0;if(jac>worst){worst=jac;pair=ids[i]+'/'+ids[j]}}
ok(worst<0.5,'palettes differ (worst '+worst.toFixed(2)+' '+pair+')');
const pv=[].concat(...Object.values(U.paths).map(x=>[...new Set(x)]));ok(new Set(pv).size===pv.length,'svg paths not shared');
// class names namespaced
ok(await p.evaluate(()=>shTk.ids.every(id=>{const h=shTk.T[id].html({batter:'a',bowler:'b',runs:1,score1:'1',how:'x',dotsOver:1,dotsRow:3,sixCtx:'x'});return [...h.matchAll(/class="([^"]+)"/g)].every(m=>m[1].split(/\s+/).every(c=>c.startsWith(id)))})),'classes namespaced');
// context selection
const C=await p.evaluate(()=>{const mk=(evs)=>{const s={inn:{ev:evs.map(e=>Object.assign({r:0,x:'',w:'',bt:'p0',bl:'p12',out:null},e))},k:{bat:{p0:{r:10,b:8}}}};return shTk.ctxOf(null,s,s.inn.ev.length-1)};const r={};
 r.dot=mk([{}]);r.dots3=mk([{},{},{}]);r.single=mk([{r:1}]);r.two=mk([{r:2}]);r.four=mk([{r:4}]);r.four2=mk([{r:4},{r:1},{r:4}]);r.six=mk([{r:6}]);r.six3=mk([{r:6},{r:6},{r:6}]);r.wide=mk([{x:'wd',r:1}]);r.nb=mk([{x:'nb',r:1}]);
 r.bowled=mk([{r:1},{w:'Bowled',out:'p0'}]);r.caught=mk([{w:'Caught',fld:'p5',out:'p0'}]);r.lbw=mk([{w:'LBW',out:'p0'}]);r.ro=mk([{w:'Run out',fld:'p5',out:'p0'}]);
 r.hat=mk([{w:'Bowled',out:'p0'},{w:'Caught',out:'p0'},{w:'LBW',out:'p0'}]);
 const s2={inn:{ev:[{r:0,x:'',w:'Bowled',bt:'p3',bl:'p12',out:'p3'}]},k:{bat:{p3:{r:0,b:1}}}};r.duck=shTk.ctxOf(null,s2,0);return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v&&v.id]))});
const exp={dot:'tk1',dots3:'tk2',single:'tk3',two:'tk3',four:'tk4',four2:'tk5',six:'tk6',six3:'tk6',wide:'tk7',nb:'tk8',bowled:'tk9',caught:'tk10',lbw:'tk11',ro:'tk12',hat:'tk14',duck:'tk13'};
for(const k of Object.keys(exp))ok(C[k]===exp[k],'context '+k+' -> '+C[k]+' expected '+exp[k]);
// live wiring on overlay: a new ball fires its ticker
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'QA'});startInnings(m,0,'p0','p1','p12');m.status='live';S.stream.mid=m.id;S.stream.gfx={rules:{},mode:'auto'};S.stream.tkOff=false;save();render();shTk.tick()});
await p.evaluate(()=>{shTk.reset();ball(S.matches[0],{r:4,x:'',ang:null});save();shTk.tick()});await p.waitForTimeout(300);
ok(await p.evaluate(()=>!!document.querySelector('#shtk .tkw[data-tk=tk4]')),'four ticker fired on overlay');
// priority: a wicket interrupts a boundary ticker; a dot does not interrupt a wicket
await p.evaluate(()=>{ball(S.matches[0],{r:0,x:'',w:'Bowled',out:'p0'});save();shTk.tick()});await p.waitForTimeout(250);
ok(await p.evaluate(()=>!!document.querySelector('#shtk .tkw[data-tk=tk9]')&&document.querySelectorAll('#shtk .tkw').length===1),'wicket replaces four');
// self cleaning + reduced motion css
await p.waitForTimeout(5000);ok(await p.evaluate(()=>document.querySelectorAll('#shtk .tkw').length===0),'ticker removes itself');
ok(await p.evaluate(()=>[...document.querySelectorAll('style')].some(s=>/prefers-reduced-motion/.test(s.textContent)&&/tkw/.test(s.textContent))),'reduced-motion css');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: tickers batch 1');})();
