// Run 0: the REAL "Start a match" flow in the scorer (teams: pick saved or create new, playing XI with C / WK / order / subs / add player, format, ball, pitch, ground,
// toss with coin, officials, start, opening batters and bowler), driven by real taps. Output /tmp/claude-0/ec/dm/wiz/*.webm (540x402 crop at 2x) + wiz.json (length).
const {chromium}=require('playwright'),fs=require('fs');
const OUT='/tmp/claude-0/ec/dm/wiz',W=540,Hh=402;
(async()=>{
 fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:W,height:Hh},deviceScaleFactor:1,recordVideo:{dir:OUT,size:{width:W,height:Hh}}});
 ctx.setDefaultTimeout(15000);
 await ctx.route(/onrender\.com|\/api\//,r=>r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
 const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://localhost:8765/');await p.waitForTimeout(800);
 const info=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};S.settings.voice=false;S.settings.bfQuick=true;
  const [a,b]=demoTeams();S.matches=[];S.venues=[];commit();UI.view='score';render();
  const st=document.createElement('style');st.textContent='.hnav,.bnav,.fabfloat,header,.hdr,.top,.toast,#toast{display:none!important}#tap{position:fixed;z-index:99999;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:3px solid #ffd24a;background:#ffd24a44;box-shadow:0 0 12px #ffd24a;opacity:0;pointer-events:none}#tap.on{opacity:1;animation:tp .5s ease-out}@keyframes tp{0%{transform:scale(1.9);opacity:.2}100%{transform:scale(1);opacity:1}}#chip{position:fixed;z-index:99999;right:6px;top:6px;font:900 13px Arial;color:#0b1530;background:#ffd24a;padding:4px 8px;border-radius:6px;opacity:0;pointer-events:none}#chip.on{opacity:1}';document.head.appendChild(st);
  const t=document.createElement('div');t.id='tap';document.body.appendChild(t);const c=document.createElement('div');c.id='chip';document.body.appendChild(c);
  window.__ring=(x,y,l)=>{t.style.left=x+'px';t.style.top=y+'px';t.classList.remove('on');void t.offsetWidth;t.classList.add('on');c.textContent=l||'';c.classList.toggle('on',!!l);setTimeout(()=>{t.classList.remove('on');c.classList.remove('on')},1500)};
  return{a:a.id,b:b.id}});
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));const T0=Date.now(),now=()=>((Date.now()-T0)/1000).toFixed(1);const L=s=>console.log(now(),s);
 const ring=async(loc,label,block='center')=>{await loc.evaluate((e,bk)=>{e.scrollIntoView({block:bk,behavior:'instant'})},block);await sleep(350);const r=await loc.evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}});await p.evaluate(([x,y,l])=>__ring(x,y,l),[r.x,r.y,label]);await sleep(800)};
 const tap=async(loc,label)=>{await ring(loc,label);await loc.evaluate(e=>e.click());await sleep(1000)};
 const type=async(loc,text,label)=>{await ring(loc,label);await loc.evaluate(e=>e.focus());await p.keyboard.type(text,{delay:70});await sleep(500)};
 const next=()=>tap(p.locator('[data-a="qsStep"][data-v="1"]').first(),'NEXT');
 await sleep(1500);await p.evaluate(()=>A.newMatch());await sleep(2500);L('teams');
 // ---- Teams: saved team or a brand new one
 await tap(p.locator('button:has-text("Change team")').first(),'TEAM A: CHANGE');   // opens Select team / Create team
 await sleep(1200);
 const modeBtn=m=>p.locator(`[data-a="qtMode"][data-s="a"][data-v="${m}"]`).first();
 await tap(modeBtn('new'),'OR CREATE A NEW TEAM');await sleep(2500);
 await tap(modeBtn('pick'),'OR PICK A SAVED TEAM');
 await tap(p.locator(`[data-a="qtUse"][data-s="a"]`).first(),'SOUTH AFRICA');await sleep(800);console.log('afterA',await p.evaluate(()=>JSON.stringify({a:UI.qs.a,b:UI.qs.b,qt:UI.qt,qtm:UI.qtm})));
 const chg=p.locator('button:has-text("Change team")').last();
 if(await chg.count()){await tap(chg,'TEAM B: CHANGE');await sleep(600);const u=p.locator(`[data-a="qtUse"][data-s="b"]`).first();if(await u.count())await tap(u,'AUSTRALIA')}
 await sleep(1200);console.log(await p.evaluate(()=>JSON.stringify({a:UI.qs.a,b:UI.qs.b,vis:[...document.querySelectorAll('[data-a=qtUse]')].map(e=>e.dataset.s+e.dataset.v).join(',')})));await next();L('players');
 // ---- Players: playing XI, captain, keeper, order, squad players, add new
 await sleep(1800);await p.screenshot({path:'/tmp/wz/dbg_players.png'});console.log(await p.evaluate(()=>JSON.stringify({a:UI.qs.a,b:UI.qs.b,step:UI.qs.step})));
 await tap(p.locator('[data-a="xiCap"]').first(),'C  CAPTAIN');
 await tap(p.locator('[data-a="xiWk"]').nth(6),'WK  KEEPER');
 await tap(p.locator('[data-a="xiDown"]').first(),'BATTING ORDER');
 const add=p.locator('[data-a="xiAdd"]').first();if(await add.count()){await ring(add,'SQUAD PLAYER: ADD TO XI');await sleep(1200)}
 const np=p.locator('input[placeholder^="New player"]').first();if(await np.count()){await type(np,'Sam Kerr','ADD A NEW PLAYER');await np.evaluate(e=>{e.value=''})}
 await sleep(800);
 // second team's XI
 const tabs=p.locator('[data-a="xiCap"]');const n=await tabs.count();if(n>11){await ring(tabs.nth(11),'SECOND TEAM: PLAYING XI');await sleep(1500)}
 await next();L('match');
 // ---- Match: format, overs, ball, pitch, ground
 await sleep(1200);
 await tap(p.locator('[data-a="ddOpen"]').first(),'FORMAT');await sleep(1500);await p.evaluate(()=>{if(UI.dd){UI.dd='';shQsShow()}});await sleep(600);
 const ov=p.locator('#qs-ov').first();if(await ov.count()){await type(ov,'5','OVERS PER SIDE')}
 await tap(p.locator('[data-a="qsSet"][data-v="leather"]').first(),'LEATHER BALL');
 const pd=p.locator('[data-a="ddOpen"]').nth(1);if(await pd.count()){await tap(pd,'PITCH TYPE');await sleep(1500);await p.evaluate(()=>{if(UI.dd){UI.dd='';shQsShow()}});await sleep(500)}
 await type(p.locator('#qs-venue').first(),'Newlands, Cape Town','GROUND');
 await next();L('toss');
 // ---- Toss: coin, caller, call, winner, decision, officials
 await sleep(1200);
 await tap(p.locator('[data-a="qsFlip"]').first(),'FLIP THE COIN');await sleep(4500);
 await tap(p.locator(`[data-a="qsSet"][data-v="${info.b}"][data-k="toss"]`).first(),'TOSS WON BY AUSTRALIA');
 await tap(p.locator('[data-a="qsSet"][data-v="bat"][data-k="dec"]').first(),'BAT FIRST');
 await p.evaluate(()=>{const d=document.querySelector('[data-qsm]');if(d){d.open=true}});await sleep(900);
 const u1=p.locator('#qs-u1').first();if(await u1.count()){await type(u1,'R. Illingworth','UMPIRE 1');await type(p.locator('#qs-u2').first(),'M. Gough','UMPIRE 2')}
 await tap(p.locator('[data-a="qsStart"]').first(),'START MATCH');L('openers');await sleep(2500);
 // ---- first innings: openers and bowler
 const f=p.locator('form[data-f="startInn"]').first();
 if(await f.count()){const pk=async(name,i,label)=>{const s=f.locator(`select[name="${name}"]`);if(await s.count()){const v=await s.evaluate((e,i)=>e.options[Math.min(i,e.options.length-1)].value,i);await ring(s,label);await s.selectOption(v);await sleep(900)}};
  await pk('s',0,'OPENING BATTER (STRIKER)');await pk('n',1,'NON-STRIKER');await pk('bl',0,'OPENING BOWLER');
  await tap(f.locator('button[type="submit"],button:has-text("Start innings")').first(),'START INNINGS')}
 await sleep(2500);L('done');fs.writeFileSync(OUT+'/wiz.json',JSON.stringify({len:(Date.now()-T0)/1000}));
 const v=p.video();await ctx.close();await b.close();console.log('video',await v.path());
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
