// Drives the REAL scorer screen (the app's own buttons) through a full 5-over-a-side match.
// H = hooks for the video (tap ring, captions, enlarge the scorer for the wicket sheet). In a plain test the hooks do nothing.
const INN1=['1','0','4','1','0','6', '2','1','wd','0','4','Wbowled','1', '6','1','4','0','Wcaught','2', '0','1','nb','6','1','4','2', '4','1','0','Wlbw','2','6'];
const INN2=['4','1','6','0','4','1', '2','wd','6','Wcaught','1','4','0', '6','0','4','1','Wbowled','6', '1','0','4','Wcaught','2','1', '1','wd','0','2','Wbowled','1','6'];
module.exports=async function runMatch(sc,H,log){
 const sleep=H.sleep||(()=>0),st=()=>sc.evaluate(()=>{const m=S.matches.find(x=>x.demo===3);const k=m.innings.map(i=>i.ev.length).join('/');return m.status+' inn'+m.cur+' ev '+k+' '+(m.result||'')});
 const click=l=>l.evaluate(e=>e.click());
 const tap=async(loc,label,alt)=>{await H.tap(loc,label,alt);await click(loc)};
 const has=async sel=>(await sc.locator(sel).count())>0;
 async function pickNext(){
  if(await has('[data-a="pickBat"]')){await H.big(false);await tap(sc.locator('[data-a="pickBat"]').first(),'NEW BATTER COMES IN');await sleep(800)}
  if(await has('[data-a="pickBowl"]')){await H.big(false);await tap(sc.locator('[data-a="pickBowl"]').first(),'NEXT BOWLER');await sleep(800)}}
 async function ball(t){
  await pickNext();
  if(/^W/.test(t)){const kind=t.slice(1),T=kind==='lbw'?'LBW':kind[0].toUpperCase()+kind.slice(1);
   const T0=Date.now(),lg=m=>log&&log('   wk '+m+' '+(Date.now()-T0)+'ms');await tap(sc.locator('[data-a="wicket"]').first(),'W  WICKET');lg('tapW');await H.big(true);lg('big');await sleep(900);await H.cap('Wicket details: how out, bowler, fielder');lg('cap');
   await tap(sc.locator('[data-a="wkType"][data-v="'+T+'"]').first(),T.toUpperCase(),'sheet');lg('type');await sleep(500);
   await tap(sc.locator('button:has-text("Save wicket")').first(),'SAVE WICKET','sheet');lg('save');await sleep(500);await H.big(false);lg('small');await sleep(900)}
  else if(t==='wd'||t==='nb'){await tap(sc.locator('[data-a="ex"][data-v="'+t+'"]').first(),t==='wd'?'WIDE':'NO BALL');await tap(sc.locator('[data-a="run"][data-v="0"]').first(),'0 (+1 extra added)')}
  else await tap(sc.locator('[data-a="run"][data-v="'+t+'"]').first(),t==='4'?'4  FOUR':t==='6'?'6  SIX':t==='0'?'0  DOT BALL':t+(t==='1'?'  RUN':'  RUNS'));
  await sleep(/^W|^6$|^4$/.test(t)?7000:4500)}
 async function inn(tokens,name){for(let i=0;i<tokens.length;i++){await ball(tokens[i]);if(log&&(i+1)%6===0)log(name+' ball '+(i+1)+' '+await st())}}
 log&&log('start '+await st());
 await H.cap('Scorer taps a ball: the broadcast above updates instantly',5000);
 if(process.env.SHORT){await inn(INN1.slice(0,14),'inn1');return {}}
 await inn(INN1,'inn1');log&&log('inn1 done '+await st());
 if(H.breakHook)await H.breakHook(sc);
 // start the second innings with the app's own Start innings form
 await H.cap('Innings break. The scorer starts the chase with the app\'s Start innings form.',5000);
 const f=sc.locator('form[data-f="startInn"]');
 await f.evaluate(e=>{e.scrollIntoView({block:'start'});window.scrollBy(0,-6)});await sleep(1200);
 await tap(sc.locator('form[data-f="startInn"] button').first(),'START INNINGS');await sleep(2500);
 log&&log('inn2 started '+await st());
 await inn(INN2,'inn2');
 log&&log('match end '+await st());
 return {st};
};
