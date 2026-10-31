const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:700}});
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(500);
for(const th of ['mday','hero']){
await p.evaluate(th=>{UI.stage='app';UI.view='home';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'t',role:'admin',phone:'+910000000000'};S.settings.appTheme=th;UI.live={ok:true,matches:[]};render()},th);
await p.evaluate(()=>window.scrollTo(0,500));await p.waitForTimeout(200);
console.log(th,JSON.stringify(await p.evaluate(()=>['#app>.hdr','main .cbnav','main .cbstrip'].map(s=>{const e=document.querySelector(s);return e?[s,Math.round(e.getBoundingClientRect().top),getComputedStyle(e).position]:[s,null]}))));
await p.screenshot({path:'/tmp/st-'+th+'.png'})}
await b.close()})()
