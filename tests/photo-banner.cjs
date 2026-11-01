// Person photo with cut-out gets the SH banner composed behind (stubbed segmentation).
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=OW=480;c.height=600;const x=c.getContext('2d');x.fillStyle='#e63946';x.fillRect(190,150,100,300);
const out=await shBannerCompose({cut:c.toDataURL('image/png'),photo:'x'});const im=new Image();im.src=out;await im.decode();const d=document.createElement('canvas');d.width=480;d.height=600;const y=d.getContext('2d');y.drawImage(im,0,0);
const a=y.getImageData(10,10,1,1).data,m=y.getImageData(240,300,1,1).data;return{corner:[...a],mid:[...m]}});
assert(r.corner[2]>r.corner[0]&&r.corner[2]<90,'banner corner '+r.corner);assert(r.mid[0]>180,'person '+r.mid);
assert.deepEqual(errs,[]);console.log('PASS photo banner');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
