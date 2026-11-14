// One ticker = ONE animation style: every event in a ticker uses the same family, font, easing, tilt, chip style and entrance.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
const evs=['four','six','wicket','fifty','hundred','hattrick','freehit','noball','wide','maiden','drs'];const looks=new Set();
for(let f=1;f<=20;f++){const L=new Set(),M=new Set();
 for(const e of evs){await p.goto(base+'?scene=anim&id='+f+'_'+e+'&t=2.6#overlay');await p.waitForTimeout(60);
  const r=await p.evaluate(()=>{const a=document.querySelector('.al'),st=a.getAttribute('style'),g=k=>(st.match(new RegExp('--'+k+':([^;]+)'))||[])[1];const c=document.querySelector('.al-mc');return{look:[g('ff'),g('ez'),g('r'),g('k')].join('|'),fam:a.firstElementChild.className,chip:c?c.className.replace(/\bal-mc\b/,'').trim():''}});
  L.add(r.look);M.add(r.fam+'#'+r.chip)}
 ok(L.size===1,'family '+f+' look varies per event: '+[...L].join(' / '));ok(M.size===1,'family '+f+' style/chip varies per event: '+[...M].join(' / '));looks.add([...L][0]+'#'+[...M][0].split('#')[1])}
ok(looks.size>=19,'tickers look different from each other '+looks.size);
// live: auto mode keeps ONE family for a whole match
await p.goto(base+'?scene=card#overlay');await p.waitForTimeout(400);
await p.evaluate(()=>{S.matches=[];const nmz=['Clarke','Omarzai','Hasan','Rao','Iqbal','Shah','Nair','Dar','Ali','Khan','Roy','Razzaq','Malik','Zaidi','Lone','Bose','Sen','Gill','Vaz','Pir','Tej','Mir'];S.players=nmz.map((n,i)=>({id:'p'+i,name:n,role:'BAT',team:i<11?'a':'b'}));S.teams=[{id:'a',name:'United Tigers',short:'UNT',color:'#7c3aed',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Emirates Eagles',short:'EME',color:'#0f766e',players:S.players.slice(11).map(p=>p.id)}];const m=newMatch({a:'a',b:'b',overs:10,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'H'});startInnings(m,0,'p0','p1','p11');m.status='live';m.innings[0].cur.bl='p11';S.stream.mid=m.id;S.stream.alMode='variety';save();window.__nx=2;
 window.step=x=>{const m=S.matches[0],inn=m.innings[0];if(!inn.cur.bl)inn.cur.bl='p'+(11+(window.__nx%4));if(!inn.cur.s)inn.cur.s='p'+(window.__nx++);if(x==='W')ball(m,{r:0,w:1,out:inn.cur.s});else if(x==='wd')ball(m,{x:'wd',r:0});else ball(m,{r:x});save()}});
await p.waitForTimeout(1500);const fams=new Set(),words=[];
for(const x of [4,6,'W','wd',4,6]){await p.evaluate(x=>step(x),x);await p.waitForTimeout(1700);
 const r=await p.evaluate(()=>{const a=document.querySelector('.alr .al');return a?{fam:a.firstElementChild.className,txt:a.innerText.split('\n')[0]}:null});
 ok(!!r,'ticker shown for '+x);if(r){fams.add(r.fam);words.push(r.txt)}await p.waitForTimeout(2200)}
console.log('live words',words.join(','),'families',[...fams].join(','));ok(fams.size===1,'auto mode used '+fams.size+' families in one match');
ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: ticker consistency');})();
