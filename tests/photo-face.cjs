// Photo pipeline: face centred (4:5), cut-out PNG with SH backdrop in the profile hero, guess fallback keeps working offline.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const R=await p.evaluate(async()=>{
 const mkFile=()=>new Promise(res=>{const c=document.createElement('canvas');c.width=600;c.height=800;const x=c.getContext('2d');x.fillStyle='#223';x.fillRect(0,0,600,800);x.fillStyle='#fc8';x.beginPath();x.arc(470,220,60,0,7);x.fill();x.fillRect(400,290,140,510);c.toBlob(b=>res(new File([b],'p.png',{type:'image/png'})),'image/png')});
 const centroid=async(u)=>{const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let sx=0,sy=0,n=0;for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){const i=(y*c.width+xx)*4;if(d[i]>200&&d[i+1]>150&&d[i+2]<190&&d[i+3]>200){sx+=xx;sy+=y;n++}}return {cx:sx/n/c.width,cy:sy/n/c.height,w:im.width,h:im.height,n}};
 // stub the on-phone segmentation: mask = the person shape (head circle + body)
 window.shSegmentMask=async src=>{const s=src.width/600,m=document.createElement('canvas');m.width=src.width;m.height=src.height;const x=m.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,m.width,m.height);x.fillStyle='#fff';x.beginPath();x.arc(470*s,220*s,60*s,0,7);x.fill();x.fillRect(400*s,290*s,140*s,510*s);return m};
 const f=await mkFile(),a=await shPrepPhoto(f),ph=await centroid(a.photo),ct=a.cut?await centroid(a.cut):null;
 window.shSegmentMask=async()=>{throw new Error('offline')};const g=await shPrepPhoto(f);
 return {face:a.face,ph,hasCut:!!a.cut,ct,guess:g.face,gPhoto:!!g.photo}});
assert.equal(R.face,'mask');assert(R.ph.w===480&&R.ph.h===600,'size');assert(Math.abs(R.ph.cx-0.5)<0.06,'photo face centred '+R.ph.cx);assert(R.hasCut&&R.ct&&Math.abs(R.ct.cx-0.5)<0.06,'cut centred '+JSON.stringify(R.ct));assert.equal(R.guess,'guess');assert(R.gPhoto);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Player',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};const pl=newPlayer(S.user);S.user.pid=pl.id;pl.name='Hemanth';const c=document.createElement('canvas');c.width=40;c.height=50;pl.cut=c.toDataURL('image/png');UI.pp={id:pl.id,tab:'matches',sk:'bat'};UI.view='pp';render()});
assert(await p.$('.pph .shbk'),'backdrop behind cut-out');assert.equal(await p.evaluate(()=>getComputedStyle(document.body,'::before').display),'none');
// existing plain photo gets upgraded automatically when the profile is opened
await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const x=c.getContext('2d');x.fillStyle='#223';x.fillRect(0,0,600,800);x.fillStyle='#fc8';x.beginPath();x.arc(470,220,60,0,7);x.fill();x.fillRect(400,290,140,510);
 window.shSegmentMask=async src=>{const s=src.width/600,m=document.createElement('canvas');m.width=src.width;m.height=src.height;const q=m.getContext('2d');q.fillStyle='#000';q.fillRect(0,0,m.width,m.height);q.fillStyle='#fff';q.beginPath();q.arc(470*s,220*s,60*s,0,7);q.fill();q.fillRect(400*s,290*s,140*s,510*s);return m};
 const pl=P(S.user.pid);pl.cut='';pl.cutTry=0;pl.photo=c.toDataURL('image/jpeg',.9);render()});
await p.waitForFunction(()=>{const pl=P(S.user.pid);return pl&&pl.cut},null,{timeout:8000});assert(await p.$('.pph .shbk'),'upgraded photo shows banner');
assert.deepEqual(errs,[]);console.log('PASS photo face');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
