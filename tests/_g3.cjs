const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text().slice(0,200))});
await p.route('**/vendor/*',r=>{const m=/\/vendor\/([\w.]+)$/.exec(r.request().url());r.fulfill({contentType:m[1].endsWith('.glb')?'model/gltf-binary':'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(path.resolve(__dirname,'../public/vendor/'+m[1]))})});
await p.route('**/*',r=>/vendor/.test(r.request().url())||r.request().url().startsWith('file:')?r.fallback():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+path.resolve(__dirname,'../app-index.html')+'#overlay');await p.waitForTimeout(600);
const cases=[['4',0,'spin'],['6',2,'zoom'],['100',1,'slam'],['WICKET',3,'flip']];
for(const [text,theme,anim] of cases){
 await p.evaluate(async([text,theme,anim])=>{document.getElementById('h3')&&document.getElementById('h3').remove();const h=document.createElement('div');h.id='h3';h.style.cssText='position:fixed;inset:0;background:linear-gradient(135deg,#2f5d3a,#1f3d28);z-index:999999';document.body.appendChild(h);const u=apiBase()+'/vendor/';const T=await import(u+'three.module.js'),M=await import(u+'shfx3d.js');window.__p=M.play(T,h,{text,theme,anim,dur:4.2});await new Promise(r=>setTimeout(r,2300))},[text,theme,anim]);
 await p.screenshot({path:'/tmp/g3-'+text+'.png'});await p.waitForTimeout(2600);}
console.log(JSON.stringify(errs.slice(0,6)));await b.close()})();
