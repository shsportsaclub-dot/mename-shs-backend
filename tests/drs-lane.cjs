// DRS studio + scroll lane: verdict engine, segments, logging, reviews left, lane rules, overlay scenes, 390px.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.fetch=()=>new Promise(()=>{});UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});});
// --- engine
const V=await p.evaluate(()=>{const v=(o)=>DRSX.verdict(Object.assign({kind:'lbw',onf:'out',nb:'behind',heat:'none',edge:'no',pitch:'line',impact:'line',wickets:'hit',shot:'yes',far:false,hv:false,line:'in',catchc:'clean'},o)).res;
 return{lbwOut:v({}),edge:v({edge:'yes'}),heatBat:v({heat:'bat'}),leg:v({pitch:'leg'}),miss:v({wickets:'miss'}),uc:v({wickets:'uc'}),nb:v({nb:'over'}),cbOut:v({kind:'cb',edge:'yes'}),cbNo:v({kind:'cb',edge:'no',heat:'none'}),cbGround:v({kind:'cb',edge:'yes',catchc:'grounded'}),roIn:v({kind:'ro',line:'on'}),roOut:v({kind:'ro',line:'out'}),stOut:v({kind:'st',line:'out'}),inc:v({kind:'cb',edge:'na',heat:'none'}),lbwNoTrack:v({pitch:''})}});
