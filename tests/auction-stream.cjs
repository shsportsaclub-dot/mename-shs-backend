// Auction streaming scenes render from the public bid-room feed (no login).
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];
let room={now:Date.now(),last:null,ver:5,open:true,cur:{id:'p1',name:'Rohit Sharma',role:'BAT',base:100,lot:3,total:20,photo:''},bid:140,bidTeam:'t1',next:160,teams:[{id:'t1',name:'Lions',short:'LI',purse:860,max:600,left:9,ok:true},{id:'t2',name:'Tigers',short:'TI',purse:900,max:500,left:10,ok:true}],log:[{t:'TI',a:120},{t:'LI',a:140}]};
async function open(url){const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(/\/api\/aucroom\/au1/.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,room:{...room,now:Date.now()}})});if(/\/api\/shared\/auc\/au1/.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,item:{data:{a:{id:'au1',teams:[{id:'t1',name:'Lions',short:'LI',players:[]},{id:'t2',name:'Tigers',short:'TI',players:[]}]}}}})});return r.fulfill({contentType:'application/json',body:'{"ok":false}'})});
 await p.goto('file://'+process.cwd()+'/app-index.html'+url);await p.waitForTimeout(2200);return p}
let p=await open('?scene=auclive&auc=au1#overlay');let t=await p.evaluate(()=>document.body.innerText);
assert(/Rohit Sharma/.test(t)&&/140/.test(t)&&/LOT 3 \/ 20/.test(t)&&/Lions/.test(t)&&/PURSE LEFT/.test(t),'live scene '+t.slice(0,300));
await p.screenshot({path:'/tmp/auc-live.png'});
room={...room,open:false,cur:null,last:{key:'k1',st:'sold',name:'Rohit Sharma',team:'Lions',short:'LI',price:140,at:Date.now()}};
await p.waitForTimeout(2200);t=await p.evaluate(()=>document.body.innerText);assert(/SOLD/.test(t)&&/Lions/.test(t),'sold '+t.slice(0,200));await p.screenshot({path:'/tmp/auc-sold.png'});
const p2=await open('?scene=aucticker&auc=au1#overlay');t=await p2.evaluate(()=>document.body.innerText);assert(/LI/.test(t)&&/140/.test(t),'ticker '+t);
const p3=await open('?scene=auctable&auc=au1#overlay');t=await p3.evaluate(()=>document.body.innerText);assert(/PURSE LEFT/.test(t)&&/860/.test(t),'table '+t);
assert.deepEqual(errs,[]);console.log('PASS auction stream');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
