import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
const dir=await mkdtemp(path.join(os.tmpdir(),'otp-burst-'));
const requestsFile=path.join(dir,'requests.jsonl');
const c=spawn(process.execPath,['--import',path.resolve(process.env.PRELOAD_FILE||'tests/textbee-burst-preload.mjs'),path.resolve(process.env.TEST_SERVER_FILE||'server.js')],{env:{...process.env,PORT:'18947',SMS_PROVIDER:'textbee',SMS_REGIONS:'91',TEXTBEE_API_KEY:'mock-key',TEXTBEE_DEVICE_ID:'mock-device',TEXTBEE_SIM_SUBSCRIPTION_ID:'',MOCK_SMS_FILE:requestsFile,DATA_FILE:path.join(dir,'data.json'),DATABASE_URL:'',SESSION_SECRET:'local-test-only',SMS_OTP_IP_HOURLY_LIMIT:'100'},stdio:['ignore','pipe','pipe']});
c.stdout.resume();c.stderr.resume();
try{
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:18947/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,20));}
 assert.ok(ready);
 const post=async(p,b)=>{const r=await fetch('http://127.0.0.1:18947'+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});return {status:r.status,body:await r.json()};};
 const phones=Array.from({length:50},(_,i)=>String(9000000000+i));
 const responses=await Promise.all(phones.map(phone=>post('/api/otp/send',{phone,cc:'91'})));
 assert.equal(responses.filter(r=>r.status===200&&r.body.deliveryStatus==='queued').length,50);
 const messages=(await readFile(requestsFile,'utf8')).trim().split('\n').map(JSON.parse);
 assert.equal(messages.length,50);
 assert.equal(new Set(messages.map(m=>m.recipients[0])).size,50);
 for(const m of messages){
   const code=/OTP is (\d{6})/.exec(m.message)?.[1];assert.ok(code);
   const v=await post('/api/otp/verify',{phone:m.recipients[0].slice(3),cc:'91',code});assert.equal(v.status,200);
 }
 const repeat=await post('/api/otp/send',{phone:phones[0],cc:'91'});assert.equal(repeat.status,429);
 assert.equal((await readFile(requestsFile,'utf8')).trim().split('\n').length,50);
 console.log('PASS: 50 concurrent OTP requests queued; 50 received mock codes verified; immediate repeat blocked. Mock provider only: zero real SMS.');
}finally{c.kill();await new Promise(r=>c.once('exit',r));await rm(dir,{recursive:true,force:true});}
