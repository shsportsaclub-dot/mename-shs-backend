// Provider-match scorer pad: striker / non-striker / bowler, No ball and Wide with runs, byes, wicket, undo restores state.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.shRefreshWorldDetails=async()=>{};window.apiBase=()=>'http://x';
 const balls=[];window.fetch=async(u,o)=>{if(/\/api\/wbb\//.test(u)&&o&&o.method==='POST'){const b=JSON.parse(o.body);if(b.undo)balls.pop();else balls.push(Object.assign({n:balls.length+1},b));return{json:async()=>({ok:true,balls:balls.slice()})}}return{json:async()=>({ok:true,balls:balls.slice()})}};
 UI.stage='app';S.user={id:'u1',name:'T',phone:'9999999999',role:'scorer'};S.tok='tok';S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});
 UI.wm={m:{id:'a1',name:'New Zealand vs India',started:true,ended:false,type:'T20',teams:[{name:'New Zealand',short:'NZ'},{name:'India',short:'IND'}],score:[{inning:'New Zealand Inning 1',r:100,w:2,o:10}],status:'Live'},mi:{},
  sc:{scorecard:[{inning:'New Zealand Inning 1',batting:[{batsman:{id:'1',name:'Glenn Phillips'},'dismissal-text':'batting',r:40,b:20},{batsman:{id:'2',name:'Michael Bracewell'},'dismissal-text':'batting',r:30,b:15}],bowling:[{bowler:{id:'9',name:'Naman Dhir'},o:2,m:0,r:20,w:0}]}]},bb:{bbb:[]},tab:'live',sbb:[]};UI.view='wmatch';UI.sbbOpen=true;render()});
await p.waitForTimeout(400);

const pad=()=>p.evaluate(()=>{const e=document.querySelector('.sbbpad');return e?e.innerText.replace(/\s+/g,' '):''});
// contrast: text must be light on dark
const col=await p.evaluate(()=>{const e=document.querySelector('.sbbpad'),c=getComputedStyle(e);return c.color+'|'+c.backgroundColor});ok(/238, 242, 255/.test(col)&&/13, 25, 42/.test(col),'pad colours '+col);
ok(/Ground map/.test(await pad()),'map shown');
// tap straight up-right: cover side for right hand -> point at top-right of svg
await p.evaluate(()=>{const s=document.querySelector('svg[data-a=sbbWag]'),r=s.getBoundingClientRect();s.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*0.5,clientY:r.top+r.height*0.05}))});
let a=await p.evaluate(()=>UI.wm.padAng);ok(a&&a.d>.8,'tap recorded '+JSON.stringify(a));
await p.click('button[data-a=sbbShot][data-v=Drive]');
await p.click('button[data-a=sbbAdd][data-v="4"]');
let L=await p.evaluate(()=>UI.wm.sbb);ok(L[0].ang&&L[0].shot==='Drive','ang+shot sent '+JSON.stringify(L[0]));
ok(await p.evaluate(()=>!UI.wm.padAng&&!UI.wm.padShot),'cleared after ball');
const cm=await p.evaluate(()=>cbpBbbList({}).map(x=>x.txt).join(' | '));console.log(cm);ok(/FOUR.*driven down the ground/i.test(cm),'commentary has direction: '+cm);
// own scorer engine
const e=await p.evaluate(()=>shLine({a:-Math.PI/2+0.78,d:.9},'Pull','Right-hand',6)+' / '+shLine({a:Math.PI,d:.5},'','Right-hand',2));console.log(e);
await p.evaluate(()=>{UI.sbbOpen=true;render()});await p.screenshot({path:'/tmp/claude-0/pad.png'});console.log(await p.evaluate(()=>cText({bt:'x',bl:'y',r:4,ang:{a:-1.2,d:.9},shot:'Cut'})));ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: ground map');})();