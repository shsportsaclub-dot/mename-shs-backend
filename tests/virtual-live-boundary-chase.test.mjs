import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const modulePath=new URL('../scripts/original-cricket/boundary-chase.mjs',import.meta.url);
const d=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('boundary chase reacts after impact and remains speed-limited, inside the rope and deterministic',async()=>{
 assert.ok(fs.existsSync(modulePath),'boundary chase sampler required');const {sampleBoundaryChase:sample}=await import(modulePath);
 for(const boundary of ['FOUR','SIX']){
 const args={start:[19,0,31],end:[90,.036,70],boundary};
 assert.deepEqual(sample({...args,time:2.87}).position,args.start);
 const a=sample({...args,time:3}),b=sample({...args,time:4});assert.ok(d(a.position,b.position)>0);assert.ok(d(a.position,b.position)<=7.000001);assert.equal(b.mode,'run');
 for(const time of [0,2.7,2.88,3,4,8,100]){const x=sample({...args,time});assert.deepEqual(x,sample({...args,time}));assert.ok([...x.position,x.yaw,x.localTime].every(Number.isFinite));assert.ok((x.position[0]/75)**2+(x.position[2]/65)**2<1);}
 assert.equal(sample({...args,time:100}).mode,'idle');
 }
 assert.equal(sample({time:5,start:[0,0,0],end:[1,0,0],boundary:'NONE'}),null);
 const zero=sample({time:6,start:[0,0,0],end:[0,0,0],boundary:'FOUR'});assert.equal(zero.mode,'idle');assert.ok([...zero.position,zero.yaw].every(Number.isFinite));
});
