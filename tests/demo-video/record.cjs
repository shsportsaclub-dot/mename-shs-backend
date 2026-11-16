// Records the vertical demo video. The REAL app runs everywhere: stadium + overlays on top, the real scorer screen below.
// usage: node tests/demo-video/record.cjs [dry] [z=2]   (dry = fast run without video)
const {chromium}=require('playwright'),prep=require('./prep.cjs'),run=require('./driver.cjs');
const DRY=process.argv.includes('dry'),Z=+((process.argv.find(a=>/^z=/.test(a))||'z=2').slice(2)),SP=DRY?0.04:1,sleep=ms=>new Promise(r=>setTimeout(r,ms*SP));
(async()=>{
 const id=await prep('/tmp/claude-0/ec/dm/state.json');
 const b=await chromium.launch(),opt={viewport:{width:Math.round(360*Z),height:Math.round(640*Z)},storageState:'/tmp/claude-0/ec/dm/state.json'};
 if(!DRY)opt.recordVideo={dir:'/tmp/claude-0/ec/dm/vid',size:{width:Math.round(360*Z),height:Math.round(640*Z)}};
 const ctx=await b.newContext(opt),p=await ctx.newPage();ctx.setDefaultTimeout(15000);p.on('pageerror',e=>console.log('ERR',e.message));
 await ctx.route(/onrender\.com|\/api\//,r=>r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
 const t0=Date.now(),log=m=>console.log(((Date.now()-t0)/1000).toFixed(0)+'s',m);
 await p.goto('http://localhost:8765/demo-harness.html?z='+Z+'&mid='+id);await sleep(3500);
 const sc=p.frames().find(f=>/demoscorer/.test(f.url()));
 await sc.evaluate(id=>{UI.stage='app';A.scoreIt({id});const st=document.createElement('style');st.textContent='.hnav,.bnav,.fabfloat,header,.hdr,.top{display:none!important}';document.head.appendChild(st)},id);
 await sleep(1500);await sleep(4000);await p.evaluate(()=>H.title(false));
 await p.evaluate(()=>H.cap('TOSS: Australia won the toss and chose to bat. All graphics come from the live match data.',7000));await sleep(8000);
 let big=false;
 const H={sleep,
  cap:t=>p.evaluate(t=>H.cap(t,4000),t),
  big:async on=>{big=on;await p.evaluate(on=>H.big(on),on)},
  tap:async(loc,label,alt)=>{
   if(alt!=='sheet'){await loc.evaluate(e=>{e.scrollIntoView({block:'start'});window.scrollBy(0,-6)});await sleep(350)}
   else await loc.evaluate(e=>e.scrollIntoView({block:'center'}));
   const r=await loc.evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}});
   await p.evaluate(([x,y,l])=>{H.tapAt(x,y);H.chip(l)},[r.x,r.y+(big?0:372),label]);await sleep(550);await p.evaluate(()=>setTimeout(()=>H.chip(''),900))}};
 await run(sc,H,log);
 await sleep(8000);
 await p.screenshot({path:'/tmp/claude-0/ec/dm/end.png'});
 const v=p.video&&p.video();await ctx.close();await b.close();if(v)console.log('video',await v.path());
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
