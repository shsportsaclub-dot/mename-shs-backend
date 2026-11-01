// Animated commentary stream: reads a published match, animates new balls with commentary.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];
const p0=await b.newPage();await p0.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p0.goto('file://'+process.cwd()+'/app-index.html');await p0.waitForTimeout(400);
const pack=await p0.evaluate(()=>{const m=demoMatch();return JSON.stringify({id:m.id,d:shPack('matches',m),n:m.innings.reduce((a,x)=>a+x.ev.length,0)})});const P=JSON.parse(pack);
let cut=P.n-4;const body=()=>{const d=JSON.parse(JSON.stringify(P.d));let left=cut;d.m.innings.forEach(inn=>{const k=Math.min(inn.ev.length,Math.max(0,left));inn.ev=inn.ev.slice(0,k);left-=k});return JSON.stringify({ok:true,item:{data:d}})};
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(/\/api\/shared\/matches\//.test(u))return r.fulfill({contentType:'application/json',body:body()});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html?scene=ccast&mid='+P.id+'#overlay');await p.waitForTimeout(3200);
let t=await p.evaluate(()=>document.body.innerText);assert(/ov/.test(t)&&/BATTING/.test(t)&&/BOWLING/.test(t),'initial '+t.slice(0,200));
await p.screenshot({path:'/tmp/ccast1.png'});
cut=P.n-1;await p.waitForTimeout(3200);await p.screenshot({path:'/tmp/ccast3.png'});// 3 new balls arrive
await p.screenshot({path:'/tmp/ccast2.png'});
const played=await p.evaluate(()=>({q:UI.ccst.queue.length,pl:UI.ccst.playing,shown:UI.ccst.shown,txt:document.getElementById('cct').textContent}));
assert(played.shown===P.n-1&&played.txt.length>5,'new balls '+JSON.stringify(played));
assert.deepEqual(errs,[]);console.log('PASS commentary stream',JSON.stringify(played));await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
