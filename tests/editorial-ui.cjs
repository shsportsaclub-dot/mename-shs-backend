const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{window.apiBase=()=>'http://x';window.__posts=[];
 const art={id:'ed1',type:'player',typeName:'Player spotlight',h:'Rising star Ravi',sub:'Teen scores 100',body:['Para one','Para two'],tr:{te:{h:'ఉదయిస్తున్న తార',sub:'',body:['మొదటి భాగం']}},status:'published',by:'Ed',t:Date.now(),updated:Date.now(),history:[{t:Date.now(),note:'Added surname',by:'Ed'}]};
 const draft={id:'ed2',type:'feature',typeName:'Feature',h:'Draft piece',sub:'',body:['x'],tr:{},status:'draft',by:'Ed',t:0,updated:Date.now(),history:[]};
 window.fetch=async(u,o)=>{u=String(u);if(/\/api\/editorial/.test(u)&&o&&o.method==='POST'){window.__posts.push(JSON.parse(o.body));return {json:async()=>({ok:true,item:{status:'published'}})}}
  return {json:async()=>/\/api\/editorial/.test(u)?{ok:true,editor:true,items:[art,draft]}:/\/paper/.test(u)?{ok:true,recent:[],days:[],news:[],world:[],sh:[]}:{ok:false}}};
 UI.stage='app';S.user={id:'u1',name:'Ed',role:'scorer',phone:'9999999999'};S.tok='tok';S.prefs={...S.prefs,asked:1,welcomed:1};
 await shEdLoad();const o={};
 const keys=ownNews().map(x=>x.key);o.listed=keys.includes('ed-ed1')&&!keys.includes('ed-ed2');
 UI.artK='ed-ed1';UI.view='article';render();const t=document.body.innerText;o.type=/Player spotlight/.test(t);o.corr=/Corrections/.test(t)&&/Added surname/.test(t);o.tr=/తెలుగు/.test(t);o.edit=!!document.querySelector('[data-a=edEdit]');
 A.edLang({v:'te'});o.te=/ఉదయిస్తున్న తార/.test(document.body.innerText);A.edLang({v:''});
 UI.view='epaper';render();await new Promise(r=>setTimeout(r,200));o.news=/Newsroom/.test(document.body.innerText)&&/Draft piece/.test(document.body.innerText);
 A.edNew();o.form=!!document.getElementById('ed-h')&&document.getElementById('ed-ty').options.length===8;
 document.getElementById('ed-h').value='A fine headline';document.getElementById('ed-b').value='Line one\nLine two';document.getElementById('ed-p').checked=true;await A.edSave({k:''});
 o.posted=window.__posts.length===1&&window.__posts[0].h==='A fine headline'&&window.__posts[0].publish===true;o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r))ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS editorial UI');await b.close()})()
