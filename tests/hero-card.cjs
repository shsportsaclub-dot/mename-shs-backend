// Hero card: photo -> cut-out (segmenter stubbed here) -> 1080x1350 card with only real profile facts; fallback keeps the plain photo when the remover cannot run.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:430,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';UI.sportInit=1;S.tok='t';S.players=[{id:'p1',name:'Hemasundar',role:'AR',jersey:'7',team:null}];S.user={id:'u',name:'Hema',phone:'1',role:'viewer',pid:'p1'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});UI.view='profile';render()});
await p.waitForTimeout(300);
ok(await p.evaluate(()=>/Make my Hero Card/.test(document.getElementById('app').innerText)),'profile shows the Hero Card button');
// a fake person photo: head + shoulders on a green wall
const png=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const x=c.getContext('2d');x.fillStyle='#2e8b57';x.fillRect(0,0,600,800);x.fillStyle='#f1c27d';x.beginPath();x.arc(300,260,110,0,7);x.fill();x.fillStyle='#d6242f';x.beginPath();x.ellipse(300,640,230,230,0,Math.PI,0);x.fill();x.fillRect(70,640,460,160);return c.toDataURL('image/png').split(',')[1]});
await p.evaluate(()=>{window.shSegmentMask=async src=>{const m=document.createElement('canvas');m.width=src.width;m.height=src.height;const x=m.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,m.width,m.height);x.fillStyle='#fff';const k=m.width/600;x.beginPath();x.arc(300*k,260*k,110*k,0,7);x.fill();x.beginPath();x.ellipse(300*k,640*k,230*k,230*k,0,Math.PI,0);x.fill();x.fillRect(70*k,640*k,460*k,160*k);return m}});
await p.evaluate(()=>window.shHeroCardOpen());await p.screenshot({path:'/tmp/hc0.png'});
await p.setInputFiles('#hcf2',{name:'me.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
await p.waitForFunction(()=>!document.getElementById('hcsave').disabled,{timeout:8000});
const r=await p.evaluate(async()=>{const cut=window.__c;return {msg:document.getElementById('hcs').textContent}});
ok(/Done/.test(r.msg),'cut-out finished: '+r.msg);
await p.screenshot({path:'/tmp/hc.png'});
await p.click('#hcsave');await p.waitForTimeout(300);
ok(await p.evaluate(()=>/^data:image\//.test(P('p1').cut||'')),'cut-out saved on the profile');
// the stored cut-out has transparent corners
const tr=await p.evaluate(async()=>{const i=new Image();i.src=P('p1').cut;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);return x.getImageData(1,1,1,1).data[3]});
ok(tr<30,'background removed (corner alpha '+tr+')');
// remover failing -> plain photo fallback
await p.evaluate(()=>{window.shSegmentMask=async()=>{throw new Error('offline')};P('p1').cut=null;window.shHeroCardOpen()});
await p.setInputFiles('#hcf2',{name:'me.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
await p.waitForFunction(()=>!document.getElementById('hcsave').disabled,{timeout:8000});
ok(await p.evaluate(()=>/could not run/.test(document.getElementById('hcs').textContent)),'fallback message');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: hero card');})();
