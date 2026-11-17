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
 const getOv=()=>p.frames().find(f=>f!==p.mainFrame()&&/scene=bar/.test(f.url()));let ov=getOv();

 // ---- director: cut to the real full-screen boards like a TV broadcast (over summary, batting card, highlights, innings break, scorecard, stats, result, POTM, records)
 const legal=(m,i)=>!m.innings[i]?0:m.innings[i].ev.filter(e=>e.x!=='wd'&&e.x!=='nb').length;
 const plan=[];let prevL=[0,0],prevS='',w1=0;const seenB=[];
 const OVR={1:['bowlcard','OVER SUMMARY: bowler figures and fall of wickets'],2:['bats','BATTING CARD after 2 overs'],3:['hl','INNINGS HIGHLIGHTS: wickets, sixes, fours'],4:['ppsum','POWERPLAY REPLAY: every ball of every over']};
 for(const x of TL.balls){const m=JSON.parse(x.m);const i=m.cur||0;const L=[legal(m,0),legal(m,1)];
  if(L[i]!==prevL[i]&&L[i]%6===0&&L[i]<30&&OVR[L[i]/6])plan.push({t:x.t+1.8,sc:OVR[L[i]/6][0],cap:OVR[L[i]/6][1],d:6});
  if(m.status!==prevS){if(m.status==='done'){plan.push({t:x.t+2.5,sc:'resultcard',cap:'MATCH SUMMARY: both innings and the result',d:7},{t:x.t+10,sc:'stats',cap:'MATCH STATS: side by side',d:6},{t:x.t+17,sc:'potm',cap:'PLAYER OF THE MATCH',d:5},{t:x.t+23,sc:'records',cap:'MATCH RECORDS: most runs, wickets, sixes, fours',d:6})}prevS=m.status}
  if(m.status==='break'&&!plan.find(p=>p.sc==='innbreak'))plan.push({t:x.t+1.5,sc:'innbreak',cap:'INNINGS BREAK: target, top batters, top bowlers',d:7},{t:x.t+10,sc:'stats',cap:'INNINGS 1 STATS',d:5})
  {const inn=m.innings[i],cu=inn&&inn.cur;if(cu){const sn=seenB[i]||(seenB[i]=new Set());if(!sn.size){[cu.s,cu.n].forEach(v=>v&&sn.add(v))}else{[cu.s,cu.n].forEach(v=>{if(v&&!sn.has(v)){sn.add(v);if(x.t<462)plan.push({t:x.t+1.5,sc:'pcard',cap:'NEW BATTER walks in: photo and career stats',d:5})}})}}}
  prevL=L}
 plan.sort((a,b)=>a.t-b.t);plan.forEach((x,i)=>x.id='bd'+i);console.log('plan',plan.map(p=>p.sc+'@'+p.t.toFixed(0)).join(' '));
 let bn=0;const pre=async(sc,id)=>{await p.evaluate(([s,mid,id])=>{const f=document.createElement('iframe');f.id=id;f.style.visibility='hidden';f.src='/?scene='+s+'&mid='+mid+'#overlay';document.querySelector('.bc').appendChild(f)},[sc,mid,id])};const showB=id=>p.evaluate(id=>{const f=document.getElementById(id);if(f)f.style.visibility='visible'},id),dropB=id=>p.evaluate(id=>{const f=document.getElementById(id);if(f)f.remove()},id);
 let sq=Promise.resolve();const bc={m0:null};
 await sleep(3000);await p.evaluate(()=>H.title(false));try{await p.frames().find(f=>f!==p.mainFrame()&&/scene=bar/.test(f.url())).evaluate(()=>{S.stream.tkPack='prime';save()})}catch(e){console.log('pack',e.message)}

 // ---- PRE-MATCH BROADCAST (before ball 1): squads, leadership, toss with handshake and coin, venue, weather, pitch, playing XI + super sub, openers and bowler
 const PRE=[['squad','TEAM SQUADS: every player with C, VC, WK and super sub tags',7],['leaders','LEADERSHIP: captain, vice-captain and wicket-keeper',7],['tossphoto','THE TOSS: both captains shake hands',8],['toss','THE COIN: toss result and decision',7.2],['venue','VENUE: stadium capacity and average scores at this ground',7],['weather','WEATHER REPORT',5],['pitch','PITCH REPORT',6],['xisub','PLAYING XI with the super sub',8],['pickbat','OPENING BATTERS go out to bat',6],['pick','OPENING BOWLER takes the ball',6]];
 const t0pre=now();
 const FRESH=new Set(['toss']);for(let i=0;i<PRE.length;i++){const [sc,cap,d]=PRE[i],id='pre'+i;if(i===0)await pre(sc,id);await sleep(i===0?2500:0);if(PRE[i+1]&&!FRESH.has(PRE[i+1][0]))await pre(PRE[i+1][0],'pre'+(i+1));await p.evaluate(t=>H.cap(t,4500),cap);await showB(id);await sleep(d*1000);if(PRE[i+1]&&FRESH.has(PRE[i+1][0])){await pre(PRE[i+1][0],'pre'+(i+1));await sleep(1800)}await dropB(id)}
 bc.pre=now()-t0pre;
 // wait until the broadcast clock reaches the scorer clock start
 bc.m0=now();
 const events=[...TL.balls.map(x=>({t:x.t,k:'m',m:x.m})),...TL.caps.map(x=>({t:x.t,k:'c',text:x.text})),...plan.map(x=>({t:x.t,k:'s',sc:x.sc,cap:x.cap,d:x.d,id:x.id})),...plan.map(x=>({t:Math.max(1,x.t-7),k:'p',sc:x.sc,id:x.id}))].sort((a,b)=>a.t-b.t);
 for(const e of events){
  const wait=(bc.m0+e.t)-now();if(wait>0)await sleep(wait*1000);
  if(e.k==='p'){pre(e.sc,e.id).catch(()=>{});continue}
  if(e.k==='s'){sq=sq.then(async()=>{await p.evaluate(t=>H.cap(t,4500),e.cap);await showB(e.id);await sleep(e.d*1000);await dropB(e.id)}).catch(er=>console.log('scene err',er.message));continue}
  if(e.k==='c')await p.evaluate(t=>H.cap(t,4500),e.text);
  else{for(let k=0;k<8;k++){try{await (getOv()||ov).evaluate(m=>{if(typeof S==='undefined')throw new Error('nos');const o=JSON.parse(m),i=S.matches.findIndex(x=>x.id===o.id);if(i>=0){S.matches[i]=o;commit()}},e.m);break}catch(er){await sleep(500)}}}
 }
 await sq;const rest=(bc.m0+TL.end)-now();if(rest>0)await sleep(rest*1000);
 fs.writeFileSync(OUT+'/bc.json',JSON.stringify(bc));
 const v=p.video();await ctx.close();await b.close();console.log('video',await v.path(),'m0',bc.m0.toFixed(1));
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
