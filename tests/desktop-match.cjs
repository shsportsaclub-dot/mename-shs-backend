const {chromium}=require('playwright');const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const wm=fs.readFileSync('/dev/null');const src=fs.readFileSync(path.resolve(__dirname,'live-mock-layout.cjs'),'utf8');
const i=src.indexOf('UI.wm = {'),j=src.indexOf("UI.view = 'wmatch'");
const setup="(()=>{const bbb=[];for(let o=0;o<3;o++)for(let k=1;k<=6;k++)bbb.push({inning:1,team:'NZ A',over:o,ball:k,runs:k%3,total_runs:k%3,bruns:k%3,batsman:'Tom Blundell',bowler:'Anshul Kamboj'});"+src.slice(i,j).replace('UI.wm = ','UI.wm=')+"UI.view='wmatch';render()})()";
const b=await chromium.launch();try{
 for(const [n,w,h,ua,cols] of [['windows',1366,768,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36',2],['phone',412,860,'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36',1]]){
  const c=await b.newContext({viewport:{width:w,height:h},userAgent:ua}),p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
  await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1}});
  await p.evaluate(setup);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const rp=document.querySelector('.sh-live-window .rp'),inner=rp&&rp.children[2];const rr=rp.getBoundingClientRect();return {w:rr.width,left:!!document.querySelector('.dk-l'),right:!!document.querySelector('.dk-r'),fit:document.documentElement.scrollWidth<=innerWidth+1,hero:rp.querySelector('.hero').getBoundingClientRect().width}});
  if(cols===2){assert.ok(r.left&&r.right,n+' two-pane grouping');assert.ok(r.w>1000,n+' uses the wide area, got '+r.w);assert.ok(r.hero<r.w*0.7,n+' hero shares the row with live cards')}
  else assert.ok(!r.left&&!r.right,n+' phone keeps single column');
  assert.ok(r.fit,n+' no horizontal scroll');assert.deepEqual(errs,[]);await c.close()}
 console.log('PASS desktop match layout: Windows two-pane, phone unchanged')}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
