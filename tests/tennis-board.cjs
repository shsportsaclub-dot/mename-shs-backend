// Tennis LED scoreboard in the World match centre (provider data) and the local scorer.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=async(u)=>{u=String(u);const J=o=>({ok:true,status:200,json:async()=>o,text:async()=>JSON.stringify(o)});
 if(u.includes('/api/sx/live'))return J({ok:true,matches:[{id:'lt:1',sport:'tennis',league:'ATP Paris Masters',country:'France',live:true,state:'Live',periods:[[6,3],[4,6],[2,1]],extra:{server:2,points:'40-30',surface:'hard',indoor:true},home:{name:'Carlos Alcaraz',short:'Alcaraz',score:1},away:{name:'Jannik Sinner',short:'Sinner',score:1}}]});return J({ok:true})}});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{window.pullLive=async()=>{};window.apiBase=()=>'http://x';UI.stage='app';S.tok='t';S.user={id:'u',name:'T',phone:'1',role:'viewer'};S.prefs=Object.assign({},S.prefs,{asked:1,welcomed:1});UI.live={ok:true,matches:[]};UI.view='home';UI.sport='cricket';render()});
await p.waitForTimeout(300);
await p.click('.hdr .sgbtn');await p.click('.sgl button[data-v=tennis]');await p.waitForTimeout(1200);
await p.click('#igsl .ig-sq');await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const t=document.querySelector('.tnh .hero');return t?{txt:t.innerText.replace(/\s+/g,' '),big:t.querySelector('.big').innerText.replace(/\s+/g,' ')}:null});
ok(r&&/1-1/.test(r.big),'sets '+JSON.stringify(r));
ok(r&&/GAMES 2-1/.test(r.txt)&&/POINTS 40-30/.test(r.txt),'games/points '+(r&&r.txt));
ok(r&&/S1 6-3/.test(r.txt)&&/S2 4-6/.test(r.txt),'previous sets');
ok(r&&/Serving/.test(r.txt)&&/ATP Paris Masters/.test(r.txt),'serving + league');
console.log(await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length<4&&/Virtual live/.test(x.textContent)&&x.textContent.length<40);if(!e)return 'none';const r=e.getBoundingClientRect(),c=getComputedStyle(e.closest('.card')||e);let a=e,o=[];while(a&&a!==document.body){const cs=getComputedStyle(a);if(cs.display==='none')o.push(a.tagName+'.'+a.className+'#'+a.id);a=a.parentElement}const cd=e.closest('.card');const hit=[];for(const ss of document.styleSheets){try{for(const r of ss.cssRules){if(r.selectorText&&r.style&&r.style.display==='none'&&cd.matches(r.selectorText))hit.push(r.selectorText)}}catch(x){}}return hit.join(' ;; ')+' || '+ o.join(' > ')+' | style='+cd.getAttribute('style')+' | cls='+cd.className+' | parent='+cd.parentElement.className+' | prev='+(cd.previousElementSibling&&cd.previousElementSibling.className)}));await p.screenshot({path:'/tmp/tnb.png',fullPage:true});
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: tennis board');})();
