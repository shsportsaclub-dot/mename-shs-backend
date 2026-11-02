// Real 3D humans: WebGL layer loads the animated model and draws it in the cricket and sports scenes.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
const MIME=f=>f.endsWith('.glb')?'model/gltf-binary':'text/javascript';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),errs=[];
const route=async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();const m=/\/vendor\/([\w.]+)$/.exec(u);if(m)return r.fulfill({contentType:MIME(m[1]),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync('public/vendor/'+m[1])});return null};
// sports
let p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(/shx/.test(m.text()))console.log(m.text())});
await p.route('**/*',async r=>{if(await route(r)!==null)return;const u=r.request().url();if(/\/api\/shared\/sports\//.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,item:{data:{m:{id:'x1',sport:process.env.SP||'football',tn:['Red Hawks','Blue Lions'],ev:[],pts:[],log:[],st:'live'},teams:[],players:[]}}})});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html?scene=sgame&mid=x1#overlay');
await p.waitForFunction('window.shx&&(shx.ready||shx.fail)',null,{timeout:60000});assert(await p.evaluate('shx.ready&&!shx.fail'),'shx ready');
await p.waitForTimeout(3500);await p.screenshot({path:'/tmp/h3-football.png'});
assert(await p.evaluate(()=>{const c=document.getElementById('shx3');return !!c&&c.parentNode&&c.width===1280}),'3d canvas in scene');
assert.deepEqual(errs,[]);console.log('PASS humans3d sports');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
