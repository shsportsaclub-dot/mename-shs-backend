// Plays specific events (six, caught, bowled, run out, wide, runs) in the game scene without errors; screenshots mid-action.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];
const p0=await b.newPage();await p0.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p0.goto('file://'+process.cwd()+'/app-index.html');await p0.waitForTimeout(400);
const P=JSON.parse(await p0.evaluate(()=>{const m=demoMatch();return JSON.stringify({id:m.id,d:shPack('matches',m)})}));
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(/\/api\/shared\/matches\//.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,item:{data:P.d}})});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
await p.goto('file://'+process.cwd()+'/app-index.html?scene=ccast&mid='+P.id+'#overlay');await p.waitForTimeout(2500);
const kinds=[['SIX',{r:6,ang:{a:-0.6,d:1}}],['FOUR',{r:4,ang:{a:0.4,d:1}}],['TWO',{r:2,ang:{a:-2.2,d:.5}}],['CAUGHT',{r:0,w:'Caught',fld:'Pat Cummins',ang:{a:-1.2,d:.6}}],['BOWLED',{r:0,w:'Bowled'}],['RUNOUT',{r:0,w:'Run out',fld:'Pat Cummins',ang:{a:2.5,d:.4}}],['STUMPED',{r:0,w:'Stumped'}],['LBW',{r:0,w:'LBW'}],['WIDE',{r:0,x:'wd'}],['DOT',{r:0}]];
for(const [n,ev] of kinds){const ok=await p.evaluate(async([n,ev])=>{const m=UI.ccst.m,inn=m.innings[0],base=inn.ev[10];const e={...base,...ev,w:ev.w||undefined,x:ev.x||''};e.ang=ev.ang;const k={i:0,j:10,e};await Promise.race([shGamePlay(k),new Promise(r=>setTimeout(r,9000))]);return true},[n,ev]);assert(ok,n)}
// screenshot mid six
const pr=p.evaluate(([ev])=>{const inn=UI.ccst.m.innings[0];const e={...inn.ev[10],...ev,x:''};return shGamePlay({i:0,j:10,e})},[kinds[0][1]]);await p.waitForTimeout(3200);await p.screenshot({path:'/tmp/game-six.png'});await pr;
const pr2=p.evaluate(([ev])=>{const inn=UI.ccst.m.innings[0];const e={...inn.ev[10],...ev,x:''};return shGamePlay({i:0,j:10,e})},[kinds[3][1]]);await p.waitForTimeout(3300);await p.screenshot({path:'/tmp/game-caught.png'});await pr2;
assert.deepEqual(errs,[]);console.log('PASS game events');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
