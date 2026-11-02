// Key events produce a poster and a reel clip; the 3D Live player lists them.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),errs=[];
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();const m=/\/vendor\/([\w.]+)$/.exec(u);if(m)return r.fulfill({contentType:m[1].endsWith('.glb')?'model/gltf-binary':'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync('public/vendor/'+m[1])});
 if(/\/api\/shared\/sports\//.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,item:{data:{m:{id:'x1',sport:'tennis',tn:['Red Hawks','Blue Lions'],ev:[],pts:[],log:[],st:'live'},teams:[],players:[]}}})});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.addInitScript(()=>{window.__pref=1});await p.goto('file://'+process.cwd()+'/app-index.html?scene=sgame&mid=x1#overlay');await p.waitForFunction('window.shx&&(shx.ready||shx.fail)',null,{timeout:60000});await p.waitForTimeout(1500);
await p.evaluate(()=>{shMoment.pref=['video/webm;codecs=vp9','video/webm']});
await p.evaluate(()=>window.shSgPlay({side:0,word:'POINT!',big:true,text:'Point to Red Hawks. 1 - 0.'}));
await p.waitForFunction('shMoment.q.length>0',null,{timeout:120000});
const r=await p.evaluate(()=>{const m=shMoment.q[0];return{w:m.word,pl:m.poster.length,v:m.video?m.video.size:0,mime:m.mime}});
assert(r.pl>5000,'poster '+JSON.stringify(r));console.log(JSON.stringify(r));
// parent list
const p2=await b.newPage({viewport:{width:420,height:860}});p2.on('pageerror',e=>errs.push(e.message));await p2.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p2.goto('file://'+process.cwd()+'/app-index.html');await p2.waitForTimeout(500);
const ok=await p2.evaluate(async()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};const m=demoMatch();m.status='live';A.live3d({id:m.id});
 window.dispatchEvent(new MessageEvent('message',{data:{shMoment:{id:'mq1',word:'SIX!',sub:'Test',poster:'data:image/jpeg;base64,/9j/4AAQ',mime:'',video:null}},origin:location.origin}));return document.getElementById('momx')&&/SIX!/.test(document.getElementById('momx').innerText)&&/Share poster/.test(document.getElementById('momx').innerText)});
assert(ok,'moments strip lists the poster');
assert.deepEqual(errs,[]);console.log('PASS moments');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
