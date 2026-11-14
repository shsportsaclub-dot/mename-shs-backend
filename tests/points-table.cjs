// Points table / NRR check on scripted tournament data with hand-computed expectations
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'?scene=wagon#overlay');await p.waitForTimeout(400);
const R=await p.evaluate(()=>{S.matches=[];const nmz=['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:'BAT',team:i<11?'a':'b',bat:'Right-hand',bowl:'Right-arm fast'}));
 S.teams=[{id:'a',name:'Alpha',short:'ALP',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Beta',short:'BET',color:'#9d174d',players:S.players.slice(11).map(p=>p.id)}];
 S.tours=[{id:'t1',name:'Test Cup',teams:['a','b'],rules:{win:2,tie:1,nr:1,loss:0}}];
 const mk=(f,s)=>{const m=newMatch({a:'a',b:'b',overs:5,toss:f,dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});m.tid='t1';const bt=f,bw=f==='a'?'b':'a';
  const P0=bt==='a'?['p0','p1']:['p11','p12'],P1=bt==='a'?['p11','p12']:['p0','p1'];
  startInnings(m,0,P0[0],P0[1],P1[0]);m.status='live';let inn=m.innings[0];inn.cur.bl=P1[0];
  for(let i=0;i<30;i++){if(!inn.cur.bl)inn.cur.bl=P1[i%2];ball(m,{r:s[0]/30*1===1?1:(i<s[0]%30?2:1)});if(m.cur!==0)break}
  return m};
 // Match 1: Alpha bat first 5 overs, 30 runs; Beta chase 20 -> Alpha win. Match 2: Beta bat first 40; Alpha 25 -> Beta win.
 const run=(first,s1,s2,win)=>{const m=newMatch({a:'a',b:'b',overs:5,toss:first,dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});m.tid='t1';const A=first==='a'?'p':'q';
  const fb=first==='a'?['p0','p1','p11']:['p11','p12','p0'],sb=first==='a'?['p11','p12','p0']:['p0','p1','p11'];
  startInnings(m,0,fb[0],fb[1],fb[2]);m.status='live';let inn=m.innings[0];inn.cur.bl=fb[2];
  const feed=(inn,tot)=>{let left=tot;for(let i=0;i<30;i++){const r=Math.min(6,Math.ceil(left/(30-i)));if(!inn.cur.bl)inn.cur.bl=(i%2?'p13':'p14');ball(m,{r});left-=r}};
  feed(inn,s1);
  startInnings(m,1,sb[0],sb[1],sb[2]);const i2=m.innings[1];feed(i2,s2)
  m.status='done';m.win=win;m.result=(T(win).name)+' won';return{inn:m.innings.map(x=>x.ev.length),cur:m.cur}};
 const r1=run('a',30,20,'a'),r2=run('b',40,25,'b');
 const L=standings(S.tours[0]);return{r1,r2,rows:L.map(x=>({id:x.id,pts:x.pts,w:x.w,l:x.l,rf:x.rf,bf:x.bf,ra:x.ra,bb:x.bb,nrr:+x.nrr.toFixed(3)}))}});
console.log(JSON.stringify(R));
const a=R.rows.find(x=>x.id==='a'),bb=R.rows.find(x=>x.id==='b');
ok(a&&bb,'rows');if(a&&bb){ok(a.pts===2&&bb.pts===2&&a.w===1&&bb.w===1,'points');ok(a.rf===55&&a.bf===60&&a.ra===60&&a.bb===60,'runs/balls a '+JSON.stringify(a));ok(Math.abs(a.nrr+0.5)<.01&&Math.abs(bb.nrr-.5)<.01,'nrr');ok(R.rows[0].id==='b','sorted by NRR when points level')}
ok(!errs.length,errs.join(';'));if(!process.exitCode)console.log('PASS: points table');await b.close()})();
