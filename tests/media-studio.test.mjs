import test from 'node:test';import assert from 'node:assert/strict';
import {prepareMedia,renderPoster} from '../media-studio/media-engine.mjs';
const T=(a,b)=>[{name:a},{name:b}];
test('provider "A,B Inning 1" resolves batting side to the other team',()=>{
  const r=prepareMedia({id:'a1',ended:true,status:'Rwanda Women won by 39 runs',teams:T('Namibia Women','Rwanda Women'),
    score:[{inning:'namibia women Inning 1',r:98,w:8,o:20},{inning:'Namibia Women,Rwanda Women Inning 1',r:59,w:10,o:17.5}]},{language:'en'});
  assert.equal(r.ok,true);assert.equal(r.innings[1].name,'Rwanda Women');assert.ok(!/Inning/.test(r.summary));
});
test('result-only posters for finished matches without scorecard',()=>{
  const r=prepareMedia({id:'a2',ended:true,status:'India won by 4 wkts',teams:T('India','New Zealand'),score:[]},{language:'en'});
  assert.equal(r.ok,true);assert.equal(r.scoreless,true);assert.ok(!/Full recorded score/.test(r.paragraphs.join(' ')));
});
test('innings win, tie and abandoned headlines',()=>{
  assert.match(prepareMedia({id:'a3',ended:true,status:'Mumbai won by an innings and 25 runs',teams:T('Mumbai','Delhi'),score:[{inning:'Mumbai Inning 1',r:410,w:10,o:120},{inning:'Delhi Inning 1',r:200,w:10,o:60},{inning:'Delhi Inning 2',r:185,w:10,o:55}]}).headline,/innings and 25 runs/);
  assert.match(prepareMedia({id:'a4',ended:true,status:'Match tied',teams:T('A','B'),score:[]}).headline,/tied/);
  assert.match(prepareMedia({id:'a5',ended:true,status:'Match abandoned due to rain',teams:T('A','B'),score:[]}).headline,/No result/);
});
test('in-progress matches are never published',()=>{
  assert.equal(prepareMedia({id:'a6',ended:false,status:'A need 10 runs',teams:T('A','B'),score:[{inning:'A Inning 1',r:1,w:1,o:1}]}).ok,false);
});
test('poster wraps long text and never leaves unwrapped lines',()=>{
  const svg=renderPoster({headline:'Papua New Guinea Women win by 7 wickets over United States of America Women',summary:'',result:'x '.repeat(80),venue:'v '.repeat(80),teams:['A','B'],innings:[]});
  for(const m of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g))assert.ok([...m[1]].length<=70,'line too long: '+m[1].slice(0,40));
});
