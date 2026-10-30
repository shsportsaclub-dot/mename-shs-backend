const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});S.settings.voice=false;S.settings.bfQuick=true;render()});
await p.evaluate(()=>A.demo());await p.waitForTimeout(300);
const id=await p.evaluate(()=>(S.matches.find(x=>x.status==='live')||S.matches[0]).id);
await p.evaluate(id=>A.scoreIt({id}),id);await p.waitForTimeout(500);
await p.evaluate(()=>{const b=document.querySelector('.sh-scorer-console .pick button');if(b)b.click()});await p.waitForTimeout(400);
ok(await p.evaluate(()=>!!document.querySelector('.bf')),'ball flow card');
ok(await p.evaluate(()=>{const c=document.querySelector('.sh-scorer-console');return c&&!c.querySelector('.sh-shot-marking')}),'old bottom ground removed');
ok(await p.evaluate(()=>{const bf=document.querySelector('.bf'),ex=document.querySelector('.sh-scorer-console .exr').closest('.card');return bf.nextElementSibling===ex}),'ground card sits above runs');
ok(await p.evaluate(()=>document.querySelectorAll('.bf-shots button svg').length===10),'10 shot pictures');
// choose shot, tap ground deep midwicket (right-hand: left of screen, lower-left?)
await p.click('.bf-shots button:nth-child(3)');await p.waitForTimeout(200); // Pull
const box=await p.evaluate(()=>{const r=document.getElementById('wag').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
// deep square leg: left of centre, far
await p.mouse.click(box.x+box.w*(0.5-0.45),box.y+box.h*0.5);await p.waitForTimeout(250);
const zn=await p.evaluate(()=>(document.querySelector('.bf-zone b')||{}).textContent);console.log('zone',zn);
ok(/square leg/i.test(zn||''),'zone name shown: '+zn);
await p.click('.bf-fl button');await p.waitForTimeout(150);
ok(await p.evaluate(()=>!!UI.fld),'fielder chosen');
await p.click('.sh-scorer-console .runs button:nth-child(5)');await p.waitForTimeout(400); // 4
const r=await p.evaluate(()=>{const m=S.matches.find(x=>x.id===UI.sid),e=m.innings[m.cur].ev.at(-1);return {e,line:commentary(m,m.cur).find(c=>c.t==='b').txt}});
console.log(JSON.stringify(r.e),'\n',r.line);
ok(r.e.zone&&r.e.shot==='Pull'&&r.e.r===4&&r.e.fldr,'event has zone/shot/fielder');
ok(/square leg/i.test(r.line),'commentary names the place');
ok(await p.evaluate(()=>UI.ang==null&&!UI.shot&&!UI.fld),'state cleared for next ball');
// simple mode
await p.evaluate(()=>{S.settings.cmode='simple'});
const l2=await p.evaluate(()=>{const m=S.matches.find(x=>x.id===UI.sid);return commentary(m,m.cur).find(c=>c.t==='b').txt});console.log('simple:',l2);
ok(!/square leg/i.test(l2)&&/FOUR/.test(l2)&&l2.length<60,'simple line');
await p.evaluate(()=>{S.settings.cmode='pro';S.settings.cstyle='energy'});
console.log('energy:',await p.evaluate(()=>{const m=S.matches.find(x=>x.id===UI.sid);return commentary(m,m.cur).find(c=>c.t==='b').txt}));
// dot ball with place only
await p.evaluate(()=>{const b=document.querySelector('.sh-scorer-console .pick button');if(b)b.click()});await p.waitForTimeout(300);
const bx=await p.evaluate(()=>{const r=document.getElementById('wag').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
await p.mouse.click(bx.x+bx.w*0.8,bx.y+bx.h*0.5);await p.waitForTimeout(200);await p.click('.sh-scorer-console .runs button:nth-child(1)');await p.waitForTimeout(300);
ok(await p.evaluate(()=>{const m=S.matches.find(x=>x.id===UI.sid);const e=m.innings[m.cur].ev.at(-1);return e.r===0&&!!e.zone}),'dot ball keeps its place');
ok(await p.evaluate(()=>SH_BC_LOG.length>=2&&SH_BC_LOG.at(-1).eventType==='BALL_CONFIRMED'&&!!SH_BC_LOG.at(-1).matchId),'broadcast event published');
await p.screenshot({path:'/tmp/claude-0/bf.png',fullPage:false});
// confirm flow (default): runs only select, CONFIRM saves
await p.evaluate(()=>{S.settings.bfQuick=false;render()});await p.waitForTimeout(200);
const n0=await p.evaluate(()=>{const m=S.matches.find(x=>x.id===UI.sid);return m.innings[m.cur].ev.length});
await p.click('.sh-scorer-console .runs button:nth-child(2)');await p.waitForTimeout(200);
ok(await p.evaluate(n=>{const m=S.matches.find(x=>x.id===UI.sid);return m.innings[m.cur].ev.length===n&&UI.pr==='1'},n0),'runs tap only selects');
ok(await p.evaluate(()=>!!document.querySelector('.bf-cf [data-a=bfConfirm]:not([disabled])')&&document.querySelector('.runs').nextElementSibling.classList.contains('bf-cf')),'fielder + confirm sit after runs');
await p.click('.bf-cf .bf-fl button');await p.click('[data-a=bfConfirm]');await p.waitForTimeout(300);
ok(await p.evaluate(n=>{const m=S.matches.find(x=>x.id===UI.sid);const i=m.innings[m.cur];return i.ev.length===n+1&&i.ev.at(-1).r===1&&!!i.ev.at(-1).fldr&&UI.pr==null},n0),'confirm saves ball with runs and fielder');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: ball flow');})();
