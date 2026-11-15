const {chromium}=require('playwright');let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[360,772],[390,844],[430,932],[1280,720]]){const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:w<600,hasTouch:w<600});const p=await ctx.newPage();
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file:///'+__dirname.replace(/\\/g,'/')+'/../app-index.html');await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const g=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {y:r.y,b:r.bottom,x:r.x,r:r.right,pos:getComputedStyle(e).position}};return {lgw:g('.wsp .lgw'),tt:g('.wsp .tt'),bt:g('.wsp .wbt'),pc:g('.wsp .wpc'),hn:g('.wsp .whn'),W:innerWidth,H:innerHeight}});
const t=`${w}x${h}`;ok(r.bt&&r.pc&&r.hn,t+' parts');if(!r.bt)continue;
ok(r.bt.pos!=='absolute'&&r.pc.pos!=='absolute',t+' bottom block in flow');
ok(r.lgw.b<=r.tt.y+2,t+' helmet above title');ok(r.tt.b<=r.bt.y+2,t+' title above loading bar');
ok(r.pc.b<=r.hn.y+2,t+' % text above tap hint');ok(r.hn.b<=r.H,t+' hint on screen');ok(r.pc.x>=0&&r.pc.r<=r.W,t+' % text inside width');
await ctx.close()}
await b.close();console.log(bad?'FAILED':'PASS: welcome splash layout');process.exit(bad?1:0)})();
