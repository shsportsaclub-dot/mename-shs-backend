// OBS 3D scene with mid=auto: picks the live match by itself (ignores finished ones), switches when the live match changes.
const fs=require('fs');const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),errs=[];
const p0=await b.newPage();await p0.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p0.goto('file://'+process.cwd()+'/app-index.html');await p0.waitForTimeout(400);
const P=JSON.parse(await p0.evaluate(()=>{const m=demoMatch();return JSON.stringify({id:m.id,d:shPack('matches',m)})}));
const mk=(id,st,u)=>{const d=JSON.parse(JSON.stringify(P.d));d.m.id=id;d.m.status=st;return{id,updated:u,data:d}};
let live=[mk('done1','done',9),mk('liveA','live',5)];const hits=[];
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();const mm=/\/vendor\/([\w.]+)$/.exec(u);if(mm)return r.fulfill({contentType:mm[1].endsWith('.glb')?'model/gltf-binary':'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync('public/vendor/'+mm[1])});
 let x=/\/api\/shared\/matches\/([\w-]+)/.exec(u);if(x){hits.push(x[1]);const it=live.find(i=>i.id===x[1]);return r.fulfill({contentType:'application/json',body:JSON.stringify(it?{ok:true,item:it}:{ok:false})})}
 if(/\/api\/shared\/matches(\?|$)/.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,items:live})});
 return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html?scene=ccast&mid=auto#overlay');
await p.waitForFunction(()=>UI.ccst&&UI.ccst.id==='liveA',null,{timeout:30000});console.log('picked liveA, ignored finished');
live=[mk('done1','done',9),mk('liveB','live',20),mk('liveA','live',5)];
await p.evaluate(()=>{UI.ccst.rt=0});
await p.waitForFunction(()=>UI.ccst.id==='liveA'||UI.ccst.id==='liveB',null,{timeout:10000});
assert.equal(await p.evaluate(()=>UI.ccst.id),'liveA','stays on current live match while it is live');
live=[mk('done1','done',9),mk('liveA','done',30),mk('liveB','live',20)];
await p.evaluate(()=>{UI.ccst.rt=0});
await p.waitForFunction(()=>UI.ccst.id==='liveB',null,{timeout:30000});console.log('switched to liveB when liveA ended');
assert.deepEqual(errs,[]);console.log('PASS ccast auto');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
