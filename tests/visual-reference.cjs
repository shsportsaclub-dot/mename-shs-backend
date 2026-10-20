// Layout checks for the approved stadium shell, with synthetic match data.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();fs.mkdirSync('runtime-evidence',{recursive:true});
 for(const width of [320,412,1280]){
  const page=await browser.newPage({viewport:{width,height:936}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));
  await page.evaluate(()=>{UI.stage='app';S.user=null;S.prefs={...S.prefs,welcomed:1,asked:1};render()});
  const auth=await page.locator('.auth').boundingBox();assert(auth);assert(Math.abs(auth.x+auth.width/2-width/2)<3,'Auth must be centered in full viewport');
  await page.evaluate(()=>{
   S.user={id:'visual-qa',name:'Visual QA',role:'user',kind:'Fan',guest:true};S.prefs={...S.prefs,asked:1,welcomed:1};UI.view='home';UI.hx='all';UI.sport='cricket';UI.hf.tab='all';
   UI.live={ok:true,matches:[{id:'visual-ended',ended:true,started:false,status:'India won by 6 wickets',name:'India vs Australia',type:'t20',teams:[{name:'India',short:'IND'},{name:'Australia',short:'AUS'}]}]};render();
  });
  await page.locator('.sh-visual-hero').waitFor();
  assert(await page.locator('.hh-sports').isVisible(),'Sport selection remains visible for one selected sport');
  assert.match(await page.locator('.ig-sq .ss').first().innerText(),/India won/);
  const result=await page.evaluate(()=>({fit:document.documentElement.scrollWidth<=innerWidth,art:getComputedStyle(document.querySelector('.sh-visual-hero')).backgroundImage.includes('data:image/webp;base64'),emojis:[...document.querySelectorAll('.drawer .mi .e')].every(e=>!!e.querySelector('svg')),card:getComputedStyle(document.querySelector('.ig-sq')).aspectRatio,stage:document.documentElement.dataset.visualStage}));
  assert(result.fit,'Page must not overflow horizontally');assert(result.art);assert(result.emojis);assert.equal(result.card,'auto');assert.equal(result.stage,'app');
  await page.screenshot({path:`runtime-evidence/visual-reference-${width}.png`,fullPage:true});
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log('PASS: full-width auth centering, approved artwork, compact glass cards, visible sport rail, completed result, mobile overflow at 320/412/1280');
})().catch(e=>{console.error(e);process.exit(1)});
