import fs from 'node:fs';
import crypto from 'node:crypto';
const base=process.env.SH_VERIFY_BASE||'https://scoring-heroes-api.onrender.com';
const expected=process.env.SH_EXPECTED_COMMIT||process.env.GITHUB_SHA||'';
const file=new URL('../app-index.html',import.meta.url);
const expectedHash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const evidence={checkedAt:new Date().toISOString(),base,readOnly:true,expectedCommit:expected||null,expectedAppSha256:expectedHash,productionVerified:false};
try{
 const health=await fetch(base+'/health',{cache:'no-store',signal:AbortSignal.timeout(20000)});
 const status=await health.json();
 const response=await fetch(base+'/?deployment-check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(20000)});
 const html=await response.text();
 const actualHash=crypto.createHash('sha256').update(html).digest('hex');
 Object.assign(evidence,{healthStatus:health.status,appStatus:response.status,deployedCommit:status.commit||status.version||null,actualAppSha256:actualHash,serverReportsAppHash:status.appSha256||null,exactHtmlMatch:actualHash===expectedHash,commitMatch:expected?status.commit===expected:null});
 evidence.productionVerified=health.ok&&status.ok===true&&response.ok&&evidence.exactHtmlMatch&&status.appSha256===actualHash&&(!expected||evidence.commitMatch);
 if(!evidence.productionVerified)evidence.error='Live server does not match the expected build. A source-code push is not deployment proof.';
}catch(e){evidence.error=e.message;}
fs.mkdirSync('runtime-evidence',{recursive:true});
fs.writeFileSync('runtime-evidence/deployment-verification.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
if(!evidence.productionVerified)process.exitCode=1;
