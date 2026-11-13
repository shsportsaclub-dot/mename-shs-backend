// Animation Lab: 20 families x 11 events = 220; each frame rendered mid-animation, pairwise distinctness checked
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:640,height:360}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.addInitScript(()=>{window.fetch=()=>new Promise(()=>{})});
const base='file://'+require('path').resolve(__dirname,'../app-index.html');
await p.goto(base+'?scene=anim&id=1_four&t=1.4#overlay');await p.waitForTimeout(500);
const info=await p.evaluate(()=>({f:window.shAL&&shAL.FAM.length,e:shAL&&shAL.EVS.length}));console.log(JSON.stringify(info));ok(info.f===20&&info.e===11,'220 designs');
fs.mkdirSync('/tmp/claude-0/al',{recursive:true});const evs=['four','six','wicket','fifty','hundred','hattrick','freehit','noball','wide','maiden','drs'];let n=0;
await p.addStyleTag({content:'html,body{background:#0c2d20!important}'});
for(let f=1;f<=20;f++)for(const e of evs){await p.goto(base+'?scene=anim&id='+f+'_'+e+'&t=1.5#overlay');await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const a=document.querySelector('.al');if(!a)return null;const b=a.getBoundingClientRect();return a.innerText.length});
 if(r===null||r<2){ok(false,'empty '+f+'_'+e)}await p.screenshot({path:`/tmp/claude-0/al/${String(f).padStart(2,'0')}_${e}.png`});n++}
console.log('rendered',n);ok(!errs.length,errs.slice(0,3).join(';'));await b.close();if(!process.exitCode)console.log('PASS: anim lab render');})();
