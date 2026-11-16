// SH Tiger Rig: correct umpire signals, dress codes, no wrong "out finger" for wide/no-ball/free-hit/review/maiden
const {chromium}=require('playwright');let bad=0;const ok=(c,m)=>{if(!c){bad=1;console.log('FAIL',m)}};
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}});
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html')+'?scene=anim&id=21_wide&t=2.4#overlay');await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const R=shRG,o={};for(const e of Object.keys(R.RGP)){const h=R.RGM(e);o[e]={svg:/<svg/.test(h),dress:R.RGD[e]}}
 o.ang={wide:R.RGP.wide,noball:R.RGP.noball,out:R.RGP.wicket,six:R.RGP.six};return o});
ok(Object.keys(r).length>=12,'poses');await p.evaluate(()=>{A.mascotStyle({v:'sh'})});await p.waitForTimeout(2500);
ok(r.ang.wide[0]===92&&r.ang.wide[2]===-92,'wide = both arms straight out');
ok(r.ang.noball[0]<20&&r.ang.noball[2]===-92,'no ball = one arm out');
ok(r.ang.out[2]<-150&&r.ang.out[4]==='f','out = one arm up with finger');
ok(r.ang.six[0]>150&&r.ang.six[2]<-150,'six = both arms up');
for(const e of ['wide','noball','freehit','drs','maiden','wicket'])ok(r[e].dress==='u',e+' umpire dress');
for(const e of ['four','six','fifty','hundred','hattrick'])ok(r[e].dress==='p',e+' player kit');
// default tiger never raises the OUT finger for wide/no-ball/free-hit/review/maiden: it uses the neutral kit pose
for(const [e,sh] of [['wide','shwide'],['noball','shnoball'],['freehit','shfree'],['drs','shkit'],['maiden','shkit']]){await p.evaluate(e=>{history.pushState(null,'','?scene=anim&id=21_'+e+'&t=2.4#overlay');render()},e);await p.waitForTimeout(1700);
 const st=await p.evaluate(()=>{const s=document.querySelector('.al-shs');return s?getComputedStyle(s).backgroundImage:''});ok(st.indexOf('/'+sh+'.webp')>0,e+' uses '+sh+', got '+st)}
// rig style gives the real signals
await p.evaluate(()=>{A.mascotStyle({v:'rig'})});await p.waitForTimeout(1500);
for(const e of ['wide','drs']){await p.evaluate(e=>{history.pushState(null,'','?scene=anim&id=21_'+e+'&t=2.4#overlay');render()},e);await p.waitForTimeout(1700);ok(await p.evaluate(()=>!!document.querySelector('.al-rgm')),e+' rig')}
await b.close();if(!bad)console.log('PASS: tiger rig');else process.exitCode=1})();