ok(V.lbwOut==='OUT','lbw out '+V.lbwOut);ok(V.edge==='NOT OUT','edge first so not lbw');ok(V.heatBat==='NOT OUT','bat heat so not lbw');ok(V.leg==='NOT OUT','pitched leg');ok(V.miss==='NOT OUT','missing');ok(V.uc==="UMPIRE'S CALL",'umpires call');ok(V.nb==='NO BALL','no ball precedence');
ok(V.cbOut==='OUT'&&V.cbNo==='NOT OUT'&&V.cbGround==='NOT OUT','caught behind rules');ok(V.roIn==='NOT OUT'&&V.roOut==='OUT'&&V.stOut==='OUT','run out / stumped line');ok(V.inc==='INCOMPLETE'&&V.lbwNoTrack==='INCOMPLETE','incomplete inputs refused '+V.inc+V.lbwNoTrack);
// --- screen (needs a match)
await p.evaluate(()=>{S.matches=[];S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'QA'});UI.sid=m.id;UI.mid=m.id;const f=new FormData();f.set('mid',m.id);f.set('i','0');f.set('s','p0');f.set('n','p1');f.set('bl','p12');F.startInn(f);ball(m,{r:1,x:'',ang:null});m.status='live';render()});
await p.evaluate(()=>{UI.view='drsx';render()});await p.waitForTimeout(200);
let t=await p.evaluate(()=>document.body.innerText.toLowerCase());
for(const w of ['call badge','heat-check','sound-trace','ball tracking','front-foot','verdict'])ok(t.includes(w),'segment '+w);
ok(await p.$('.dx svg'),'svgs');
// segment set changes with kind
await p.click('[data-a=dxSet][data-k=kind][data-v=ro]');t=await p.evaluate(()=>document.body.innerText.toLowerCase());ok(!t.includes('heat-check')&&t.includes('front-foot'),'run out hides heat');
await p.click('[data-a=dxSet][data-k=kind][data-v=lbw]');
// edge makes verdict NOT OUT and shows reason
await p.click('[data-a=dxSet][data-k=edge][data-v=yes]');t=await p.evaluate(()=>document.getElementById('dxVd').innerText);ok(/NOT OUT/.test(t)&&/Edge on the bat/.test(t),'edge verdict text '+t.slice(0,80));
// themes
for(const i of [1,2,0]){await p.click('[data-a=dxTheme][data-v="'+i+'"]');ok(await p.evaluate(i=>!!document.querySelector('.dx.dx-t'+i),i),'theme '+i)}
// heat scrub
await p.click('[data-a=dxSet][data-k=heat][data-v=bat]');await p.evaluate(()=>{const r=document.querySelector('.dx input[type=range]');r.value=8;DRSX.fr(r)});
ok(await p.evaluate(()=>+getComputedStyle(document.querySelector('.dx .th')).getPropertyValue('--hf')<0.3),'heat decays');
// logging: set a clean LBW out and log
await p.click('[data-a=dxSet][data-k=edge][data-v=no]');await p.click('[data-a=dxSet][data-k=heat][data-v=none]');
const hasM=await p.evaluate(()=>!!(S.matches&&S.matches.length&&st(S.matches[S.matches.length-1])));
if(hasM){await p.click('[data-a=dxSet][data-k=onf][data-v=not]');const before=await p.evaluate(()=>{const m=curM();const D=drsInit(m);return D.log.length});await p.click('[data-a=dxLog]');await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const m=curM(),D=drsInit(m);return{n:D.log.length,last:D.log[D.log.length-1],fx:S.stream.drsfx}});ok(r.n===before+1,'logged');ok(r.fx&&r.fx.res==='OUT','overlay fx '+JSON.stringify(r.fx));ok(r.last&&/Overturned/.test(r.last.out),'overturned keeps review '+(r.last&&r.last.out))}
else console.log('NOTE: no live match in seed; logging path not exercised');
ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'drs no overflow 390');
await p.screenshot({path:'/tmp/claude-0/pt/drsx.png',fullPage:false});
// --- send to TV
await p.evaluate(()=>{UI.view='drsx';render()});
for(const seg of ['heat','snd','trk','line','vd']){await p.evaluate(()=>{UI.dx.kind='lbw';render()});await p.click('[data-a=dxAir][data-v='+seg+']');const h=await p.evaluate(()=>{UI.ovScene='drs';const v=UI.view;UI.view='stream';const r=overlayHTML();UI.view=v;return r});ok(/dxa/.test(h)&&/<svg|dxvd/.test(h),'TV segment '+seg)}
await p.click('[data-a=dxAir][data-v=off]');ok(await p.evaluate(()=>!S.stream.dxlive),'TV cleared');
ok(await p.evaluate(()=>{UI.ovScene='break';const v=UI.view;UI.view='stream';const r=overlayHTML();UI.view=v;return !/dxl/.test(r)}),'no lane on break card');
// --- lane
await p.evaluate(()=>{UI.view='lane';render()});await p.waitForTimeout(150);
const add=async(type,text,sp)=>{await p.selectOption('form[data-f=lnAdd] select[name=type]',type);await p.fill('form[data-f=lnAdd] input[name=text]',text);await p.fill('form[data-f=lnAdd] input[name=sponsor]',sp||'');await p.click('form[data-f=lnAdd] button');await p.waitForTimeout(120)};
await add('announce','Final at 6 pm, gates open 4 pm');ok(await p.evaluate(()=>S.lane.items.length===1),'item added');
await add('advert','Fresh juice at the pavilion','');ok(await p.evaluate(()=>S.lane.items.length===1&&/sponsor/i.test(document.body.innerText)),'advert without sponsor refused');
await add('advert','Fresh juice at the pavilion','Raju Juice');ok(await p.evaluate(()=>S.lane.items.length===2),'advert with sponsor added');
await add('info','Online betting offers inside','');ok(await p.evaluate(()=>S.lane.items.length===2),'betting text blocked');
const long=await p.evaluate(()=>LANE.check({type:'info',text:'x'.repeat(141)}));ok(!!long,'141 chars refused');
const H=await p.evaluate(()=>{S.messages=[];const out={};for(const [k] of LANE.styles){S.lane.style=k;out[k]=LANE.html('t')}return out});
for(const k of Object.keys(H)){ok(H[k].includes('dxl-'+k)&&/SPONSORED/.test(H[k])||H[k].includes('dxl-'+k),'style '+k)}
ok(/SPONSORED/.test(H.plain)||/SPONSORED/.test(H.pin),'sponsored label shown');
// styles distinct
const sty=await p.evaluate(()=>{const css=[...document.styleSheets].flatMap(s=>{try{return[...s.cssRules]}catch(e){return[]}}).filter(r=>r.type===7&&/^dxl/.test(r.name)).map(r=>r.name);return css});ok(new Set(sty).size>=5,'distinct keyframes '+sty.join(','));
// rtl
const rt=await p.evaluate(()=>{S.lane.items.unshift({id:'r',type:'announce',lang:'ur',text:'ٹاس 5 بجے',on:true,pri:3});S.lane.style='plain';return LANE.html('x')});ok(/rtl/.test(rt),'rtl class');
// urgent alert replaces scroll
await p.evaluate(()=>{S.lane.items=S.lane.items.filter(x=>x.id!=='r');S.messages.push({id:'z',text:'WICKET! Bowled',kind:'alert',t:Date.now(),off:false})});ok(await p.evaluate(()=>/WICKET! Bowled/.test(LANE.html('x'))&&/>LIVE</.test(LANE.html('x'))),'urgent shows alone');
// in-app + overlay
await p.evaluate(()=>{S.messages=S.messages.filter(x=>x.id!=='z');S.lane.style='tape';S.lane.items.push({id:'q',type:'announce',lang:'en',text:'Tea break 20 min',on:true})});
const ovh=await p.evaluate(()=>{S.stream.drsfx={at:Date.now(),res:'OUT',cls:'out',why:'Hitting',kind:'LBW',team:'IND'};UI.ovScene='drs';UI.view='stream';return overlayHTML()});ok(/OUT/.test(ovh)&&/dxo/.test(ovh),'drs scene');
const ovl=await p.evaluate(()=>{UI.ovScene='lane';return overlayHTML()});ok(/dxl-tape/.test(ovl),'lane scene');
await p.evaluate(()=>{UI.view='lane';render()});ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'lane no overflow 390');
await p.screenshot({path:'/tmp/claude-0/pt/lane.png'});
// reduced motion respected via css
ok(await p.evaluate(()=>[...document.querySelectorAll('style')].some(s=>/prefers-reduced-motion/.test(s.textContent)&&/dxl/.test(s.textContent))),'reduced motion css');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: drs studio + lane');})();
