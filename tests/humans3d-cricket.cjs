// Plays specific events (six, caught, bowled, run out, wide, runs) in the game scene without errors; screenshots mid-action.
const fs=require('fs');const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),errs=[];
const p0=await b.newPage();await p0.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p0.goto('file://'+process.cwd()+'/app-index.html');await p0.waitForTimeout(400);
const P=JSON.parse(await p0.evaluate(()=>{const m=demoMatch();return JSON.stringify({id:m.id,d:shPack('matches',m)})}));
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();{const mm=/\/vendor\/([\w.]+)$/.exec(u);if(mm)return r.fulfill({contentType:mm[1].endsWith('.glb')?'model/gltf-binary':'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync('public/vendor/'+mm[1])})}if(/\/api\/shared\/matches\//.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,item:{data:P.d}})});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html?scene=ccast&mid='+P.id+'#overlay');await p.waitForTimeout(2500);
await p.waitForFunction('window.shx&&(shx.ready||shx.fail)',null,{timeout:60000});assert(await p.evaluate('shx.ready'),'shx ready');
await p.waitForTimeout(1500);console.log('fps',await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();(function f(){n++;if(performance.now()-t>2000)r(n/2);else requestAnimationFrame(f)})()})));await p.screenshot({path:'/tmp/h3-cricket-idle.png',timeout:90000});
const pr=p.evaluate(()=>{const inn=UI.ccst.m.innings[0];const e={...inn.ev[10],r:4,x:'',ang:{a:.4,d:1}};delete e.w;return shGamePlay({i:0,j:10,e})});await p.waitForTimeout(1900);await p.screenshot({path:'/tmp/h3-cricket-bat.png',timeout:150000});await pr;
const pr2=p.evaluate(()=>{const inn=UI.ccst.m.innings[0];const e={...inn.ev[10],r:0,w:'Bowled',x:''};return shGamePlay({i:0,j:10,e})});await p.waitForTimeout(2600);await p.screenshot({path:'/tmp/h3-cricket-wk.png',timeout:150000});await pr2;
assert.deepEqual(errs,[]);console.log('PASS humans3d cricket');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
