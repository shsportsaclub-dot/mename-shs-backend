// Graphics studio: every kind renders in several styles, the overlay watcher fires graphics on new balls, and premium styles are flagged.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(),errs=[];const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n').slice(0,4).join(' > ')));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html#overlay');await p.waitForTimeout(600);
assert(await p.evaluate(()=>!!window.shFx),'shFx loaded');
// 1) gallery sheet: each kind in a different style on a dark stage
await p.evaluate(()=>{const m=demoMatch();S.matches=[m];S.stream.mid=m.id;const ks=shFx.KINDS.map(x=>x[0]);document.body.innerHTML='<div id="sheet" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:#1b2a3a;padding:6px;width:1280px"></div>';
 const sh=document.getElementById('sheet');ks.forEach((k,i)=>{const c=document.createElement('div');c.style.cssText='position:relative;aspect-ratio:16/9;container-type:size;overflow:hidden;background:#243b55';c.innerHTML=shFx.html(k,shFx.dataFor(k,m,{}),[i%8,(i*5)%12,i%7,i%3].join('-'),{dur:99});c.querySelectorAll('.fxm').forEach(x=>x.style.animation='none');sh.appendChild(c)})});
await p.waitForTimeout(300);await p.screenshot({path:'/tmp/fx-sheet.png',fullPage:true});
// 2) watcher
await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>{const m=window.__m=demoMatch();S.matches=[m];S.stream.mid=m.id;S.stream.fx={on:true,mode:'fixed',sel:{},pr:0,big:'off'}});
await p.evaluate(()=>shFxWatch());
const fire=async(patch,kind)=>{await p.evaluate(patch=>{S.matches=[window.__m];S.stream.mid=window.__m.id;const m=ovMatch(),s=st(m),e0=s.inn.ev[s.inn.ev.length-1];s.inn.ev.push(Object.assign({},e0,patch));shFxWatch()},patch);await p.waitForSelector('#fxhost .fxw[data-k="'+kind+'"]',{timeout:5000});await p.waitForTimeout(400)};
await fire({r:6,x:'',w:undefined,out:undefined},'six');await p.screenshot({path:'/tmp/fx-six.png'});
await p.waitForTimeout(4600);
await fire({r:0,x:'',w:'Bowled',out:await p.evaluate(()=>{S.matches=[window.__m];S.stream.mid=window.__m.id;const s=st(ovMatch());return s.inn.ev[s.inn.ev.length-1].bt})},'bowled');await p.screenshot({path:'/tmp/fx-bowled.png'});
assert(await p.evaluate(()=>shFx.isPrem('5-0-0-0')&&!shFx.isPrem('1-2-3-0')),'premium flags');
assert.deepEqual(errs.filter(e=>!/at render/.test(e)),[]);console.log('PASS fx studio');await b.close()})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
