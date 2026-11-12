import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {storageFromEnv,sigV4Put} from '../media-studio/media-storage.mjs';
import {qaJob} from '../media-studio/media-qa.mjs';
import {newJob,renderNewsPoster,runPipeline} from '../media-studio/news-pipeline.mjs';
const PNG=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(9000,7)]);
const item=(t)=>({title:t,link:'https://n/'+t,source:'Cricbuzz',date:new Date().toUTCString()});
function fakeStore(){const files=new Map();return {files,srv:http.createServer((q,r)=>{const c=[];q.on('data',d=>c.push(d));q.on('end',()=>{if(q.method==='GET'){const f=files.get(q.url.replace('/storage/v1/object/public',''));if(!f){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':f.t});return r.end(f.b)}files.set(q.url.replace('/storage/v1/object',''),{b:Buffer.concat(c),t:q.headers['content-type'],a:q.headers.authorization});r.writeHead(200);r.end('{}')})})}}
test('supabase adapter uploads and returns a public URL that serves the same bytes',async()=>{
  const fs_=fakeStore();await new Promise(r=>fs_.srv.listen(0,r));const url='http://127.0.0.1:'+fs_.srv.address().port;
  const st=storageFromEnv({SUPABASE_URL:url,SUPABASE_SERVICE_KEY:'svc',MEDIA_STORAGE_BUCKET:'media'});
  const u=await st.put('news/nj-1.png',PNG,'image/png');assert.ok(u.ok);assert.equal(u.url,url+'/storage/v1/object/public/media/news/nj-1.png');
  assert.equal(fs_.files.get('/media/news/nj-1.png').a,'Bearer svc');
  const r=await fetch(u.url);assert.deepEqual(Buffer.from(await r.arrayBuffer()),PNG);fs_.srv.close();
});
test('no credentials -> no storage; R2 needs all fields; SigV4 header is well-formed and deterministic',()=>{
  assert.equal(storageFromEnv({}),null);assert.equal(storageFromEnv({R2_ACCOUNT_ID:'a'}),null);
  const a=sigV4Put({host:'a.r2.cloudflarestorage.com',path:'/b/k.png',accessKey:'AK',secretKey:'SK',body:PNG,mime:'image/png',now:new Date('2026-11-12T00:00:00Z')});
  assert.match(a.authorization,/^AWS4-HMAC-SHA256 Credential=AK\/20261112\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
  assert.equal(a['x-amz-date'],'20261112T000000Z');
  assert.ok(storageFromEnv({R2_ACCOUNT_ID:'a',R2_ACCESS_KEY_ID:'k',R2_SECRET_ACCESS_KEY:'s',MEDIA_PUBLIC_BASE_URL:'https://p.example'}));
});
test('QA passes a good job, catches missing text, duplicate images and bad storage URLs',async()=>{
  const job=newJob(item('Kohli hits century as India beat Australia by 5 wickets'));job.image={...job.image,status:'generated'};
  const svg=renderNewsPoster(job,{mime:'image/png',bytes:PNG});
  const good=await qaJob({job,image:{mime:'image/png',bytes:PNG},svg,jobs:{}});assert.equal(good.passed,true,JSON.stringify(good.checks.filter(c=>!c.ok)));
  const bad=await qaJob({job,image:{mime:'image/png',bytes:PNG},svg:svg.replace('Kohli','Rohit'),jobs:{}});assert.equal(bad.passed,false);assert.ok(bad.checks.find(c=>c.name==='names-and-numbers-in-poster'&&!c.ok));
  const other=newJob(item('Messi scores twice in Miami win'));other.image={status:'generated',sha256:job.image.sha256};
  const dup=await qaJob({job,image:{mime:'image/png',bytes:PNG},svg,jobs:{[other.jobId]:other}});assert.ok(dup.checks.find(c=>c.name==='image-unique'&&!c.ok));
  job.asset={url:'http://x/y.svg'};const miss=await qaJob({job,image:{mime:'image/png',bytes:PNG},svg,jobs:{},fetchImpl:async()=>({ok:false,status:404,arrayBuffer:async()=>new ArrayBuffer(0)})});assert.ok(miss.checks.find(c=>c.name==='poster-url-serves-same-bytes'&&!c.ok));
});
test('pipeline: failing QA on an AI image falls back to the original graphic; failing again goes to manual review, never published',async()=>{
  const store={};let calls=0;
  const out=await runPipeline({items:[item('India beat Australia by 5 wickets')],store,generate:async()=>({ok:true,provider:'t',mime:'image/png',bytes:PNG}),finalize:async j=>{calls++;return {passed:j.image.status==='fallback',checks:[{name:'image-unique',ok:false,note:''}]}}});
  const j=Object.values(store)[0];assert.equal(j.status,'published');assert.equal(j.image.status,'fallback');assert.equal(out.published,1);assert.equal(calls,2);
  const s2={};const o2=await runPipeline({items:[item('Messi scores twice')],store:s2,generate:async()=>({ok:true,provider:'t',mime:'image/png',bytes:PNG}),finalize:async()=>({passed:false,checks:[{name:'x',ok:false,note:'bad'}]})});
  assert.equal(Object.values(s2)[0].status,'manual_review');assert.equal(o2.published,0);assert.equal(o2.review,1);
});
test('SigV4 reproduces the official AWS S3 documentation example signature',()=>{
  const h=sigV4Put({host:'examplebucket.s3.amazonaws.com',path:'/test%24file.text',region:'us-east-1',accessKey:'AKIAIOSFODNN7EXAMPLE',secretKey:'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',body:Buffer.from('Welcome to Amazon S3.'),extraHeaders:{date:'Fri, 24 May 2013 00:00:00 GMT','x-amz-storage-class':'REDUCED_REDUNDANCY'},now:new Date('2013-05-24T00:00:00Z')});
  assert.match(h.authorization,/Signature=98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd$/);
});
