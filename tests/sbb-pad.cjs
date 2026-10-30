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
const pad=()=>p.evaluate(()=>{const e=document.querySelector('.sbbpad');return e?e.innerText.replace(/\s+/g,' '):''});
let t=await pad();ok(/STRIKER\s+Glenn Phillips/.test(t)&&/NON-STRIKER\s+Michael Bracewell/.test(t)&&/BOWLER\s+Naman Dhir/.test(t),'pad pre-filled from the provider '+t);
// No ball + 4
await p.click('button[data-a=sbbAdd][data-v="ext:nb"]');t=await pad();ok(/Nb\+4/.test(t)&&/1 run is added/.test(t),'no ball options '+t);
await p.click('button[data-a=sbbAdd][data-v="nb:4"]');
let L=await p.evaluate(()=>UI.wm.sbb);ok(L.length===1&&L[0].kind==='nb'&&L[0].runs===5&&L[0].bat===4&&L[0].batsman==='Glenn Phillips'&&L[0].ns==='Michael Bracewell','NB+4 recorded '+JSON.stringify(L[0]));
ok(L[0].ball===1,'no ball does not use up a ball number');
// Wide + 2 (3 runs, strike unchanged because 2 extra runs is even)
await p.click('button[data-a=sbbAdd][data-v="ext:wd"]');await p.click('button[data-a=sbbAdd][data-v="wd:2"]');
L=await p.evaluate(()=>UI.wm.sbb);ok(L[1].kind==='wd'&&L[1].runs===3&&L[1].bat===0,'Wd+2 '+JSON.stringify(L[1]));
let pd=await p.evaluate(()=>UI.wm.pad);ok(pd.s==='Glenn Phillips','strike unchanged after even extras');
// single -> strike rotates
await p.click('button[data-a=sbbAdd][data-v="1"]');pd=await p.evaluate(()=>UI.wm.pad);ok(pd.s==='Michael Bracewell'&&pd.n==='Glenn Phillips','strike rotates after a single');
// bye
await p.click('button[data-a=sbbAdd][data-v="ext:b"]');await p.click('button[data-a=sbbAdd][data-v="b:2"]');L=await p.evaluate(()=>UI.wm.sbb);ok(L[3].ex==='b'&&L[3].runs===2&&L[3].bat===0&&L[3].kind==='legal','2 byes');
// change bowler by tapping
await p.click('button[data-a=sbbPick][data-v=bw]');await p.fill('#sbb-free','Hardik Pandya');await p.click('button[data-a=sbbSetFree]');pd=await p.evaluate(()=>UI.wm.pad);ok(pd.bw==='Hardik Pandya','bowler changed');
// wicket: striker out -> must choose new batter
await p.click('button[data-a=sbbAdd][data-v="ext:w"]');await p.click('button[data-a=sbbAdd][data-v="out:s"]');L=await p.evaluate(()=>UI.wm.sbb);ok(L[4].wicket&&L[4].out==='Michael Bracewell','striker out');
pd=await p.evaluate(()=>UI.wm.pad);ok(!pd.s||!pd.n,'new batter needed '+JSON.stringify(pd));
await p.evaluate(()=>A.sbbSet({v:'s',n:'Tim Seifert'}));await p.click('button[data-a=sbbAdd][data-v="0"]');L=await p.evaluate(()=>UI.wm.sbb);ok(L[5]&&L[5].batsman==='Tim Seifert','next ball by the new batter');
// undo restores the state of that ball
await p.click('button[data-a=sbbAdd][data-v=undo]');pd=await p.evaluate(()=>UI.wm.pad);ok(pd.s==='Tim Seifert'&&pd.bw==='Hardik Pandya','undo restores');
// commentary text
const cm=await p.evaluate(()=>{try{return cbpBbbList({}).map(x=>x.txt).join(' | ')}catch(e){return 'err '+e.message}});console.log('commentary:',cm.slice(0,300));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: sbb pad');})();
