const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',email:'own@x.com',role:'admin',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
 const a={id:'a1',name:'Demo League',owner:'u1',mode:'points',currency:'INR',pts:1000,ppt:11,base:10,inc:5,date:'2026-11-02',venue:'Ground',round:1,cur:null,bid:null,bidTeam:null,hist:[],
  teams:[{id:'t1',name:'Hawks',short:'HWK',purse:1000,players:[],email:'own@x.com'},{id:'t2',name:'Lions',short:'LNS',purse:1000,players:[]}],
  players:Array.from({length:8},(_,i)=>({id:'p'+i,name:'Player '+i,cat:'A',skill:i%2?'Bowler':'Batter',st:null}))};
 S.auc=[a];UI.au.open='a1';UI.view='auction';UI.au.dtab='teams';render();
 const out={};
 const sell=(pid,price)=>{a.cur=pid;a.bid=price;a.bidTeam='t1';A.auSold();shFmClose()};
 /* first purchase is front-centre (no captain) */
 sell('p0',50);let F=shFormation(a,a.teams[0]);out.first=[F.center.id,F.left.length,F.right.length];
 sell('p1',200);F=shFormation(a,a.teams[0]);out.second=[F.center.id,F.left.map(x=>x.id),F.right.map(x=>x.id),F.left.concat(F.right).map(x=>x.badges.join())];
 sell('p2',80);sell('p3',90);sell('p4',60);F=shFormation(a,a.teams[0]);out.five=[F.center.id,F.left.map(x=>x.id),F.right.map(x=>x.id)];
 /* captain confirmed: moves to front-centre, former centre goes into the wings */
 a.teams[0].captain='p3';F=shFormation(a,a.teams[0]);out.cap=[F.center.id,F.center.badges.join(),F.left.map(x=>x.id),F.right.map(x=>x.id),F.all.length,new Set(F.all.map(x=>x.id)).size];
 /* captain is also top buy */
 a.teams[0].captain='p1';F=shFormation(a,a.teams[0]);out.capTop=[F.center.id,F.center.badges.join('+'),F.left[0].id];
 a.teams[0].captain='';
 /* purchases in the other team do not leak */
 out.other=shFormation(a,a.teams[1]).all.length;
 /* seq and seen */
 out.seq=[a.seq,a.teams[0].lastSeq,a.players.find(x=>x.id==='p4').seq];
 return out});
console.log(JSON.stringify(r));
assert.deepEqual(r.first,['p0',0,0]);
assert.deepEqual(r.second.slice(0,3),['p0',['p1'],[]]);assert.deepEqual(r.second[3],['TOP BUY']);
assert.deepEqual(r.five,['p0',['p1','p3'],['p2','p4']],'right first then left, alternating');
assert.deepEqual(r.cap.slice(0,2),['p3','CAPTAIN']);assert.equal(r.cap[4],5);assert.equal(r.cap[5],5);assert.equal(r.cap[2][0],'p1','top buy takes the first viewer-left place');
assert.deepEqual(r.capTop,['p1','CAPTAIN+TOP BUY','p3'],'next highest takes viewer-left');
assert.equal(r.other,0);assert.deepEqual(r.seq,[5,5,5]);
/* UI: 3D Teams tab, stage, list link, celebration once */
await p.evaluate(()=>{UI.au.dtab='fm';UI.fm.tid='t1';UI.fm.tab='3d';UI.fm.cele=null;aucOf('a1').teams[0].seenSeq=aucOf('a1').teams[0].lastSeq;render()});await p.waitForTimeout(300);
assert.equal(await p.locator('.fmav').count(),5,'one avatar per squad member');assert.equal(await p.locator('.fmli').count(),5);assert.equal(await p.locator('#sh-fmc').count(),0,'no replay of a seen purchase');
await p.click('.fmli >> nth=1');assert.equal(await p.locator('.fmav.hi').count(),1,'list selection highlights the avatar');
await p.evaluate(()=>document.querySelector('.fmav').click());await p.waitForTimeout(200);assert.ok(await p.locator('#modal').innerText().then(t=>/Player/.test(t)),'avatar opens the player card');await p.evaluate(()=>{UI.modal=null;renderModal()});
/* a new committed sale plays one celebration with Back to Live Bidding */
await p.evaluate(()=>{const a=aucOf('a1');a.cur='p5';a.bid=120;a.bidTeam='t1';UI.au.dtab='live';render();A.auSold()});await p.waitForTimeout(300);
assert.equal(await p.locator('#sh-fmc').count(),1);assert.match(await p.locator('#sh-fmc').innerText(),/SOLD[\s\S]*WELCOME TO HAWKS/);assert.equal(await p.locator('#sh-fmc .fmav').count(),6);
await p.click('#sh-fmc [data-a=fmClose]');assert.equal(await p.locator('#sh-fmc').count(),0);
/* pending bid adds nobody */
const n=await p.evaluate(()=>{const a=aucOf('a1');a.cur='p6';A.auBid({v:'t1'});return shFormation(a,a.teams[0]).all.length});assert.equal(n,6);
/* owner dashboard hero + empty stage text */
await p.evaluate(()=>{UI.au.dtab='teams';render()});assert.match(await p.locator('#app').innerText(),/MY 3D TEAM/);
await p.evaluate(()=>{UI.au.dtab='fm';UI.fm.tid='t2';render()});assert.match(await p.locator('#app').innerText(),/Your team formation begins with your first player/);
assert.deepEqual(errs,[]);console.log('PASS auction 3D team build-up');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
