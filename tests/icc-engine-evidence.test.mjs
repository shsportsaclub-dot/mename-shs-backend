import test from 'node:test';
import assert from 'node:assert/strict';
import {diffSnapshots, parseDismissal} from '../observer.mjs';

const snap=(balls,r,w=0,batRuns=r)=>({
 idx:0,inning:'Team A Inning 1',team:'Team A',r,w,balls,
 o:`${Math.floor(balls/6)}.${balls%6}`,
 bat:{Batter:{r:batRuns,b:balls,f4:0,f6:0,t:'not out'}},
 bowl:{Bowler:{b:balls,r,w,nb:0,wd:0}}
});

test('first snapshot is a baseline, not an invented ball',()=>{
 const d=diffSnapshots(null,snap(25,40));
 assert.equal(d.rows.length,0);
 assert.match(d.note.text,/Tracking started/);
});
test('one fully supported legal ball is recorded',()=>{
 const d=diffSnapshots(snap(25,40),snap(26,41));
 assert.equal(d.rows.length,1);
 assert.equal(d.rows[0].over,4);
 assert.equal(d.rows[0].ball,2);
 assert.equal(d.rows[0].runs,1);
});
test('multi-ball gap must not invent deliveries',()=>{
 const d=diffSnapshots(snap(25,40),snap(28,44));
 assert.equal(d.rows.length,0);
 assert.ok(d.note);
});
test('backwards score is correction, not a delivery',()=>{
 const d=diffSnapshots(snap(26,41),snap(25,40));
 assert.equal(d.rows.length,0);
 assert.equal(d.correction,true);
});
test('dismissal parser preserves distinct wicket kinds',()=>{
 assert.equal(parseDismissal('lbw b Bowler').kind,'lbw');
 assert.equal(parseDismissal('run out (Fielder)').kind,'run out');
 assert.equal(parseDismissal('st Keeper b Bowler').kind,'stumped');
});
