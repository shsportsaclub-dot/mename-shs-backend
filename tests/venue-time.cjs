const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({timezoneId:'Asia/Kolkata'}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const same=wWhen({time:'2026-11-02T09:00:00.000Z',tz:'Asia/Kolkata'}),none=wWhen({time:'2026-11-02T09:00:00.000Z'}),far=wWhen({time:'2026-11-02T09:00:00.000Z',tz:'Australia/Sydney'}),bad=wWhen({time:'2026-11-02T09:00:00.000Z',tz:'Not/AZone'});
 UI.stage='app';S.user={name:'QA',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
 render();A.newMatch();const q=UI.qs;q.step=2;shQsShow();document.getElementById('qs-date').value='2026-11-02';document.getElementById('qs-time').value='14:30';shQsRead();q.venue='QA Ground';q.step=3;shQsShow();A.qsStart();const m=S.matches[S.matches.length-1];
 return {same,none,far,bad,tz:m&&m.tz,w:shLocalWorld(m).m.tz}});
console.log(JSON.stringify(r));
ok(!/ground/.test(r.same)&&/2:30/.test(r.same),'same zone: one time only '+r.same);ok(!/ground/.test(r.none),'no tz');ok(/your time \(.*(GMT|AEDT|AEST|\+11|\+10).*at the ground/.test(r.far)&&/8:00/.test(r.far),'sydney venue shown '+r.far);ok(!/ground/.test(r.bad),'bad tz ignored');ok(/Asia\/(Kolkata|Calcutta)/.test(r.tz)&&r.w===r.tz,'match stores venue tz');
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS venue local time');await b.close()})()
