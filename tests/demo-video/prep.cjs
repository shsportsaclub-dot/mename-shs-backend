// builds the demo match (fresh, nothing played) in localStorage and saves the storage state
const {chromium}=require('playwright');
module.exports=async function prep(outState){const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:360,height:640}}),p=await ctx.newPage();
await ctx.route(/onrender\.com|\/api\//,r=>r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('http://localhost:8765/');await p.waitForTimeout(500);
const id=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Organiser',phone:'+910000000000'};S.tok='t';S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};S.settings.voice=false;S.settings.bfQuick=true;
const [a,b]=demoTeams();const m=newMatch({a:a.id,b:b.id,overs:5,venue:'Newlands, Cape Town',toss:b.id,dec:'bat',xiA:a.players.slice(0,11),xiB:b.players.slice(0,11),umpires:'Demo umpires'});m.demo=3;
const f=m.firstBat,sx=m.xi[f],bx=m.xi[f===a.id?b.id:a.id];startInnings(m,0,sx[0],sx[1],bx.find(id=>['BOWL','AR'].includes(P(id).role)));m.status='live';commit();return m.id});
await ctx.storageState({path:outState});await b.close();return id};
if(require.main===module)module.exports('/tmp/claude-0/ec/dm/state.json').then(id=>console.log(id));
