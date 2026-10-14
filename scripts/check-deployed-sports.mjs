import fs from 'node:fs';
const base='https://scoring-heroes-api.onrender.com';
const evidence={checkedAt:new Date().toISOString(),base,readOnly:true,productionVerified:false};
for(let attempt=0;attempt<5;attempt++){
 try{
  const h=await fetch(base+'/health',{signal:AbortSignal.timeout(20000)});
  const j=await h.json();
  const app=await fetch(base+'/',{signal:AbortSignal.timeout(20000)});
  const html=await app.text();
  const shared=await fetch(base+'/api/shared/sports',{signal:AbortSignal.timeout(20000)});
  evidence.health=h.status===200&&j.ok===true;
  evidence.multiSportClient=html.includes("col==='sports'")&&html.includes('Share live score');
  evidence.sportsApiStatus=shared.status;
  evidence.productionVerified=evidence.health&&evidence.multiSportClient&&shared.status===200;
  if(evidence.productionVerified)break;
 }catch(e){evidence.error=e.name==='TimeoutError'?'Server request timed out':e.message;}
 await new Promise(r=>setTimeout(r,8000));
}
fs.mkdirSync('runtime-evidence',{recursive:true});
fs.writeFileSync('runtime-evidence/production-readiness.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));
if(!evidence.productionVerified)console.log('Production deployment not confirmed. Local tests remain separate.');
