// Correct a past ball: innings is replayed and must equal scoring the corrected sequence from scratch.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:430,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.confirm=()=>true});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
const res=await p.evaluate(()=>{
 UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:i%3?'BAT':'BOWL',team:i<11?'a':'b'}));
 S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];
 S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000'};S.matches=[];
 const mk=seq=>{const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.players.slice(0,11).map(p=>p.id),xiB:S.players.slice(11).map(p=>p.id)});startInnings(m,0,'p0','p1','p11');
  seq.forEach(x=>{const inn=m.innings[0];if(inn.cur.bl==null)inn.cur.bl=inn.ev.length>6?'p12':'p11';if(inn.cur.s===null||inn.cur.n===null)fill(m);ball(m,x)});return m};
 const snap=m=>{const k=calc(m,0),i=m.innings[0];return JSON.stringify({runs:k.runs,lg:i.lg,s:i.cur.s,n:i.cur.n,bl:i.cur.bl,bat:k.bat,bowl:k.bowl,ex:k.ex,ev:i.ev.map(e=>[e.r,e.x,e.bt,e.bl])})};
 const out={};
 // A: sequence over one full over + a bit; edit ball 1 (1 -> 2 changes strike for everything after)
 const base=[{r:1},{r:4},{r:0},{r:2},{r:1},{r:6},{r:3},{r:1}],edited=base.map((x,i)=>i===0?{r:2}:x);
 const m=mk(base),r=shEditBall(m,0,{r:2,x:''});out.a=[r.ok,snap(m)===snap(mk(edited))];
 // B: change a leg bye to bye style and a dot to a wide is refused
 const m2=mk([{r:0},{r:1,x:'lb'},{r:2}]);out.b1=shEditBall(m2,0,{r:0,x:'wd'}).ok;const r2=shEditBall(m2,1,{r:1,x:'b'});out.b2=[r2.ok,m2.innings[0].ev[1].x];
 // C: parity change before a wicket is refused and leaves the innings untouched; parity-neutral edit is accepted
 const seq=[{r:1},{r:0},{r:0,w:'Bowled',out:null},{r:2}];
 const m3=mk(seq),before=snap(m3);const r3=shEditBall(m3,0,{r:2,x:''});out.c1=[r3.ok,snap(m3)===before];
 const r4=shEditBall(m3,0,{r:3,x:''});out.c2=[r4.ok,calc(m3,0).runs];
 // D: UI form, audit log, redo cleared
 const m5=mk([{r:1},{r:4}]);S.matches=[m5];UI.sid=m5.id;UI.mid=m5.id;UI.view='score';UI.redo[m5.id]=[{r:1}];render();
 const form=document.querySelector('form[data-f=shEdit]');out.form=!!form;
 F.shEdit({get:k=>({i:'1',r:'6',x:''})[k]});out.d=[calc(m5,0).runs,(m5.audit||[]).map(a=>a.type).includes('ball_edited'),UI.redo[m5.id].length];
 return out});
ok(res.a[0]&&res.a[1],'edit equals corrected sequence '+JSON.stringify(res.a));
ok(res.b1===false,'wide cannot replace a legal ball');ok(res.b2[0]&&res.b2[1]==='b','leg bye to bye');
ok(res.c1[0]===false&&res.c1[1],'unsafe edit refused and nothing changed');
ok(res.c2[0]&&res.c2[1]===5,'parity-neutral edit before a wicket works '+JSON.stringify(res.c2));
ok(res.form,'form shown');ok(res.d[0]===7&&res.d[1]&&res.d[2]===0,'UI edit '+JSON.stringify(res.d));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: edit past ball');})();
