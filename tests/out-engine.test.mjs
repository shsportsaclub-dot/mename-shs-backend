import test from "node:test";import assert from "node:assert/strict";
import {OUT_TYPES,DETAILED_OUT_SCENES,AdvancedCricketEngine} from "../public/themes/out-engine.js";
test("all 13 OUT types have a time-ordered scene",()=>{
  for(const id of Object.values(OUT_TYPES)){const s=DETAILED_OUT_SCENES[id];assert.ok(s&&s.length>=3,id);
    for(let i=1;i<s.length;i++)assert.ok(s[i].at>=s[i-1].at,id+" order");}
  assert.equal(Object.keys(OUT_TYPES).length,13);
});
test("engine dispatches every step with equipment lock",async()=>{
  const calls=[];const ad={avatar:{play:(a,c,o)=>calls.push([a,c,o])},camera:{shot:()=>calls.push(["cam"])},ball:{animate:()=>calls.push(["ball"])},wicket:{animate:()=>calls.push(["w"])}};
  const e=new AdvancedCricketEngine(ad);e.playEvent({type:"OUT-10"});
  await new Promise(r=>setTimeout(r,1700));
  assert.equal(calls.length,DETAILED_OUT_SCENES["OUT-10"].length);
  assert.equal(calls.find(c=>c[2])[2].equipmentLock.bat,"SH_Sports_English_Willow");
});
