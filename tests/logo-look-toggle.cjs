// Header logo: SCORING (Sky High) and HEROES (Light) switch the look when tapped.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:860}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';UI.sportInit=1;S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.settings.appLogo='';S.user={id:'u',name:'T',nick:'T',phone:'1',role:'viewer'};S.settings.appTheme='hero';UI.view='home';render()});
const th=()=>p.evaluate(()=>document.documentElement.dataset.theme);
ok(await th()==='hero','starts in Sky High');
ok(await p.evaluate(()=>[...document.querySelectorAll('.hword small')].map(x=>x.innerText).join().toLowerCase()==='sky high,light'),'small labels under SCORING and HEROES');
await p.click('.hword [data-v=mday]');await p.waitForTimeout(250);ok(await th()==='mday','tapping HEROES gives the Light look');
ok(await p.evaluate(()=>S.view!=='x'&&UI.view==='home'),'stays on the same page');
await p.click('.hword [data-v=hero]');await p.waitForTimeout(250);ok(await th()==='hero','tapping SCORING gives the Sky High look');
await p.screenshot({path:'/tmp/logo_toggle.png',clip:{x:0,y:0,width:412,height:90}});
console.log(errs.length?'FAIL errors '+errs.join('|'):(process.exitCode?'FAILED':'PASS: logo look toggle'));await b.close()})();
