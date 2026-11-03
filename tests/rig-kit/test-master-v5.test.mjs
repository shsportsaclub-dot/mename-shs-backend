import assert from 'node:assert/strict';
import {MASTER_SEQUENCES,validateSequences,MasterCricketEngine,OUT_TYPES} from '../../public/rig-kit/master-cricket-engine-v5.mjs';
assert.deepEqual(validateSequences(),[]);
assert.equal(Object.keys(MASTER_SEQUENCES).length,13);
let now=[];let next=0;const calls=[];
const clock={setTimeout(fn,ms){const id=++next;now.push({id,fn,ms});return id;},clearTimeout(id){now=now.filter(t=>t.id!==id)}};
const adapters=Object.fromEntries(['avatar','ball','wicket','camera','graphics'].map(k=>[k,Object.fromEntries(['play','animate','shot','show'].map(m=>[m,(...args)=>calls.push([k,m,args])]))]));
const engine=new MasterCricketEngine(adapters,{clock,strict:true});
for(const type of Object.values(OUT_TYPES))for(const handPreference of ['right_hand','left_hand']){
  const res=engine.playSequence(type,{handPreference});assert.ok(res.commands>0);
  const scheduled=[...now];for(const task of scheduled.sort((a,b)=>a.ms-b.ms))task.fn();
  assert.ok(calls.length>0);calls.length=0;
}
engine.playSequence('OUT-01');const old=[...now];engine.playSequence('OUT-02');for(const task of old)task.fn();assert.equal(calls.length,0,'stale callbacks ignored');
assert.throws(()=>engine.playSequence('OUT-99'));
console.log('PASS: 13 sequences, 26 handedness runs, adapter dispatch, stale callback cancellation, validation');
