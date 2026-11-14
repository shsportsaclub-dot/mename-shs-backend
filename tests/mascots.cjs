// Mascots (Tiko + Mitthu) announce 4 / 6 / OUT; hidden with &mascot=0 and on other events
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
for(const [e,w] of [['four','FOUR!'],['six','SIX!'],['wicket','OUT!'],['hundred','HUNDRED!']])for(const f of [1,7,13,20]){await p.goto(base+`?scene=anim&id=${f}_${e}&t=2#overlay`);await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const m=document.querySelector('.al-mch'),i=m&&m.querySelector('img');return m?{t:(m.querySelector('.al-mbb')||{}).innerText,img:i?i.naturalWidth:-1,r:m.getBoundingClientRect().toJSON()}:null});
 ok(r&&r.t===w&&r.img>50,`pose ${f}_${e}: ${JSON.stringify(r&&{t:r.t,img:r.img})}`);if(r)ok(r.r.left>=0&&r.r.right<=1280&&r.r.top>=0&&r.r.bottom<=720,'in frame '+f+'_'+e)}
await p.goto(base+'?scene=anim&id=3_wide&t=2#overlay');await p.waitForTimeout(250);ok(await p.evaluate(()=>{const i=document.querySelector('.al-mch img');return !!i&&i.naturalWidth>50}),'pointing pose on wide');
await p.goto(base+'?scene=anim&id=3_four&t=2&mascot=0#overlay');await p.waitForTimeout(150);ok(!(await p.evaluate(()=>!!document.querySelector('.al-mch'))),'mascot=0 hides');
await p.evaluate(()=>{S.stream.mascotStyle='tiger';save()});await p.waitForTimeout(900);await p.goto(base+'?scene=anim&id=3_six&t=2#overlay');await p.waitForTimeout(250);ok(await p.evaluate(()=>document.querySelectorAll('.al-mch svg').length===2),'tiger+parrot style still available');
ok(!errs.length,errs.join(';'));if(!process.exitCode)console.log('PASS: mascots');await b.close()})();
