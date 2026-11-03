// Any logo: black/white background removed, SH banner behind it (card, detail, team crest).
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
// black-background logo with a red circle
const c=document.createElement('canvas');c.width=c.height=120;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,120,120);x.fillStyle='#d00';x.beginPath();x.arc(60,60,40,0,7);x.fill();
window.__blk=c.toDataURL('image/png');S.auc=[];UI.view='auction';UI.au.tab='home';render();shDemoAuc();A.auOpen({v:'demo-hcl'});render()});
await p.waitForTimeout(900);
const r=await p.evaluate(async()=>{const n=document.querySelectorAll('img.shlg').length;const u=await shCutLogo(window.__blk);const im=new Image();im.src=u;await im.decode();const c=document.createElement('canvas');c.width=c.height=120;const x=c.getContext('2d');x.drawImage(im,0,0);return{n,corner:x.getImageData(2,2,1,1).data[3],mid:x.getImageData(60,60,1,1).data[3]}});
assert(r.n>=1,'banner class '+JSON.stringify(r));assert(r.corner===0&&r.mid===255,'cut '+JSON.stringify(r));
await p.screenshot({path:'/tmp/logo-banner.png'});
await p.evaluate(()=>{UI.au.tab='home';UI.au.cur=null;render()});await p.waitForTimeout(700);await p.screenshot({path:'/tmp/logo-banner2.png'});
const g=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=c.height=120;const x=c.getContext('2d');x.fillStyle='#2a9d8f';x.fillRect(0,0,120,120);x.fillStyle='#e63946';x.beginPath();x.arc(60,60,36,0,7);x.fill();const u=await shCutLogo(c.toDataURL('image/png'));const im=new Image();im.src=u;await im.decode();const d=document.createElement('canvas');d.width=d.height=120;const y=d.getContext('2d');y.drawImage(im,0,0);return{corner:y.getImageData(2,2,1,1).data[3],mid:y.getImageData(60,60,1,1).data[3]}});
assert(g.corner===0&&g.mid===255,'coloured bg '+JSON.stringify(g));
assert.deepEqual(errs,[]);console.log('PASS logo banner');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
