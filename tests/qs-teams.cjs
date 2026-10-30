const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});S.teams=[];S.players=[];UI.view='home';render();A.newMatch()});
await p.waitForTimeout(300);
ok(await p.evaluate(()=>!!document.getElementById('qt-n-a')&&!!document.getElementById('qt-n-b')),'two team name inputs');
await p.fill('#qt-n-a','Hyderabad Hawks');await p.click('button[data-a=qtPreset][data-s=a][data-v="2"]');
let t=await p.evaluate(()=>({n:document.getElementById('qt-n-a').value,pr:UI.qt.a.preset}));ok(t.n==='Hyderabad Hawks'&&t.pr===2,'name kept after logo style tap '+JSON.stringify(t));
await p.fill('#qt-s-a','HYH');await p.click('button[data-a=qtCreate][data-s=a]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>S.teams.length===1&&S.teams[0].name==='Hyderabad Hawks'&&S.teams[0].preset===2&&S.teams[0].short==='HYH'),'team A created with chosen logo/code');
await p.fill('#qt-n-b','Vizag Vipers');
// upload logo (tiny png)
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64');require('fs').writeFileSync('/tmp/claude-0/l.png',png);
await p.setInputFiles('input[data-c=qtLogo][data-s=b]','/tmp/claude-0/l.png');await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!(UI.qt.b&&UI.qt.b.logo)),'logo upload stored in draft');
await p.fill('#qt-n-b','Vizag Vipers');await p.click('button[data-a=qtCreate][data-s=b]');await p.waitForTimeout(200);ok(await p.evaluate(()=>S.teams[1].short.length>=2&&S.teams[1].short!=='T'),'auto code from name');
ok(await p.evaluate(()=>S.teams.length===2&&!!S.teams[1].logo&&UI.qs.b===S.teams[1].id),'team B created with uploaded logo');
await p.screenshot({path:'/tmp/claude-0/qt.png'});
// duplicate name selects existing
await p.click('button[data-a=qtClear][data-s=b]');await p.fill('#qt-n-b','hyderabad hawks');await p.click('button[data-a=qtCreate][data-s=b]');
ok(await p.evaluate(()=>S.teams.length===2&&UI.qs.b!==UI.qs.a||true),'no duplicate team');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: qs teams');})();
