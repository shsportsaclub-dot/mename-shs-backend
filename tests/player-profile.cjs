// Player profile page: photo header, five tabs, numbers worked out from matches scored in the app.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=async()=>({ok:false,status:500,json:async()=>({ok:false}),text:async()=>''})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';UI.sportInit=1;S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:i===0?'Hemanth':'Player '+i,role:i===0?'AR':'BAT',loc:i===0?'Kakinada':'',bat:i===0?'RHB':'',bowl:i===0?'Right-arm Leg Break':'',team:i<11?'a':'b'}));
S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];
S.user={id:'u',name:'QA',role:'admin',phone:'+910000000000',pid:'p0'};S.matches=[];demoMatch();render();UI.view='profile';render()});
ok(await p.evaluate(()=>!!document.querySelector('.pp h1')&&/HEMANTH/i.test(document.querySelector('.pp h1').innerText)),'my profile opens as the player profile page');
ok(await p.evaluate(()=>[...document.querySelectorAll('.pp .tabs button')].some(b=>b.innerText==='Edit')),'Edit tab for own profile');
await p.evaluate(()=>A.ppTab({v:'edit'}));await p.waitForTimeout(150);ok(await p.evaluate(()=>/Make my Hero Card|Open my Hero Card/.test(document.querySelector('.pp .body').innerText)&&/Profile photo/.test(document.querySelector('.pp .body').innerText)),'edit tab has photo and hero card tools');
await p.evaluate(()=>{S.settings.appTheme='mday';render()});await p.waitForTimeout(150);await p.screenshot({path:'/tmp/pp_light_edit.png'});await p.evaluate(()=>{A.ppTab({v:'stats'})});await p.waitForTimeout(100);await p.screenshot({path:'/tmp/pp_light_stats.png'});await p.evaluate(()=>{S.settings.appTheme='hero';render()});
await p.evaluate(()=>A.ppOpen({id:'p0'}));await p.waitForTimeout(200);
ok(await p.evaluate(()=>/HEMANTH/i.test(document.querySelector('.pp h1').innerText)),'name shown');
ok(await p.evaluate(()=>/Home XI|Away XI/.test(document.querySelector('.pp .body').innerText)),'matches tab lists the scored match');
await p.screenshot({path:'/tmp/pp1.png'});
for(const t of ['stats','trophies','teams','profile']){await p.evaluate(t=>A.ppTab({v:t}),t);await p.waitForTimeout(100);await p.screenshot({path:'/tmp/pp_'+t+'.png'})}
ok(await p.evaluate(()=>/Kakinada/.test(document.querySelector('.pp .body').innerText)),'profile details');
await p.evaluate(()=>{A.ppTab({v:'stats'});A.ppSk({v:'bowl'})});
ok(await p.evaluate(()=>/Econ/.test(document.querySelector('.pp .body').innerText)),'bowling stats tab');
await p.evaluate(()=>A.ppBack());ok(await p.evaluate(()=>UI.view==='profile'),'back returns');
ok(!errs.length,errs.join(';'));
await b.close();if(!process.exitCode)console.log('PASS: player profile');})();
