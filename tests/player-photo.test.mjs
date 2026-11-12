import test from 'node:test';import assert from 'node:assert/strict';
import {findPlayerPhoto} from '../media-studio/player-photo.mjs';
const JPG=Buffer.concat([Buffer.from('ffd8ffe0','hex'),Buffer.alloc(5000,1)]);
const mk=({title='Jane Doe',desc='Rwandan cricketer',img='Jane.jpg',lic='CC BY-SA 4.0',artist='<a href="x">A. Author</a>',n=1,mime='image/jpeg'}={})=>async(u)=>{
  const url=String(u);
  if(url.includes('wikipedia.org'))return {ok:true,json:async()=>({query:{pages:Object.fromEntries(Array.from({length:n},(_,i)=>[i,{title:title,description:desc,pageimage:img}]))}})};
  if(url.includes('commons.wikimedia.org'))return {ok:true,json:async()=>({query:{pages:{1:{imageinfo:[{thumburl:'https://upload.example/t.jpg',mime,extmetadata:{LicenseShortName:{value:lic},Artist:{value:artist}}}]}}}})};
  return {ok:true,arrayBuffer:async()=>JPG};
};
test('accepts an exact-name cricketer page with a free licence and gives attribution',async()=>{
  const r=await findPlayerPhoto('Jane Doe',{fetchImpl:mk()});assert.equal(r.ok,true);assert.match(r.credit,/A\. Author, CC BY-SA 4\.0/);assert.equal(r.bytes.length,JPG.length);
});
test('rejects: different name, non-cricketer, ambiguous, non-free licence, no image, single name',async()=>{
  assert.equal((await findPlayerPhoto('Jane Smith',{fetchImpl:mk()})).ok,false);
  assert.equal((await findPlayerPhoto('Jane Doe',{fetchImpl:mk({desc:'American actress'})})).ok,false);
  assert.match((await findPlayerPhoto('Jane Doe',{fetchImpl:mk({n:2})})).reason,/ambiguous/);
  assert.match((await findPlayerPhoto('Jane Doe',{fetchImpl:mk({lic:'CC BY-NC 4.0'})})).reason,/licence/);
  assert.equal((await findPlayerPhoto('Jane Doe',{fetchImpl:mk({img:''})})).ok,false);
  assert.equal((await findPlayerPhoto('Madonna',{fetchImpl:mk()})).ok,false);
  assert.equal((await findPlayerPhoto('Jane Doe',{fetchImpl:async()=>{throw new Error('offline')}})).ok,false);
});
