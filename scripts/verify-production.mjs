import fs from 'node:fs';
import crypto from 'node:crypto';
const base=process.env.SH_VERIFY_BASE||'https://scoring-heroes-api.onrender.com';
const expected=process.env.SH_EXPECTED_COMMIT||process.env.GITHUB_SHA||'';
const file=new URL('../app-index.html',import.meta.url);
const source=fs.readFileSync(file,'utf8');
const expectedHash=crypto.createHash('sha256').update(source).digest('hex');
const evidence={checkedAt:new Date().toISOString(),base,readOnly:true,expectedCommit:expected||null,expectedAppSha256:expectedHash,productionVerified:false};
try{
 const health=await fetch(base+'/health',{cache:'no-store',signal:AbortSignal.timeout(20000)});
 const status=await health.json();
 const build=String(status.commit||status.version||'local').slice(0,7);
 const stylePath=new URL('../public/main-live-reference.css',import.meta.url);
 const servedSource=source.replace('__SH_BUILD__',build).replace('</head>', '<style id="sh-main-live-reference">'+fs.readFileSync(stylePath,'utf8')+'</style></head>');
 const expectedServedHash=crypto.createHash('sha256').update(servedSource).digest('hex');
 const response=await fetch(base+'/?deployment-check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(20000)});
 const html=await response.text();
 const actualHash=crypto.createHash('sha256').update(html).digest('hex');
 Object.assign(evidence,{healthStatus:health.status,appStatus:response.status,deployedCommit:status.commit||status.version||null,expectedServedSha256:expectedServedHash,actualAppSha256:actualHash,serverReportsAppHash:status.appSha256||null,exactHtmlMatch:actualHash===expectedServedHash,sourceHashMatch:status.appSha256===expectedHash,commitMatch:expected?status.commit===expected:null});
 evidence.productionVerified=health.ok&&status.ok===true&&response.ok&&evidence.exactHtmlMatch&&evidence.sourceHashMatch&&(!expected||evidence.commitMatch);
 if(!evidence.productionVerified)evidence.error='Live server does not match the expected build. A source-code push is not deployment proof.';
}catch(e){evidence.error=e.message;}
fs.mkdirSync('runtime-evidence',{recursive:true});
fs.writeFileSync('runtime-evidence/deployment-verification.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
if(!evidence.productionVerified)process.exitCode=1;
