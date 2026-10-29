// Tennis table centred; basketball/football arena: coloured starters, ball goes to the end that just scored.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});});
const t=await p.evaluate(()=>{document.getElementById('app').innerHTML=window.shTnBoard({key:'z',p:['Mashtakov','Ravasio'],sets:[1,0],games:[1,4],pts:['40','-'],prev:[[6,4]],srv:1});window.ar9Zoom&&ar9Zoom();const h=document.querySelector('.tnh .hero').getBoundingClientRect(),q=document.querySelector('.tnt').getBoundingClientRect(),bx=document.querySelector('.tnh .box').getBoundingClientRect();return {off:Math.abs((q.left+q.right)/2-(bx.left+bx.right)/2),w:q.width,bw:bx.width}});
ok(t.off<4&&t.w<t.bw,'tennis table centred '+JSON.stringify(t));
const mk=(sc)=>p.evaluate(([sc])=>{const L=n=>({starters:Array.from({length:n},(_,i)=>({number:i+1,name:'P'+i})),bench:[]});document.getElementById('app').innerHTML=window.shArena('basketball',{key:'b1',sc,home:'HOM',away:'AWY',live:true,lu:{l:L(5),r:L(5)},events:[]});const ball=document.getElementById('arball').style.transform;return {n:document.querySelectorAll('.arena .pl').length,ball,cap:document.getElementById('arcap').textContent,leg:!!document.querySelector('.arleg')}},[sc]);
let r=await mk([10,8]);ok(r.n===10&&r.leg&&/160px/.test(r.ball),'start '+JSON.stringify(r));
r=await mk([13,8]);ok(/288px/.test(r.ball)&&/THREE/.test(r.cap)&&/HOM/.test(r.cap),'home 3 '+JSON.stringify(r));
r=await mk([13,10]);ok(/32px/.test(r.ball)&&/AWY \+2/.test(r.cap),'away 2 '+JSON.stringify(r));
await p.screenshot({path:'/tmp/arena.png'});
const f=await p.evaluate(()=>{const L=n=>({starters:Array.from({length:n},(_,i)=>({number:i+1,name:'P'+i}))});document.getElementById('app').innerHTML=window.shArena('football',{key:'f1',sc:[0,0],home:'H',away:'A',lu:{l:L(11),r:L(11)},events:[]});return document.querySelectorAll('.arena .pl').length});
ok(f===22,'football 22 '+f);
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: arena players');})();
