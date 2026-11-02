import test from 'node:test';
import assert from 'node:assert/strict';
import {cricketIntro} from '../scripts/original-cricket/presentation.mjs';
const context={teams:[{id:'a',name:'Heroes',xi:['p2','p1'],captain:'p1'},{id:'b',name:'Challengers',xi:['b1','b2'],captain:'b1'}],toss:{winner:'b',decision:'bowl'}};
test('saved captains face each other, saved toss result is stated',()=>{const s=cricketIntro(context,1);assert.equal(s.phase,'CAPTAINS');assert.deepEqual(s.actors.map(a=>a.id),['p1','b1']);assert.match(s.caption,/Challengers won the toss and chose to bowl/);});
test('both published XIs walk out captain first and sequence ends',()=>{assert.equal(cricketIntro(context,4).actors[0].id,'p1');assert.equal(cricketIntro(context,8).actors[0].id,'b1');assert.equal(cricketIntro(context,12),null);});
test('missing captains or toss do not become invented facts',()=>{const noCaps={teams:context.teams.map(t=>({...t,captain:null}))};assert.equal(cricketIntro(noCaps,0).phase,'TEAM WALKOUT');assert.match(cricketIntro({...context,toss:null},0).caption,/not published/);assert.equal(cricketIntro({teams:[]},0),null);});
