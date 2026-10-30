const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.apiBase=()=>'http://x';window.__calls=[];const TE=[],PL=[];
 window.fetch=async(u,o)=>{u=String(u);const m=(o&&o.method)||'GET',b=o&&o.body?JSON.parse(o.body):{},j=x=>({json:async()=>x});window.__calls.push(m+' '+u.replace('http://x',''));
  if(/\/api\/reg\/teams$/.test(u)&&m==='POST'){const ex=TE.find(t=>t.name.toLowerCase()===b.name.toLowerCase());if(ex)return j({ok:false,error:'exists',existing:ex,mine:false});const t={id:'t'+(TE.length+1),name:b.name,short:b.short,n:0,players:[]};TE.push(t);return j({ok:true,team:t})}
  if(/\/api\/reg\/team\?id=/.test(u)){const t=TE.find(x=>u.endsWith(x.id));return j({ok:true,team:t})}
  if(/\/api\/reg\/teams\?q=/.test(u))return j({ok:true,items:TE});
  if(/\/api\/reg\/players\?q=/.test(u))return j({ok:true,items:PL.map(p=>Object.assign({teams:[]},p))});
  if(/\/api\/reg\/players$/.test(u)&&m==='POST'){let p=b.phone&&PL.find(x=>x.ph===b.phone.replace(/\D/g,''));const ex=!!p;if(!p){p={id:'p'+(PL.length+1),name:b.name,role:b.role,bat:b.bat,bowl:b.bowl,jersey:b.jersey,verified:false,mobile:'••••'+String(b.phone||'').slice(-4),ph:String(b.phone||'').replace(/\D/g,'')};PL.push(p)}const t=TE.find(x=>x.id===b.team);if(t){t.players.push(p);t.n++}return j({ok:true,existing:ex,player:p})}
  if(/\/api\/reg\/members$/.test(u))return j({ok:true});
  return j({ok:false})};
 UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});S.teams=[];S.players=[];UI.view='home';render();A.newMatch()});
await p.waitForTimeout(300);
await p.fill('#qt-n-a','Hyderabad Hawks');await p.click('button[data-a=qtCreate][data-s=a]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>S.teams.length===1&&S.teams[0].rid==='t1'),'team registered on server, rid stored');
await p.fill('#qt-n-b','Vizag Vipers');await p.click('button[data-a=qtCreate][data-s=b]');await p.waitForTimeout(500);
// add a new player with details (Players step)
await p.click('button[data-a=qsStep][data-v="1"]');await p.waitForTimeout(200);
await p.evaluate(()=>{document.querySelector('.qp details').open=true});
const tid=await p.evaluate(()=>S.teams[0].id);
await p.fill('#qp-n-'+tid,'Ravi Kumar');await p.fill('#qp-m-'+tid,'9876543210');await p.selectOption('#qp-r2-'+tid,'WK');await p.selectOption('#qp-b-'+tid,'Left-hand');await p.fill('#qp-j-'+tid,'7');
await p.click('button[data-a=qpNew]');await p.waitForTimeout(500);
let r=await p.evaluate(()=>({n:S.players.length,p:S.players[0],xi:UI.qs.xi[S.teams[0].id]}));
ok(r.n===1&&r.p.role==='WK'&&r.p.bat==='Left-hand'&&r.p.jersey===7&&r.p.rid==='p1'&&r.p.unv===true,'player created with details '+JSON.stringify(r.p));ok(r.xi.length===1,'in XI');
ok(await p.evaluate(()=>/Unverified/.test(document.body.innerText)),'unverified badge');
// same mobile again -> no duplicate
await p.evaluate(()=>{document.querySelector('.qp details').open=true});
await p.fill('#qp-n-'+tid,'Ravi K');await p.fill('#qp-m-'+tid,'98765 43210');await p.click('button[data-a=qpNew]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>S.players.length===1),'same mobile does not create a duplicate player');
// search existing registered player from another team
const tb=await p.evaluate(()=>S.teams[1].id);
await p.fill('#qp-q-'+tb,'ravi');await p.waitForTimeout(700);
ok(await p.evaluate(id=>/Ravi Kumar/.test(document.getElementById('qp-r-'+id).innerText),tb),'search shows registered player');
await p.click('button[data-a=qpAdd][data-t="'+tb+'"]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>S.teams[1].players.length===1),'registered player added to second team');
// team already registered by someone else -> uses it
await p.click('button[data-a=qsStep][data-v="-1"]');await p.waitForTimeout(200);
await p.click('button[data-a=qtClear][data-s=a]');await p.fill('#qt-n-a','Vizag Vipers');await p.click('button[data-a=qtCreate][data-s=a]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>S.teams.filter(t=>t.name==='Vizag Vipers').length===1),'duplicate team name not created locally');
// ID card + QR, and scan-link opening
await p.evaluate(()=>{const f0=window.fetch;window.fetch=async(u,o)=>{u=String(u);if(/\/api\/reg\/me/.test(u))return{json:async()=>({ok:true,player:{id:'p9',code:'SHAB12CD34',name:'Me',role:'BAT',bat:'Right-hand',verified:true,teams:[]}})};if(/\/api\/reg\/player\?id=/.test(u))return{json:async()=>({ok:true,player:{id:'p1',code:'SHP1P1P1P1',name:'Ravi Kumar',role:'WK',verified:false,teams:[]}})};return f0(u,o)};});
await p.evaluate(()=>A.myqr());await p.waitForTimeout(500);
ok(await p.evaluate(()=>/SHAB12CD34/.test(document.body.innerText)&&!!document.querySelector('#pidQr canvas')),'my ID card with QR');
await p.evaluate(()=>{UI.modal=null;renderModal()});
await p.evaluate(()=>shOpenPlayerCode('SHP1P1P1P1'));await p.waitForTimeout(500);
ok(await p.evaluate(()=>/Ravi Kumar/.test(document.body.innerText)&&/Add to team/.test(document.body.innerText)),'scanned player card with add-to-team');
await p.click('button[data-a=pidAdd]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>S.teams.some(t=>t.players.some(id=>(P(id)||{}).name==='Ravi Kumar'&&P(id).rid==='p1'))),'player added from scan');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: registry ui');})();
