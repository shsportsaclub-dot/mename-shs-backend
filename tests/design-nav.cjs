const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:900}});
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{UI.stage='app';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1,avDone:1,avSkip:1});S.user={id:'u',name:'t',role:'admin',phone:'+910000000000'};S.settings.appTheme='hero'});
const bad=[];
for(const [v,tab] of [['matches','Schedule'],['tours','Series'],['teams','Teams'],['epaper','ePaper'],['social','Social'],['market','Market'],['rankings','Rankings'],['reels','Videos']]){
 await p.evaluate(v=>{UI.view=v;render()},v);
 const r=await p.evaluate(()=>{const n=document.querySelector('main .shnav,main .cbnav');return n?[...n.querySelectorAll('button.on')].map(x=>x.textContent):null});
 if(!r||r[0]!==tab)bad.push(v+':'+r)}
for(const s of ['football','kabaddi']){await p.evaluate(s=>{UI.sport=s;render()},s);const sp=await p.evaluate(()=>document.documentElement.dataset.sport);if(sp!==s)bad.push('sport '+s)}
const op=await p.evaluate(()=>{UI.view='home';render();return 1});
console.log(bad.length?'FAIL '+bad:'PASS');await b.close();process.exit(bad.length?1:0)})()
