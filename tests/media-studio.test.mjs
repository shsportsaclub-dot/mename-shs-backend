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
test('artwork replaces the bat-and-ball drawing, keeps exact text and the AI label',()=>{
  const T=n=>[{name:n[0]},{name:n[1]}];
  const base=prepareMedia({id:'x1',ended:true,status:'Rwanda Women won by 18 runs',teams:['Rwanda Women','Uganda Women'],score:[{inning:'Rwanda Women Inning 1',r:92,w:5,o:18},{inning:'Uganda Women Inning 1',r:74,w:6,o:18}]},{language:'en'});
  const art=prepareMedia({id:'x1',ended:true,status:'Rwanda Women won by 18 runs',teams:['Rwanda Women','Uganda Women'],score:[{inning:'Rwanda Women Inning 1',r:92,w:5,o:18},{inning:'Uganda Women Inning 1',r:74,w:6,o:18}]},{language:'en',artwork:{mime:'image/png',b64:'AAAA'}});
  assert.match(base.posterSvg,/translate\(640 330\)/);assert.doesNotMatch(art.posterSvg,/translate\(640 330\)/);
  assert.match(art.posterSvg,/data:image\/png;base64,AAAA/);assert.match(art.posterSvg,/AI-generated illustration/);assert.match(art.posterSvg,/92\/5/);
  assert.equal(prepareMedia({id:'x1',ended:true,status:'Rwanda Women won by 18 runs',teams:['Rwanda Women','Uganda Women'],score:[]},{language:'en',artwork:{mime:'text/html',b64:'x'}}).posterSvg.includes('data:text/html'),false);
});
test('poster shows verified top performers from the scorecard, and nothing when there is no scorecard',()=>{
  const mk=sc=>prepareMedia({id:'p1',ended:true,status:'Rwanda Women won by 18 runs',teams:['Rwanda Women','Uganda Women'],score:[{inning:'Rwanda Women Inning 1',r:92,w:5,o:18},{inning:'Uganda Women Inning 1',r:74,w:6,o:18}],scorecard:sc},{language:'en'});
  const a=mk({batting:[{name:'Aisha Mukamana',team:'Rwanda Women',runs:41,balls:36},{name:'Grace Nakato',team:'Uganda Women',runs:30,balls:33}],bowling:[{name:'Beatrice Uwase',team:'',wickets:3,runsConceded:11}]});
  assert.deepEqual(a.performers.bat,['Aisha Mukamana 41 (36)','Grace Nakato 30 (33)']);assert.deepEqual(a.performers.bowl,['Beatrice Uwase 3/11']);
  assert.match(a.posterSvg,/Aisha Mukamana 41 \(36\)/);assert.match(a.posterSvg,/Beatrice Uwase 3\/11/);
  const b=mk(null);assert.equal(b.performers.bat.length+b.performers.bowl.length,0);assert.doesNotMatch(b.posterSvg,/BAT  /);
});
test('performer chips: names, figures and photo credit on the poster; strip not duplicated',()=>{
  const row={id:'p1',ended:true,status:'Rwanda Women won by 18 runs',teams:['Rwanda Women','Uganda Women'],score:[{inning:'Rwanda Women Inning 1',r:92,w:5,o:18},{inning:'Uganda Women Inning 1',r:74,w:6,o:18}],scorecard:{batting:[{name:'Jane Doe',team:'Rwanda Women',runs:104,balls:60}],bowling:[{name:'Ann Bowler',team:'Uganda Women',wickets:5,runsConceded:23}]}};
  const chips=[{name:'Jane Doe',role:'Top scorer',line:'104 (60)',photo:{mime:'image/jpeg',b64:'BBBB',credit:'A. Author, CC BY-SA 4.0'}},{name:'Ann Bowler',role:'Best bowler',line:'5/23'}];
  const m=prepareMedia(row,{language:'en',artwork:{mime:'image/png',b64:'AAAA'},perfChips:chips});
  assert.match(m.posterSvg,/Jane Doe/);assert.match(m.posterSvg,/104 \(60\)/);assert.match(m.posterSvg,/CC BY-SA 4\.0/);assert.match(m.posterSvg,/Wikimedia Commons/);assert.match(m.posterSvg,/data:image\/jpeg;base64,BBBB/);
  assert.doesNotMatch(m.posterSvg,/BAT  /);
  const strip=prepareMedia(row,{language:'en'});assert.match(strip.posterSvg,/BAT/);
});
