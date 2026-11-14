// Ball flight (six/four) + selectable colours + score bar colours + sound plan
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{});window.__ac=[];window.AudioContext=function(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination={};const mk=()=>({connect(){},start(){window.__ac.push('s')},stop(){},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},gain:{cancelScheduledValues(){},setValueAtTime(){},exponentialRampToValueAtTime(){}},Q:{},type:''});this.createBuffer=()=>({getChannelData:()=>new Float32Array(16000)});this.createBufferSource=mk;this.createBiquadFilter=mk;this.createGain=mk;this.createOscillator=mk;this.resume=()=>{}}});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=card#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Aarav','Omar','Hasan','Rao','Iqbal','Shah','Nair','Dar','Ali','Khan','Roy','Raz','Mal','Zai','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:'BAT',team:i<11?'a':'b',jersey:i+1}));S.teams=[{id:'a',name:'Sky High Kings',short:'SHK',color:'#1d4ed8',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Hapur Hawks',short:'HAH',color:'#16a34a',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});startInnings(m,0,'p0','p1','p11');m.status='live';S.stream.mid=m.id;save()});
const shot=async(id,t,n)=>{await p.goto(base+'?scene=anim&id='+id+'&t='+t+'#overlay');await p.waitForTimeout(250);await p.screenshot({path:'/tmp/claude-0/mod/'+n+'.png'})};
for(const t of [.6,1.2,1.75,1.95,2.4]) await shot('3_six',t,'six_'+t);
for(const t of [.5,.8,1.1,1.4]) await shot('3_four',t,'four_'+t);
// ball position: rises then falls (six)
const ys=[];for(const t of [.4,.7,1.0,1.3,1.6]){await p.goto(base+'?scene=anim&id=3_six&t='+t+'#overlay');await p.waitForTimeout(120);ys.push(await p.evaluate(()=>{const e=document.querySelector('.al-fly.al-six .al-px:not(.al-g):not(.al-h) .al-bl');return e?Math.round(e.getBoundingClientRect().top):null}))}
console.log('six ball y',ys);ok(ys.every(v=>v!=null),'ball present');ok(ys[2]<ys[0]&&ys[4]>ys[2],'six arcs up then down');
// colours
const col=async(c)=>{await p.goto(base+'?scene=anim&id=3_six&t=1#overlay');await p.waitForTimeout(200);await p.evaluate(c=>{S.stream.colors=c;save()},c);await p.waitForTimeout(1900);return p.evaluate(()=>getComputedStyle(document.querySelector('.al')).getPropertyValue('--c1').trim())};
const a=await col({mode:'team',target:'bat'}),b2=await col({mode:'team',target:'bowl'}),c1=await col({mode:'preset',preset:4}),c2=await col({mode:'custom',c1:'#123456'});
console.log('colours',a,b2,c1,c2);ok(a!==b2&&c1!==a&&c2==='#123456','colour modes');
// constant across events
const set=new Set();for(const e of ['four','six','wicket','fifty']){await p.goto(base+'?scene=anim&id=5_'+e+'&t=1#overlay');await p.waitForTimeout(80);set.add(await p.evaluate(()=>getComputedStyle(document.querySelector('.al')).getPropertyValue('--c1').trim()))}
ok(set.size===1,'colour constant across events '+[...set]);
// score bar
await p.evaluate(()=>{S.stream.colors={mode:'team',target:'bat',bar:'custom',h1:'#00ff00',h2:'#003300',bg:'#220022'};save()});await p.waitForTimeout(500);
await p.goto(base+'?scene=toss&t=4#overlay');await p.waitForTimeout(300);
const hub=await p.evaluate(()=>{const h=document.querySelector('.rb-hub2');return h?getComputedStyle(h).backgroundImage:'none'});console.log('hub',hub);ok(/0, 255, 0/.test(hub),'score bar custom colour');
await p.screenshot({path:'/tmp/claude-0/mod/bar_custom.png'});
// sound
await p.goto(base+'?scene=anim&id=3_six&t=1&sound=1#overlay');await p.waitForTimeout(150);
const pl=await p.evaluate(()=>[shSfx.on(),...shSfx.kinds.map(k=>shSfx.play(k))]);console.log('sfx',pl.join());ok(pl.every(Boolean),'all sfx play');ok(await p.evaluate(()=>window.__ac.length)>20,'nodes started');
// tournament fours/sixes
const f=await p.evaluate(()=>{const m=S.matches[0];return shStats.tourFS(m,'p0')});console.log('tourFS',JSON.stringify(f));ok(typeof f.f4==='number','tourFS');
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: flight-colors');})();
