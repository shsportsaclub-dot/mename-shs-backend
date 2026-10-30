const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.route('**/api/graphics/package',r=>r.fulfill({json:{ok:true,package:{version:'1.2.0',changelog:[{v:'1.2.0',note:'New lower third.'}]}}}));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{UI.stage='app';S.user={name:'QA',role:'admin'};S.prefs={...S.prefs,asked:1,welcomed:1};window.apiBase=()=>'http://x';
S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'Player '+i,role:'BAT'}));
S.teams=[{id:'a',name:'India',short:'IND',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Aus',short:'AUS',players:S.players.slice(11).map(p=>p.id)}];
const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players,venue:'x',date:'2026-10-30'});S.matches.push(m);startInnings(m,0,'p0','p1','p11');S.stream=S.stream||{};S.stream.mid=m.id;
const o={};const s=st(m);const ks=['intro','bint','tint','xi','fow','card','tick','qr'];o.data={};
for(const k of ks){const d=shGfxData(k,m,s);o.data[k]=!!(d&&d.schema==='sh.graphic/1'&&d.template===k&&d.matchId===m.id&&d.title&&Array.isArray(d.rows))}
const d=shGfxData('card',m,s);o.rows=d.rows.length>0&&d.rows.every(r=>'l' in r&&'v' in r);
UI.view='stream';render();o.card=!!document.getElementById('gpkg');
await A.gpCheck();o.upd=/Package 1\.2\.0 is available/.test(document.body.innerText);o.fit=document.documentElement.scrollWidth<=innerWidth;return o});
console.log(JSON.stringify(r));for(const k of Object.keys(r.data))ok(r.data[k],'data '+k);for(const k of ['rows','card','upd','fit'])ok(r[k],k);ok(!errs.length,'errors '+errs);console.log(process.exitCode?'FAILED':'PASS graphics package ui');await b.close()})()
