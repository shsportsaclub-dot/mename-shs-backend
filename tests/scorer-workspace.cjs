const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const html=fs.readFileSync('app-index.html'),server=http.createServer((q,r)=>{r.setHeader('content-type','text/html');r.end(html)});
 await new Promise(r=>server.listen(18979,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch();const results=[];
  for(const width of [320,412,1280]){
   const p=await browser.newPage({viewport:{width,height:920}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/*',r=>r.request().url()==='http://127.0.0.1:18979/'?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false,"error":"Isolated fixture"}'}));
   await p.goto('http://127.0.0.1:18979/');
   await p.evaluate(()=>{
    UI.stage='app';S.user={name:'QA scorer',role:'scorer',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1};
    S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:i%11===0?'WK':'BAT'}));
    S.teams=[{id:'a',name:'Home XI',short:'HOME',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away XI',short:'AWAY',players:S.players.slice(11).map(p=>p.id)}];
    S.matches=[];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'Isolated QA ground'});
    m.cat={gender:'men'};UI.sid=null;UI.mid=null;UI.view='score';render();
   });
   assert.equal(await p.locator('.sh-match-workspace').count(),1);
   assert.ok(await p.evaluate(()=>UI.sid===S.matches[0].id),'fallback match is also the action target');
   await p.locator('form[data-f="startInn"]').getByRole('button',{name:'Start innings',exact:true}).click();
   assert.equal(await p.locator('.sh-scorer-console').count(),1);
   const fresh=await p.evaluate(()=>{const m=S.matches[0];const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p11');F.startInn(f);return m.innings.length});
   assert.equal(fresh,1,'duplicate innings submission cannot reset events');
   await p.locator('[data-a="ex"][data-v="nb"]').click();await p.locator('[data-a="run"][data-v="0"]').click();
   await p.locator('[data-a="ex"][data-v="wd"]').click();await p.locator('[data-a="run"][data-v="0"]').click();
   assert.match(await p.locator('.sh-scorer-console .chips').first().innerText(),/Nb[\s\S]*Wd/,'extras visible before first legal ball');
   assert.match(await p.locator('.sh-scorer-console').innerText(),/FREE HIT/);
   const free=await p.evaluate(()=>{const m=S.matches[0];ball(m,{w:'Caught',r:0});return {w:calc(m,0).wk,balls:calc(m,0).lg,pending:shFreeHitPending(m)}});
   assert.deepEqual(free,{w:0,balls:1,pending:false});
   await p.evaluate(()=>{const m=S.matches[0];const e=m.innings[0].ev.at(-1);window.undoEventId=e.id;undo(m);commit()});
   assert.ok(await p.evaluate(()=>{const m=S.matches[0];return shFreeHitPending(m)&&m.audit.at(-1).event.id===window.undoEventId}));
   await p.locator('[data-a="run"][data-v="1"]').click();
   await p.locator('.sh-match-workspace [data-a="shScorerWatch"]').click();
   assert.equal(await p.locator('.sh-live-window').count(),1);assert.match(await p.locator('.sh-live-window').innerText(),/1nb/);assert.match(await p.locator('.sh-live-window').innerText(),/1wd/);assert.equal(await p.locator('.sh-scorer-console').count(),0);
   await p.locator('.sh-match-workspace [data-a="scoreIt"]').click();
   for(const r of [4,6]){await p.locator('[data-a="run"][data-v="'+r+'"]').click();}
   await p.locator('.sh-match-workspace [data-a="shScorerWatch"]').click();
   assert.match(await p.locator('.sh-live-window').innerText(),/SIX|6/);
   for(const tab of ['card','comm','xi','squads','ovr','graphs','info']){await p.locator('.cbp-tabs [data-a="tab"][data-v="'+tab+'"]').click();assert.equal(await p.evaluate(()=>UI.tab),tab)}
   await p.locator('.sh-match-workspace [data-a="scoreIt"]').click();
   await p.locator('[data-a="wicket"]').click();await p.locator('form[data-f="wicket"]').getByRole('button',{name:'Confirm wicket'}).click();
   assert.match(await p.locator('.sh-scorer-console').innerText(),/New batter in/);
   await p.locator('[data-a="pickBat"]').first().click();
   await p.locator('.sh-match-workspace [data-a="shScorerWatch"]').click();
   assert.equal(await p.locator('.sh-delivery-effect').getAttribute('data-effect'),'wicket');
   await p.locator('.sh-match-workspace [data-a="scoreIt"]').click();await p.locator('[data-a="undoBall"]').click();
   assert.equal(await p.evaluate(()=>calc(S.matches[0],0).wk),0);
   await p.evaluate(()=>{const m=S.matches[0];while(m.innings[0].lg<6)ball(m,{r:0});commit()});
   assert.match(await p.locator('.sh-scorer-console').innerText(),/Next bowler/);assert.match(await p.locator('.sh-transition-score').innerText(),/Over 1/);
   const fiveOver=await p.evaluate(()=>{const m=S.matches[0],old=m.overs;m.overs=5;const box=document.createElement('div');box.innerHTML=shPulsePanel(shLocalWorld(m));m.overs=old;return [...box.querySelectorAll('.sh-pulse-metrics>div')].find(e=>e.textContent.includes('Projected'))?.querySelector('b')?.textContent});assert.equal(fiveOver,'65','5-over projection uses 30 balls rather than T20 default');
   await p.reload();await p.evaluate(()=>{UI.stage='app';UI.view='score';render()});
   assert.equal(await p.evaluate(()=>S.matches[0].innings[0].ev.filter(e=>!e.id).length),0,'delivery identities survive reload');
   await p.locator('.sh-match-workspace [data-a="shScorerWatch"]').click();
   await p.evaluate(()=>{S.user={role:'viewer',name:'QA fan'};render()});
   assert.equal(await p.locator('.sh-match-workspace [data-a="scoreIt"]').count(),0);
   assert.match(await p.locator('#app').innerText(),/Live video is not connected/,'viewer sees missing video connection explicitly');
   assert.equal(await p.locator('.sh-match-workspace').evaluate(e=>e.getBoundingClientRect().right>innerWidth+1||e.scrollWidth>e.clientWidth+1),false);
   await p.evaluate(()=>{S.user={name:'QA scorer',role:'scorer',phone:'+910000000000'};const m=S.matches[0];while(calc(m,0).lg<36){if(!m.innings[0].cur.bl)m.innings[0].cur.bl='p12';ball(m,{r:0})}render()});
   assert.match(await p.locator('.sh-fielding-phase').innerText(),/5 outside circle/);
   await p.evaluate(()=>{S.matches[0].rules=S.matches[0].rules||{};S.matches[0].rules.slowOverRate=true;render()});assert.match(await p.locator('.sh-fielding-phase').innerText(),/4 outside circle/);
   await p.evaluate(()=>{const m=S.matches[0];m.status='done';m.result='Home XI won by 12 runs';render()});
   assert.match(await p.locator('.sh-match-result').innerText(),/Home XI won by 12 runs/);
   assert.deepEqual(errors,[]);fs.mkdirSync('runtime-evidence',{recursive:true});await p.screenshot({path:'runtime-evidence/scorer-workspace-'+width+'.png',fullPage:true});
   results.push({width,inningsGuard:true,selectedMatch:true,freeHitAcrossWide:true,undoAudit:true,deliveryIds:true,extrasVisible:true,viewerNavigation:true,viewerReadOnly:true,fieldingProfile:true,finalResult:true});await p.close();
  }
  fs.writeFileSync('runtime-evidence/scorer-workspace.json',JSON.stringify({scope:'Actual app, isolated synthetic cricket match, external calls stubbed',results},null,2));
  console.log('PASS scorer workspace: 320/412/1280, innings guard, NB-wide-free-hit, undo audit, delivery IDs, extras, viewer tabs, fielding phase, final result and reload');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
