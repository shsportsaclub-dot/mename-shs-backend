const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sports-live-'));
 const source=path.resolve(process.env.TEST_SERVER_FILE||'server.js');
 const child=spawn(process.execPath,[source],{env:{...process.env,PORT:'18949',DATA_FILE:path.join(tmp,'data.json'),DATABASE_URL:'',SESSION_SECRET:'local-sports-test-only',SMS_PROVIDER:'console',EMAIL_PROVIDER:'console',CRIC_API_KEY:''},stdio:['ignore','pipe','pipe']});
 child.stdout.resume();child.stderr.resume();
 let browser;
 const base='http://127.0.0.1:18949';
 const post=async(path,body,token)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return r.json()};
 try{
  let ready=false;for(let i=0;i<200;i++){try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,25))}assert.ok(ready);
  const owner=await post('/api/auth/register',{phone:'9000000001',cc:'91',pin:'135790',profile:{nick:'LocalScorer',age:30,kind:'Organiser'}});
  const watcher=await post('/api/auth/register',{phone:'9000000002',cc:'91',pin:'135790',profile:{nick:'LocalViewer',age:30,kind:'Fan'}});
  assert.ok(owner.ok);assert.ok(watcher.ok);
  browser=await chromium.launch({headless:true});
  const p=await browser.newPage({viewport:{width:412,height:915}}),v=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));v.on('pageerror',e=>errors.push(e.message));
  for(const [page,user]of [[p,owner],[v,watcher]]){
   await page.goto(base);await page.waitForTimeout(200);
   await page.evaluate(({user,base})=>{S.user={...user.profile,name:user.profile.nick};S.tok=user.token;S.settings.apiUrl=base;S.prefs={...S.prefs,asked:1,welcomed:1,country:'IN',sports:['cricket','football','kabaddi','badminton','volleyball'],primary:'cricket'};S.sg=[];UI.stage='app';UI.view='home';render();},{user,base});
  }
  const cases=[];
  const cricket=await p.evaluate(async()=>{
   const a=S.teams[0],b=S.teams[1];
   const m=newMatch({a:a.id,b:b.id,overs:2,toss:a.id,dec:'bat',xiA:a.players.slice(0,11),xiB:b.players.slice(0,11),umpires:'Local test'});
   startInnings(m,0,a.players[0],a.players[1],b.players[0]);ball(m,{r:4});commit();await shPush();return {id:m.id,score:calc(m,0).runs};
  });
  await v.evaluate(()=>shPull());
  assert.equal(await v.evaluate(id=>calc(S.matches.find(m=>m.id===id),0).runs,cricket.id),4);cases.push({sport:'cricket',score:4});
  for(const sport of ['football','kabaddi','bd','vb']){
   const created=await p.evaluate(async sport=>{
    const f=new FormData();f.set('n0','TEST '+sport+' Home');f.set('n1','TEST '+sport+' Away');
    if(sport==='football'){f.set('half','45');f.set('size','11');F.fbNew(f);A.fbPh({v:'h1'});const e=new FormData();e.set('ty','goal');e.set('tm','0');e.set('pl','Test Player');F.fbEv(e);}
    else{f.set('sp',sport);f.set('best',sport==='vb'?'5':'3');f.set('half','20');F.s2New(f);
     if(sport==='kabaddi'){document.getElementById('krt').value='0';document.getElementById('krn').value='1';A.kbEv({ty:'raid'});}
     else A.rsPt({w:'0'});
    }
    const m=sgCur();await shPush();return {id:m.id,sum:s2Sum(m)};
   },sport);
   await v.evaluate(()=>shPull());
   const read=await v.evaluate(id=>{const m=sgGet(id);UI.sgid=id;UI.view='sgame';render();return {sum:s2Sum(m),remote:m.rm,allowed:can()};},created.id);
   assert.equal(read.sum,created.sum);assert.equal(read.remote,1);assert.equal(read.allowed,false);
   assert.equal(await v.locator('[data-a="rsPt"],[data-a="kbEv"],[data-a="fbPh"]').count(),0);
   const forbidden=await fetch(base+'/api/shared/sports/'+created.id,{method:'PUT',headers:{'content-type':'application/json',authorization:'Bearer '+watcher.token},body:JSON.stringify({data:{m:{id:created.id,sport,tn:['Other','Other']}}})});
   assert.equal(forbidden.status,403);
   cases.push({sport,score:created.sum,readOnly:true});
  }
  fs.mkdirSync('runtime-evidence',{recursive:true});
  await p.screenshot({path:'runtime-evidence/scorer-volleyball.png',fullPage:true});
  await v.screenshot({path:'runtime-evidence/viewer-volleyball.png',fullPage:true});
  assert.deepEqual(errors,[]);
  fs.writeFileSync('runtime-evidence/sports-live.json',JSON.stringify({scope:'Local isolated backend and browser test; fictional fixtures; no production match/SMS created',cases},null,2));
  console.log('PASS: cricket + football + kabaddi + badminton + volleyball scorer-to-server-to-viewer, read-only permissions.');
 }finally{if(browser)await browser.close();child.kill();await new Promise(r=>child.once('exit',r));fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
