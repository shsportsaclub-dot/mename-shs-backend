import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
test('deployment verification checks both source and rendered build, rejecting wrong commit or changed HTML',async()=>{
 const source=fs.readFileSync('app-index.html','utf8'),style=fs.readFileSync('public/main-live-reference.css','utf8'),mm=fs.readFileSync('public/match-market-display.js','utf8'),sha='1234567890abcdef1234567890abcdef12345678';let corrupt=false;
 const sourceHash=crypto.createHash('sha256').update(source).digest('hex');
 const server=createServer((req,res)=>{
  if(req.url==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,commit:sha,version:sha.slice(0,7),appSha256:sourceHash}))}
  else res.end(source.replace('__SH_BUILD__',sha.slice(0,7)).replace('</head>', '<style id="sh-main-live-reference">'+style+'</style><script>'+mm+'</script></head>')+(corrupt?'changed':''));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const run=expected=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/verify-production.mjs'],{env:{...process.env,SH_VERIFY_BASE:`http://127.0.0.1:${server.address().port}`,SH_EXPECTED_COMMIT:expected}});let out='';child.stdout.on('data',d=>out+=d);child.on('error',reject);child.on('close',code=>resolve({code,evidence:JSON.parse(out)}))});
 try{
  const good=await run(sha);assert.equal(good.code,0);assert(good.evidence.productionVerified&&good.evidence.sourceHashMatch&&good.evidence.exactHtmlMatch);
  assert.notEqual(good.evidence.expectedAppSha256,good.evidence.expectedServedSha256);
  const wrong=await run('ffffffffffffffffffffffffffffffffffffffff');assert.equal(wrong.code,1);assert(!wrong.evidence.commitMatch);
  corrupt=true;const changed=await run(sha);assert.equal(changed.code,1);assert(!changed.evidence.exactHtmlMatch);
 }finally{await new Promise(r=>server.close(r));fs.rmSync('runtime-evidence/deployment-verification.json',{force:true})}
});
