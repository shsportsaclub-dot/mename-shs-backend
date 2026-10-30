// Provider-match scorer pad: striker / non-striker / bowler, No ball and Wide with runs, byes, wicket, undo restores state.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.shRefreshWorldDetails=async()=>{};window.apiBase=()=>'http://x';
 const balls=[];window.fetch=async(u,o)=>{if(/\/api\/wbb\//.test(u)&&o&&o.method==='POST'){const b=JSON.parse(o.body);if(b.undo)balls.pop();else balls.push(Object.assign({n:balls.length+1},b));return{json:async()=>({ok:true,balls:balls.slice()})}}return{json:async()=>({ok:true,balls:balls.slice()})}};
 UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'scorer'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'a1',name:'New Zealand vs India',started:true,ended:false,type:'T20',teams:[{name:'New Zealand',short:'NZ'},{name:'India',short:'IND'}],score:[{inning:'New Zealand Inning 1',r:100,w:2,o:10}],status:'Live'},mi:{},
  sc:{scorecard:[{inning:'New Zealand Inning 1',batting:[{batsman:{id:'1',name:'Glenn Phillips'},'dismissal-text':'batting',r:40,b:20},{batsman:{id:'2',name:'Michael Bracewell'},'dismissal-text':'batting',r:30,b:15}],bowling:[{bowler:{id:'9',name:'Naman Dhir'},o:2,m:0,r:20,w:0}]}]},bb:{bbb:[]},tab:'live',sbb:[]};UI.view='wmatch';UI.sbbOpen=true;render()});
await p.waitForTimeout(400);


// second innings: first-innings scorer balls must not leak into the new innings
await p.evaluate(()=>{const W=UI.wm;W.sbb=[{n:1,inning:'1',over:19,ball:6,runs:1,bat:1,kind:'legal',batsman:'Glenn Phillips',ns:'Michael Bracewell',bowler:'Naman Dhir'}];W.pad=null;
 W.m.score=[{inning:'New Zealand Inning 1',r:259,w:5,o:20},{inning:'India Inning 1',r:20,w:0,o:2.0}];
 W.sc.scorecard=[W.sc.scorecard[0],{inning:'India Inning 1',batting:[{batsman:{id:'9',name:'Abhishek Sharma'},'dismissal-text':'batting'},{batsman:{id:'10',name:'Sanju Samson'},'dismissal-text':'batting'}],bowling:[{bowler:{name:'Jacob Duffy'}}]}];
 const r0=shRoster;shRoster=()=>[{name:'Abhishek Sharma',team:'India'},{name:'Sanju Samson',team:'India'},{name:'Mayank Yadav',team:'India'},{name:'Glenn Phillips',team:'New Zealand'},{name:'Jacob Duffy',team:'New Zealand'}];UI.sbbOpen=true;render()});
await p.waitForTimeout(200);
const o=await p.evaluate(()=>({pad:UI.wm.pad,nx:shSbbNext(UI.wm)}));
ok(o.pad.s==='Abhishek Sharma'&&o.pad.n==='Sanju Samson'&&o.pad.bw==='Jacob Duffy','new innings pad '+JSON.stringify(o.pad));
ok(o.nx.over===2&&o.nx.ball===1,'next ball from provider score '+JSON.stringify(o.nx));
await p.evaluate(()=>{A.sbbPick({v:'bw'})});
const names=await p.evaluate(()=>[...document.querySelectorAll('.sbb-names button')].map(b=>b.innerText));ok(names.join()==='Glenn Phillips,Jacob Duffy','bowler list = bowling team only '+names);
await b.close();if(!process.exitCode)console.log('PASS: innings');})();