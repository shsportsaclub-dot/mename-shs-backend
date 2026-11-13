// Info tab: one ordered page (toss, match, date, venue, playing XI sheet, form, H2H, venue stats, officials), mobile 390px.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/ifx/.test(m.text()))errs.push(m.text())});
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});window.apiBase=()=>'http://x';UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 const pl=(n,r,x,c)=>({name:n,role:r,isPlaying:x,captain:c});
 UI.wm={m:{id:'z9',name:'India v New Zealand, 4th ODI',type:'ODI',venue:'Bay Oval, Mount Maunganui, New Zealand',series:'India tour of New Zealand 2026',started:true,ended:false,teams:[{name:'New Zealand',short:'NZ'},{name:'India',short:'IND'}],score:[{inning:'New Zealand Inning 1',r:32,w:0,o:5.1}],status:'Live'},
  mi:{tossWinner:'India',tossChoice:'bowling',dateTimeGMT:'2026-11-12T18:00:00',umpires:['Chris Brown','Kumar Dharmasena'],tvUmpire:'Paul Reiffel',matchReferee:'Ranjan Madugalle'},
  sq:[{teamName:'New Zealand',players:[pl('Tim Seifert','WK-Batsman',true),pl('Mitchell Santner','Bowling Allrounder',true,true),pl('Kyle Jamieson','Bowler',true),pl('Tom Latham','Batsman',false)]},{teamName:'India',players:[pl('Rohit Sharma','Batsman',true),pl('Kuldeep Yadav','Bowler',true),pl('Shubman Gill','Batsman',false)]}],
  ctx:{recentTeams:[{team:'New Zealand',matches:[{winner:'India',teams:['New Zealand','India']},{winner:'New Zealand'},{winner:'India'}]},{team:'India',matches:[{winner:'India'},{winner:'India'},{winner:'New Zealand'}]}]},
  h2h:{ok:true,n:10,nr:0,a:{name:'New Zealand',wins:2},b:{name:'India',wins:8},recent:[{d:'2026-11-07',t:'odi',res:'India won by 4 runs',v:'Hagley Oval'}]},
  vs:{ok:true,n:13,rows:[{t:'odi',n:13,avgFirst:266,hi:371,batFirst:7,chase:6}],recent:[{d:'2026-10-31',tm:['NB','AUCK'],res:'AUCK won by 4 wickets'}]},
  sc:{scorecard:[]},bb:{bbb:[]},tab:'info'};UI.view='wmatch';render()});await p.waitForTimeout(400);
const t=(await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '))).toLowerCase();
for(const s of ['India won the toss and chose to bowl','India tour of New Zealand 2026','Playing XI','Recent form','Head to head','Venue stats','Match officials','Chris Brown','Paul Reiffel','Ranjan Madugalle','Won batting first','Average 1st innings'])ok(t.includes(s.toLowerCase()),'missing '+s);
await p.screenshot({path:'/tmp/claude-0/pt/info1.png',fullPage:true});
await p.click('.ifx .ifx-xr');await p.waitForTimeout(200);
let s=await p.evaluate(()=>document.querySelector('.ifxs')&&document.querySelector('.ifxs').innerText.replace(/\s+/g,' '));
ok(s&&/Tim Seifert/.test(s)&&/Bat \(/.test(s),'sheet '+s);
await p.click('.ifxs .ifx-fl button:nth-child(3)');await p.waitForTimeout(150);
s=await p.evaluate(()=>document.querySelector('.ifxs .ifx-gd').innerText);ok(/Kyle Jamieson/.test(s)&&!/Tim Seifert/.test(s),'bowl filter '+s);
await p.screenshot({path:'/tmp/claude-0/pt/info2.png'});
await p.click('.ifxs .ifx-tb button:nth-child(2)');await p.waitForTimeout(150);
s=await p.evaluate(()=>document.querySelector('.ifxs .ifx-gd').innerText);ok(/Rohit|Kuldeep|Gill|Sharma/.test(s)||/No players/.test(s),'IND tab '+s);
await p.click('.ifxs .ifx-cl');await p.waitForTimeout(150);ok(!(await p.$('.ifxs')),'sheet closes');
ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no overflow');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: info tab');})();
