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
 const getOv=()=>p.frames().find(f=>f!==p.mainFrame()&&/scene=(?!ccast)/.test(f.url()));let ov=getOv();

 // ---- director: cut to the real full-screen boards like a TV broadcast (over summary, batting card, highlights, innings break, scorecard, stats, result, POTM, records)
 const legal=(m,i)=>!m.innings[i]?0:m.innings[i].ev.filter(e=>e.x!=='wd'&&e.x!=='nb').length;
 const plan=[];let prevL=[0,0],prevS='',w1=0;
 const OVR={1:['bowlcard','OVER SUMMARY: bowler figures and fall of wickets'],2:['bats','BATTING CARD after 2 overs'],3:['hl','INNINGS HIGHLIGHTS: wickets, sixes, fours'],4:['ppsum','POWERPLAY REPLAY: every ball of every over']};
 for(const x of TL.balls){const m=JSON.parse(x.m);const i=m.cur||0;const L=[legal(m,0),legal(m,1)];
  if(L[i]!==prevL[i]&&L[i]%6===0&&L[i]<30&&OVR[L[i]/6])plan.push({t:x.t+1.8,sc:OVR[L[i]/6][0],cap:OVR[L[i]/6][1],d:6});
  if(m.status!==prevS){if(m.status==='done'){plan.push({t:x.t+2.5,sc:'resultcard',cap:'MATCH SUMMARY: both innings and the result',d:7},{t:x.t+10,sc:'stats',cap:'MATCH STATS: side by side',d:6},{t:x.t+17,sc:'potm',cap:'PLAYER OF THE MATCH',d:5},{t:x.t+23,sc:'records',cap:'MATCH RECORDS: most runs, wickets, sixes, fours',d:6})}prevS=m.status}
  if(m.status==='break'&&!plan.find(p=>p.sc==='innbreak'))plan.push({t:x.t+1.5,sc:'innbreak',cap:'INNINGS BREAK: target, top batters, top bowlers',d:7},{t:x.t+10,sc:'stats',cap:'INNINGS 1 STATS',d:5})
  prevL=L}
 plan.sort((a,b)=>a.t-b.t);console.log('plan',plan.map(p=>p.sc+'@'+p.t.toFixed(0)).join(' '));
 const goScene=async sc=>{await p.evaluate(([s,mid])=>{document.getElementById('ov').src='/?scene='+s+'&mid='+mid+'#overlay'},[sc,mid]);await sleep(1800);ov=getOv()};
 let sq=Promise.resolve();const bc={m0:null};
 await sleep(3000);await p.evaluate(()=>H.title(false));
 // wait until the broadcast clock reaches the scorer clock start
 bc.m0=now();
 const events=[...TL.balls.map(x=>({t:x.t,k:'m',m:x.m})),...TL.caps.map(x=>({t:x.t,k:'c',text:x.text})),...plan.map(x=>({t:x.t,k:'s',sc:x.sc,cap:x.cap,d:x.d}))].sort((a,b)=>a.t-b.t);
 for(const e of events){
  const wait=(bc.m0+e.t)-now();if(wait>0)await sleep(wait*1000);
  if(e.k==='s'){sq=sq.then(async()=>{await p.evaluate(t=>H.cap(t,4500),e.cap);await goScene(e.sc);await sleep(e.d*1000);await goScene('bar')}).catch(er=>console.log('scene err',er.message));continue}
  if(e.k==='c')await p.evaluate(t=>H.cap(t,4500),e.text);
  else await (getOv()||ov).evaluate(m=>{const o=JSON.parse(m),i=S.matches.findIndex(x=>x.id===o.id);if(i>=0){S.matches[i]=o;commit()}},e.m);
 }
 await sq;const rest=(bc.m0+TL.end)-now();if(rest>0)await sleep(rest*1000);
 fs.writeFileSync(OUT+'/bc.json',JSON.stringify(bc));
 const v=p.video();await ctx.close();await b.close();console.log('video',await v.path(),'m0',bc.m0.toFixed(1));
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
