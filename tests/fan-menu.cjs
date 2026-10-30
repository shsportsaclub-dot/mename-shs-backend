const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'admin'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.view='home';render()});await p.waitForTimeout(300);
const spots=[['left-mid',20,400],['right-mid',340,400],['bottom-centre',166,720],['top-centre',166,80]];
for(const [n,x,y] of spots){
 await p.evaluate(([x,y])=>{const e=document.querySelector('.fabfloat');e.style.setProperty('left',x+'px','important');e.style.setProperty('top',y+'px','important');e.style.setProperty('right','auto','important');e.style.setProperty('bottom','auto','important');e.style.setProperty('transform','none','important')},[x,y]);
 await p.evaluate(()=>{UI.fabMoved=0;A.plus()});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>[...document.querySelectorAll('.fan-it')].map(e=>{const r=e.getBoundingClientRect();return[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]}));
 ok(r.length===6,n+' six options');ok(r.every(q=>q[0]>=0&&q[2]<=390&&q[1]>=0&&q[3]<=800),n+' all on screen '+JSON.stringify(r));
 const cx=await p.evaluate(()=>{const x=document.querySelector('.fan-x').getBoundingClientRect();return x.left+x.width/2}),mx=r.reduce((a,q)=>a+(q[0]+q[2])/2,0)/6;
 if(n==='left-mid')ok(mx>cx,'fan opens to the right of a left icon');if(n==='right-mid')ok(mx<cx,'fan opens to the left of a right icon');
 const ov=await p.evaluate(()=>{const it=[...document.querySelectorAll('.fan-it')];let o=0;for(let i=0;i<it.length;i++)for(let j=i+1;j<it.length;j++){const a=it[i].querySelector('i').getBoundingClientRect(),c=it[j].querySelector('i').getBoundingClientRect();if(a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom)o++}return o});ok(ov===0,n+' no overlapping icons');
 if(n==='left-mid')await p.screenshot({path:'/tmp/claude-0/fan-left.png'});if(n==='bottom-centre')await p.screenshot({path:'/tmp/claude-0/fan-bottom.png'});
 await p.evaluate(()=>A.fanClose());
}
await p.evaluate(()=>A.plus());await p.waitForTimeout(100);await p.click('.fan-it[data-v=academy]');ok(await p.evaluate(()=>UI.view==='academy'&&!UI.fan&&!document.getElementById('fanmenu')),'Academy opens');
await p.evaluate(()=>A.plus());await p.click('.fan-it[data-v=olx]');ok(await p.evaluate(()=>UI.view==='market'&&UI.mk.tab==='used'),'OLX');
await p.evaluate(()=>A.plus());await p.click('.fan-it[data-v=tour]');ok(await p.evaluate(()=>UI.view==='tours'),'tournament');
await p.evaluate(()=>A.plus());await p.click('.fan-it[data-v=book]');ok(await p.evaluate(()=>UI.view==='book'),'book');
await p.evaluate(()=>A.plus());await p.click('.fan-it[data-v=match]');ok(await p.evaluate(()=>!!document.querySelector('.modal,#modal,[class*=modal]')||UI.view==='matches'),'start match');
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: fan menu');})();
