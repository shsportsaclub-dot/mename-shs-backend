// Universal sports game scene: every sport renders its own venue, runs idle play, and plays a scoring scene without errors.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];
const sports=['football','basketball','rugby','kabaddi','vb','vbb','bd','tennis','tt','pb'];
for(const sp of sports){
 const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(sp+': '+e.message+' '+(e.stack||'').split('\n')[1]));
 let n=0;
 await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();
  if(/\/api\/shared\/sports\//.test(u)){n++;const m={id:'x1',sport:sp,tn:['Red Hawks','Blue Lions'],ev:[],pts:[],log:[],st:'live'};
   if(sp==='football'&&n>2)m.ev=[{ty:'goal',tm:0,pl:'Ravi',min:12}];
   if(sp==='tennis'&&n>2)m.pts=[{w:0},{w:0}];
   if((sp==='vb'||sp==='vbb'||sp==='bd'||sp==='tt'||sp==='pb')&&n>2)m.log=[{w:1},{w:1}];
   if(sp==='basketball'&&n>2)m.log=[{ty:'fg3',tm:0,v:3}];
   return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,item:{data:{m,teams:[],players:[]}}})})}
  return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
 await p.goto('file://'+process.cwd()+'/app-index.html?scene=sgame&mid=x1#overlay');await p.waitForTimeout(2600);
 assert(await p.$('#sgc'),sp+' canvas');
 // force a scene directly
 await p.evaluate(()=>window.shSgPlay({side:0,word:'POINT!',big:true,text:'Test'}));
 await p.screenshot({path:'/tmp/sg-'+sp+'.png'});
 const px=await p.evaluate(()=>{const c=document.getElementById('sgc'),d=c.getContext('2d').getImageData(640,500,1,1).data;return[d[0],d[1],d[2]]});
 assert(px[0]+px[1]+px[2]>0,sp+' painted');
 await p.close();}
assert.deepEqual(errs,[]);console.log('PASS sports game',sports.length);await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
