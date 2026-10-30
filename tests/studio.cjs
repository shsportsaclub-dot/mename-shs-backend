const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}),ctx=await b.newContext({viewport:{width:412,height:900},permissions:['camera']}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});S.settings.voice=false;S.settings.bfQuick=true;render();A.demo()});await p.waitForTimeout(300);
await p.evaluate(()=>{UI.view='studio';render()});await p.waitForTimeout(300);
ok(await p.evaluate(()=>!!document.getElementById('st-stage')&&document.querySelectorAll('.st-tile').length===4),'studio with 4 tiles');
ok(await p.evaluate(()=>/\d+\/\d+/.test(document.querySelector('.st-bar').textContent)),'score bar shows score: '+await p.evaluate(()=>document.querySelector('.st-bar').textContent));
await p.selectOption('[data-c=stLay]','two');ok(await p.evaluate(()=>document.querySelectorAll('.st-tile').length===2),'layout two');
await p.selectOption('[data-c=stTheme]','12');ok(await p.evaluate(()=>/--a:hsl/.test(document.getElementById('st-stage').getAttribute('style'))),'theme applied');
await p.click('button[data-a=stConnect]');await p.waitForTimeout(800);
ok(await p.evaluate(()=>{const v=document.querySelector('.st-tile video');return !!v&&!!v.srcObject}),'camera attached to tile');
// survives a re-render
await p.evaluate(()=>render());await p.waitForTimeout(200);
ok(await p.evaluate(()=>{const v=document.querySelector('.st-tile video');return !!v&&!!v.srcObject}),'camera survives re-render');
// ball effect
await p.evaluate(()=>{const m=S.matches.find(x=>x.status==='live')||S.matches[0];UI.mid=m.id;UI.sid=m.id;UI.st.mid=m.id;});
const fl=await p.evaluate(()=>new Promise(res=>{const m=S.matches.find(x=>x.id===UI.st.mid);const inn=m.innings[m.cur];window.dispatchEvent(new CustomEvent('sh:ball-confirmed',{detail:{matchId:m.id,ball:{r:6,x:'',w:'',bt:inn.cur.s||inn.ev[0].bt,bl:inn.cur.bl||inn.ev[0].bl}}}));setTimeout(()=>{const f=document.getElementById('st-flash');res(f.style.display+'|'+f.textContent)},300)}));
console.log('flash',fl);ok(/flex\|SIX|CENTURY|FIFTY/.test(fl),'effect shown');
await p.click('button[data-a=stRec]');await p.waitForTimeout(2200);await p.click('button[data-a=stRec]');await p.waitForTimeout(800);
ok(await p.evaluate(()=>!!UI.stBlob&&UI.stBlob.size>1000),'recording blob '+await p.evaluate(()=>UI.stBlob&&UI.stBlob.size));
await p.screenshot({path:'/tmp/claude-0/studio.png'});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: studio');})();
