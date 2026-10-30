const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1000,height:700}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'admin',kind:'Scorer'};S.prefs={...S.prefs,asked:1,welcomed:1};
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
const t={id:'t1',name:'Cup',teams:['a','b'],fixtures:[{id:'f1',a:'a',b:'b',date:'2026-11-05',mid:null}],overs:20,kind:'tournament'};S.tours=[t];
const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});m.tid='t1';S.matches.push(m);startInnings(m,0,'p0','p1','p11');S.stream.mid=m.id;
const o={};const bl=()=>{const i=m.innings[0];if(i.cur.bl==null)i.cur.bl='p11'};
bl();ball(m,{r:1});bl();ball(m,{r:6});o.six=S.stream.fx&&S.stream.fx.k==='six';o.sixHtml=/ovfx/.test(overlayHTML())&&/SIX/.test(overlayHTML());
bl();ball(m,{r:4});o.four=S.stream.fx.k==='four';
bl();ball(m,{w:'Bowled',out:m.innings[0].cur.s});o.wk=S.stream.fx&&S.stream.fx.k==='wicket';
if(!m.innings[0].cur.s){m.innings[0].cur.s='p2';m.innings[0].used.push('p2')}const need=['intro','xi','fow','card','points','fix','lead','qr'];o.gfx={};
for(const k of need){S.stream.gfx=k;const h=overlayHTML();o.gfx[k]=/ovgfx/.test(h)&&h.length>400}
S.stream.gfx='points';o.pointsHas=/Cup/.test(overlayHTML())&&/India/.test(overlayHTML());S.stream.gfx='xi';o.xiHas=/Player 0/.test(overlayHTML())&&/Player 11/.test(overlayHTML());S.stream.gfx='qr';o.qrImg=/<img src="data:image\/png/.test(overlayHTML());
S.stream.gfx='';S.stream.pos='r';S.stream.size='l';S.stream.safe=true;o.pos=/data-pos="r"/.test(overlayHTML())&&/data-size="l"/.test(overlayHTML())&&/data-safe="1"/.test(overlayHTML());
S.stream.fxOn=false;o.fxOff=!/class="ovfx"/.test(overlayHTML());S.stream.fxOn=true;
UI.view='stream';render();o.card=!!document.getElementById('ovpack');
A.ovPv({v:'fow'});o.preview=!!document.querySelector('#ovpack .ovprev .ovgfx')&&S.stream.gfx==='';
A.ovTake();o.take=S.stream.gfx==='fow';A.ovPv({v:'card'});A.ovQueue();A.ovPv({v:'lead'});A.ovQueue();o.q=S.stream.q.length===2;A.ovNext();o.next=S.stream.gfx==='card'&&S.stream.q.length===1;
o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));
for(const k of ['six','sixHtml','four','wk','pointsHas','xiHas','qrImg','pos','fxOff','card','preview','take','q','next','fit'])ok(r[k],k);for(const k of Object.keys(r.gfx))ok(r.gfx[k],'gfx '+k);
ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS overlay pack');await b.close()})()
