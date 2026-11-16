// Run 2: the broadcast (3D stadium + overlays + tickers) fed by the SAME match data, revealed ball by ball at the times the scorer tapped.
// needs /tmp/claude-0/ec/dm/scorer/timeline.json from scorer.cjs. output: /tmp/claude-0/ec/dm/bc/*.webm and bc.json
const {chromium}=require('playwright'),fs=require('fs');
const Z=2,OUT='/tmp/claude-0/ec/dm/bc',TL=JSON.parse(fs.readFileSync('/tmp/claude-0/ec/dm/scorer/timeline.json','utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
 const mid=TL.match.id;
 const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:360*Z,height:372*Z},storageState:'/tmp/claude-0/ec/dm/state.json',recordVideo:{dir:OUT,size:{width:360*Z,height:372*Z}}});
 ctx.setDefaultTimeout(30000);const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
 await ctx.route(/onrender\.com|\/api\//,r=>r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
 const tp=Date.now(),now=()=>(Date.now()-tp)/1000;
 await p.goto('http://localhost:8765/demo-harness.html?only=bc&z='+Z+'&ov=bar&mid='+mid);await sleep(4000);
 const ov=p.frames().find(f=>/scene=bar/.test(f.url()));
 const bc={m0:null};
 await sleep(3000);await p.evaluate(()=>H.title(false));
 // wait until the broadcast clock reaches the scorer clock start
 bc.m0=now();
 const events=[...TL.balls.map(x=>({t:x.t,k:'m',m:x.m})),...TL.caps.map(x=>({t:x.t,k:'c',text:x.text}))].sort((a,b)=>a.t-b.t);
 for(const e of events){
  const wait=(bc.m0+e.t)-now();if(wait>0)await sleep(wait*1000);
  if(e.k==='c')await p.evaluate(t=>H.cap(t,4500),e.text);
  else await ov.evaluate(m=>{const o=JSON.parse(m),i=S.matches.findIndex(x=>x.id===o.id);if(i>=0){S.matches[i]=o;commit()}},e.m);
 }
 const rest=(bc.m0+TL.end)-now();if(rest>0)await sleep(rest*1000);
 fs.writeFileSync(OUT+'/bc.json',JSON.stringify(bc));
 const v=p.video();await ctx.close();await b.close();console.log('video',await v.path(),'m0',bc.m0.toFixed(1));
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
