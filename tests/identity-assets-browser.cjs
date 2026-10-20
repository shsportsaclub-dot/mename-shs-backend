const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),assert=require('assert/strict');
(async()=>{
 const files=fs.readdirSync('public/emblems').filter(f=>f.endsWith('.webp'));
 const server=http.createServer((q,r)=>{const u=new URL(q.url,'http://localhost');if(/^\/emblems\/[a-z-]+\.webp$/.test(u.pathname)){r.setHeader('content-type','image/webp');return r.end(fs.readFileSync('public'+u.pathname))}if(u.pathname==='/'){r.setHeader('content-type','text/html');return r.end(fs.readFileSync('app-index.html'))}r.setHeader('content-type','application/json');r.end('{"ok":false}')});
 await new Promise(r=>server.listen(18979,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch();fs.mkdirSync('runtime-evidence',{recursive:true});const results=[];
  for(const width of [320,412,1280]){
   const p=await browser.newPage({viewport:{width,height:936}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:18979'?route.continue():route.abort());await p.goto('http://127.0.0.1:18979/');
   const audit=await p.evaluate(files=>{
    UI.stage='app';UI.stadiumOpen=true;S.user={name:'Identity QA',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1,sports:['cricket','football','hockey','badminton','kabaddi','basketball','volleyball','tennis','pickleball']};UI.sport='cricket';UI.sportInit=1;UI.view='home';render();
    const card=document.createElement('section');card.id='identity-review';card.style='background:#0c1531;color:white;padding:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px';
    card.innerHTML='<h3 style="grid-column:1/-1">SH identity asset review</h3>'+files.map(f=>'<div style="text-align:center;font-size:10px;overflow-wrap:anywhere"><img src="/emblems/'+f+'?v=identity-20261020" alt="'+f+'" width="64" height="64" style="object-fit:contain"><br>'+f.replace('.webp','')+'</div>').join('')+Object.entries(SH_FLAG_ART).map(([k,u])=>'<div style="text-align:center"><img src="'+u+'" alt="'+k+' flag" width="48" height="36"><small>'+k+'</small></div>').join('');document.querySelector('main').prepend(card);
    return{flags:Object.keys(SH_FLAG_ART).length,missingIcons:[...document.querySelectorAll('.drawer .mi .e')].filter(e=>!e.querySelector('svg')||/undefined/.test(e.innerHTML)).map(e=>e.parentElement.textContent),countryHTML:shTeamMark({name:'Afghanistan'}),seed:shTeamMark({name:'A2 (aus)'}),unknown:shIdentityAssets.resolve('India Warriors'),wrongWomen:shIdentityAssets.resolve('Mumbai Indians Women')};
   },files);
   await p.locator('#identity-review img').evaluateAll(es=>Promise.all(es.map(i=>i.decode())));
   assert.equal(await p.locator('#identity-review img').count(),files.length+audit.flags);assert.equal(audit.flags,58);assert.deepEqual(audit.missingIcons,[]);assert.match(audit.countryHTML,/data:image\/svg\+xml/);assert.match(audit.seed,/>A2<\/text>/);assert.equal(audit.unknown,null);assert.equal(audit.wrongWomen,null);
   assert(await p.locator('#identity-review').evaluate(e=>e.scrollWidth<=e.clientWidth));await p.locator('#identity-review').screenshot({path:`runtime-evidence/identity-all-${width}.png`});
   await p.evaluate(()=>{
    S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'QA Player '+i,role:'BAT'}));S.teams=[{id:'a',name:'Nepal',short:'NEP',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Bangladesh',short:'BAN',players:S.players.slice(11).map(p=>p.id)}];
    const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'Synthetic QA ground'});m.rules={...m.rules,fieldingProfile:'icc-men-t20'};startInnings(m,0,'p0','p1','p11');UI.mid=m.id;UI.view='match';UI.tab='live';ball(m,{r:1});render();ball(m,{r:4});render();
   });
   await p.locator('.lc-head img').evaluateAll(es=>Promise.all(es.map(i=>i.decode())));
   assert.equal(await p.locator('.sh-arena-scene').count(),1);assert.equal(await p.locator('.sh-fx-four').count(),1);assert.equal(await p.locator('.sh-arena-player').count(),2);assert(!await p.locator('.sh-fx-runner').first().innerText());
   assert((await p.locator('.sh-arena-scene').boundingBox()).height>=239);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===1280){const a=await p.locator('.sh-arena-main').boundingBox(),b=await p.locator('.sh-arena-side').boundingBox();assert(b.x>=a.x+a.width,'Commentary belongs beside field on desktop')}
   await p.locator('.sh-live-window').screenshot({path:`runtime-evidence/stadium-${width}.png`});
   await p.getByRole('button',{name:'Expand live window',exact:true}).click();assert(await p.locator('.sh-live-window .lc-head').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('.sh-live-window.expanded').count(),0);
   for(const skin of ['cb','ca']){
    const state=await p.evaluate(skin=>{const W=shLocalWorld(curM());W.m.bbb=false;W.bb={bbb:[],providerNote:'bbbEnabled=false · ERR: unavailable'};W.sc=null;W.err='ERR: Scorecard private-fixture-id not found';W.tab='sc';UI.wm=W;UI.view='wmatch';S.settings.mskin=skin;render();return {card:document.querySelector('main').innerText,palette:getComputedStyle(document.querySelector('.msk')).getPropertyValue('--tx').trim(),header:getComputedStyle(document.querySelector('.cbp-h')).position}},skin);
    assert.equal(state.palette,'#edf3fc');assert.equal(state.header,'relative');assert.match(state.card,/Detailed scorecard unavailable/);assert(!state.card.includes('private-fixture-id'));
    await p.evaluate(()=>{UI.wm.tab='cm';render()});assert.match(await p.locator('.sh-coverage-status').first().innerText(),/Ball-by-ball not supplied/);assert(!await p.locator('main').innerText().then(t=>t.includes('bbbEnabled')));
    await p.screenshot({path:`runtime-evidence/mobile-coverage-${width}-${skin}.png`,fullPage:true});
    const retained=await p.evaluate(()=>{const W=shLocalWorld(curM());W.err='temporary provider error';return cbpCard(W)});assert.match(retained,/QA Player/);assert.match(retained,/last received/);
   }
   await p.evaluate(()=>{UI.view='score';UI.sid=UI.mid;render()});assert.equal(await p.locator('.sh-arena-scene').count(),0,'Scorer controls keep their own compact workspace');
   assert.deepEqual(errors,[]);results.push({width,emblems:files.length,flags:audit.flags,stadium:true,noOverflow:true});await p.close();
  }
  fs.writeFileSync('runtime-evidence/identity-results.json',JSON.stringify({results},null,2));console.log('PASS all 47 emblems + 58 vector flags decode, menu/sport icons, seed identity, stadium field, expanded scores, mobile fit, separate scorer');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
