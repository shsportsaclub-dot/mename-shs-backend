// Segmentation mask keeps only the biggest person, drops people behind.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.shSegmentMask=window.shSegmentMask;return 1});
// rebuild wrapper over a fake base mask: big blob + small blob
const out=await p.evaluate(async()=>{const mk=()=>{const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,200,200);x.fillStyle='#fff';x.fillRect(40,60,110,140);x.fillRect(170,20,20,40);return c};
// emulate wrapper by loading source text of block 135 against a stub
const src=[...document.scripts].map(s=>s.textContent).join('\n');const i=src.indexOf('/* 135');const code=src.slice(i);window.shSegmentMask=async()=>mk();eval(code);const m=await window.shSegmentMask({});const d=m.getContext('2d');return{big:d.getImageData(100,120,1,1).data[0],small:d.getImageData(180,40,1,1).data[0]}});
assert(out.big>200&&out.small===0,JSON.stringify(out));assert.deepEqual(errs,[]);console.log('PASS main person only');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
