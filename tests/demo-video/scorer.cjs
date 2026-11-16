// Run 1: the REAL scorer screen, driven by real taps. Records video + a timeline (events, captions, wicket windows) used by the other run.
// output: /tmp/claude-0/ec/dm/scorer/*.webm and timeline.json
const {chromium}=require('playwright'),prep=require('./prep.cjs'),run=require('./driver.cjs'),fs=require('fs');
const FAST=process.argv.includes('fast'),Z=1.5,OUT='/tmp/claude-0/ec/dm/scorer';
(async()=>{
 fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
 const id=await prep('/tmp/claude-0/ec/dm/state.json');
 const b=await chromium.launch(),opt={viewport:{width:540,height:960},deviceScaleFactor:1,storageState:'/tmp/claude-0/ec/dm/state.json'};
 if(!FAST)opt.recordVideo={dir:OUT,size:{width:540,height:960}};
 const ctx=await b.newContext(opt),p=await ctx.newPage();ctx.setDefaultTimeout(15000);p.on('pageerror',e=>console.log('ERR',e.message));
 await ctx.route(/onrender\.com|\/api\//,r=>r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
 const tp=Date.now(),now=()=>(Date.now()-tp)/1000;
 await p.goto('http://localhost:8765/');await p.waitForTimeout(800);
 await p.evaluate(id=>{UI.stage='app';A.scoreIt({id});const st=document.createElement('style');st.textContent='.hnav,.bnav,.fabfloat,header,.hdr,.top{display:none!important}#tap{position:fixed;z-index:99999;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:3px solid #ffd24a;background:#ffd24a44;box-shadow:0 0 12px #ffd24a;opacity:0;pointer-events:none}#tap.on{opacity:1;animation:tp .5s ease-out}@keyframes tp{0%{transform:scale(1.9);opacity:.2}100%{transform:scale(1);opacity:1}}#chip{position:fixed;z-index:99999;right:6px;top:6px;font:900 13px Arial;color:#0b1530;background:#ffd24a;border-radius:5px;padding:3px 9px;opacity:0}#chip.on{opacity:1}';document.head.appendChild(st);
  const t=document.createElement('div');t.id='tap';document.body.appendChild(t);const c=document.createElement('div');c.id='chip';document.body.appendChild(c);
  window.__ring=(x,y,l)=>{t.style.left=x+'px';t.style.top=y+'px';t.classList.remove('on');void t.offsetWidth;t.classList.add('on');c.textContent=l||'';c.classList.toggle('on',!!l);setTimeout(()=>{t.classList.remove('on');c.classList.remove('on')},1300)}},id);
 await p.waitForTimeout(1500);
 const TL={m0:null,balls:[],caps:[],wk:[],fps:Z};
 const sleep=ms=>new Promise(r=>setTimeout(r,FAST?ms*.04:ms));
 await sleep(1000);TL.m0=now();
 let last=0;
 const H={sleep,
  cap:async t=>{TL.caps.push({t:now()-TL.m0,text:t})},
  big:async on=>{TL.wk.push({t:now()-TL.m0,on})},
  tap:async(loc,label)=>{await loc.evaluate(e=>{e.scrollIntoView({block:'start',behavior:'instant'});window.scrollBy({top:-6,behavior:'instant'})});await sleep(300);
   const r=await loc.evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}});
   await p.evaluate(([x,y,l])=>__ring(x,y,l),[r.x,r.y,label]);await sleep(550);if(process.env.SHOT&&!H.shot){H.shot=1;await p.screenshot({path:'/tmp/claude-0/ec/dm/ring.png'})}}};
 // record the event count after every ball
 const st=()=>p.evaluate(()=>{const m=S.matches.find(x=>x.demo===3);return {s:m.status,c:m.cur,n:m.innings.map(i=>i.ev.length),m:JSON.stringify(m)}});
 const poll=setInterval(async()=>{try{const s=await st();const k=s.m;if(k!==last){last=k;TL.balls.push({t:now()-TL.m0,s:s.s,n:s.n,m:s.m})}}catch(e){}},100);
 await run(p,H,m=>console.log(((now()-TL.m0)).toFixed(0)+'s',m));
 await sleep(6000);clearInterval(poll);TL.end=now()-TL.m0;
 TL.match=await p.evaluate(()=>JSON.parse(JSON.stringify(S.matches.find(x=>x.demo===3))));
 fs.writeFileSync(OUT+'/timeline.json',JSON.stringify(TL));
 const v=p.video&&p.video();await ctx.close();await b.close();if(v)console.log('video',await v.path());console.log('timeline',TL.balls.length,'changes; end',TL.end.toFixed(0)+'s');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
