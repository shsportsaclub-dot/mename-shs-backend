const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();
await pg.goto('file://'+process.cwd()+'/app-index.html#overlay');await pg.waitForTimeout(1500);
const r=await pg.evaluate(()=>{const K=window.SH_KSIG,ks=Object.keys(K);const bodies=ks.map(k=>K[k][1].join(''));const cols=ks.map(k=>K[k][0]);
const css=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch(e){return[]}}).filter(x=>x.type===7||x.name).map(x=>x.name);
return{n:ks.length,uniqBody:new Set(bodies).size,uniqCol:new Set(cols).size,kf:ks.filter(k=>css.includes('fxk_'+k)).length}});
console.log(JSON.stringify(r));
if(r.n!==18||r.uniqBody!==18||r.uniqCol!==18||r.kf!==18){console.log('FAIL');process.exit(1)}
console.log('PASS fx unique');await b.close()})();
