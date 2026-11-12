import test from 'node:test';import assert from 'node:assert/strict';
import {runPipeline,jobIdFor,newJob,buildImagePrompt,generateImage,renderNewsPoster,publicJob} from '../media-studio/news-pipeline.mjs';
const PNG=Buffer.from('89504e470d0a1a0a0000000d49484452','hex');
const ok=async()=>({ok:true,provider:'test',mime:'image/png',bytes:PNG});
const item=(t,o={})=>({title:t,link:'https://news.example/a?utm=1',source:'Cricbuzz',date:new Date().toUTCString(),...o});
test('same story gets the same Job ID, different tracking links do not matter',()=>{
  assert.equal(jobIdFor(item('India win by 5 wickets - Cricbuzz')),jobIdFor(item('India win by 5 wickets',{link:'https://x/y'})));
  assert.notEqual(jobIdFor(item('India win')),jobIdFor(item('India lose')));
});
test('job has id, image, caption, source and status',()=>{
  const j=newJob(item('Kohli scores century in Mumbai'));
  assert.match(j.jobId,/^nj-[0-9a-f]{14}$/);assert.equal(j.status,'queued');assert.ok(j.caption.includes('Source: Cricbuzz'));assert.equal(j.source.url.startsWith('https://'),true);assert.ok(j.image.prompt);assert.equal(j.image.status,'pending');
});
test('prompt never carries names or text instructions that invite likeness',()=>{
  const p=buildImagePrompt('Virat Kohli scores century against Australia');
  assert.ok(!/kohli|virat|australia/i.test(p));assert.match(p,/no real person likeness/);assert.match(p,/cricket/);
});
test('pipeline publishes once and never duplicates',async()=>{
  const store={};let calls=0;const gen=async j=>{calls++;return ok()};
  const items=[item('Story one'),item('Story two'),item('Story one - Cricbuzz')];
  const a=await runPipeline({items,store,generate:gen});
  assert.equal(a.created,2);assert.equal(a.duplicates,1);assert.equal(a.published,2);assert.equal(calls,2);
  const b=await runPipeline({items,store,generate:gen});
  assert.equal(b.created,0);assert.equal(b.duplicates,3);assert.equal(b.published,0);assert.equal(calls,2);
  assert.ok(Object.values(store).every(j=>j.status==='published'&&j.publishedAt));
});
test('failed image retries then falls back to the original graphic without blocking the story',async()=>{
  const store={};let t=0;const now=()=>t;const gen=async()=>({ok:false,error:'down'});
  const items=[item('Story three',{date:new Date(0).toUTCString()})];
  const o={items,store,generate:gen,now,maxAgeMs:1e15};
  let r=await runPipeline(o);assert.equal(r.failed,1);const id=Object.keys(store)[0];assert.equal(store[id].status,'failed');
  t+=7e5;r=await runPipeline(o);assert.equal(store[id].status,'failed');
  t+=7e5;r=await runPipeline(o);assert.equal(r.fallback,1);assert.equal(store[id].status,'published');assert.equal(store[id].image.kind,'graphic');
});
test('stale news is skipped',async()=>{
  const store={};const r=await runPipeline({items:[item('Old story',{date:new Date(Date.now()-9*864e5).toUTCString()})],store,generate:ok});
  assert.equal(r.stale,1);assert.equal(Object.keys(store).length,0);
});
test('image service: validates bytes and surfaces errors',async()=>{
  const good=await generateImage({prompt:'p',seed:1,provider:'pollinations',fetchImpl:async()=>({ok:true,arrayBuffer:async()=>PNG})});
  assert.equal(good.ok,true);assert.equal(good.mime,'image/png');
  const html=await generateImage({prompt:'p',seed:1,provider:'pollinations',fetchImpl:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('<html>not an image at all</html>')})});
  assert.equal(html.ok,false);
  const err=await generateImage({prompt:'p',seed:1,provider:'huggingface',hfToken:'x',fetchImpl:async()=>({ok:false,status:503})});
  assert.match(err.error,/503/);
  assert.equal((await generateImage({prompt:'p',seed:1,provider:'none'})).ok,false);
});
test('poster contains caption, source and disclosure; no markup injection',()=>{
  const j=newJob(item('A <script>alert(1)</script> & B win'));
  const svg=renderNewsPoster(j,{mime:'image/png',bytes:PNG});
  assert.ok(!/<script/.test(svg));assert.match(svg,/Source: Cricbuzz/);assert.match(svg,/AI-generated illustration/);assert.match(svg,/data:image\/png;base64/);
  assert.ok(!/AI-generated/.test(renderNewsPoster(j,null)));
  assert.ok(!('prompt' in publicJob(j).image));
});
test('openai provider: used when key+model set, sends model from env, decodes b64',async()=>{
  let seen;const fetchImpl=async(u,o)=>{seen={u,o};return {ok:true,json:async()=>({data:[{b64_json:PNG.toString('base64')}]})}};
  const r=await generateImage({prompt:'p',seed:1,openaiKey:'k',openaiModel:'m-x',fetchImpl});
  assert.equal(r.ok,true);assert.equal(r.provider,'openai');assert.equal(JSON.parse(seen.o.body).model,'m-x');assert.match(seen.o.headers.authorization,/Bearer k/);
  const bad=await generateImage({prompt:'p',seed:1,provider:'openai',openaiKey:'k',fetchImpl});
  assert.equal(bad.ok,false);assert.equal(bad.permanent,true);
});
test('google provider: uses key header + env model, decodes inlineData; refuses without model',async()=>{
  let seen;const fetchImpl=async(u,o)=>{seen={u,o};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'x'},{inlineData:{mimeType:'image/png',data:PNG.toString('base64')}}]}}]})}};
  const r=await generateImage({prompt:'p',seed:1,googleKey:'gk',googleModel:'m-g',fetchImpl});
  assert.equal(r.ok,true);assert.equal(r.provider,'google');assert.match(seen.u,/models\/m-g:generateContent$/);assert.equal(seen.o.headers['x-goog-api-key'],'gk');
  const bad=await generateImage({prompt:'p',seed:1,provider:'google',googleKey:'gk',fetchImpl});assert.equal(bad.permanent,true);
});
import {buildMatchImagePrompt} from '../media-studio/news-pipeline.mjs';
test('match brief uses real match facts but never names a person',()=>{
  const p=buildMatchImagePrompt({headline:'Rwanda Women win by 18 runs',teams:['Rwanda Women','Uganda Women'],type:'T20',name:'Uganda Women vs Rwanda Women, Womens Victoria T20I',performance:{batters:[{name:'Jane Doe',team:'Rwanda Women',runs:104}],bowlers:[]}});
  assert.match(p,/women's cricket/);assert.match(p,/century/);assert.match(p,/blue and yellow/);assert.match(p,/yellow, black and red/);assert.match(p,/T20/);
  assert.doesNotMatch(p,/Jane|Doe|Rwanda|Uganda/);
  const r=buildMatchImagePrompt({headline:'India vs New Zealand — No result',teams:['India','New Zealand'],type:'ODI',performance:null});assert.match(r,/rain clouds/);assert.match(r,/one-day/);assert.doesNotMatch(r,/women/i);
  const t=buildMatchImagePrompt({headline:'Mumbai won by an innings and 25 runs',teams:['Mumbai','Delhi'],type:'Test',performance:{batters:[],bowlers:[{name:'X',wickets:6}]}});assert.match(t,/five-wicket/);assert.match(t,/white clothing/);
});
