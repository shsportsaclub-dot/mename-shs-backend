// Two looks: Sky High (dark, default after login) and Light; login screen defaults to Light.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:860}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.settings.appTheme=undefined;UI.stage='app';S.user=null;S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});render()});
ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='mday','login screen is light by default');
ok(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(241, 243, 246)','light body background');
await p.evaluate(()=>{S.user={id:'u',name:'T',nick:'T',phone:'1',role:'viewer'};UI.view='home';render()});
ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='hero','Sky High after login');
await p.evaluate(()=>{UI.view='settings';render()});
const t=await p.evaluate(()=>document.querySelector('main [data-a=look][data-v=mday]').innerText);ok(/Light/.test(t),'settings has look tiles');
ok(await p.evaluate(()=>LOOKS.map(l=>l[1]).join(','))==='Sky High,Light','only two looks');
await p.evaluate(()=>{A.look({v:'mday'});render()});
ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='mday','choosing Light applies');
await p.evaluate(()=>{S.user=null;render()});
ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='mday','choice kept on login screen');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: look theme');})();
