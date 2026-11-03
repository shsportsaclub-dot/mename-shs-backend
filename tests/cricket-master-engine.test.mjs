import test from "node:test";import assert from "node:assert/strict";
import {OUT_TYPES,MASTER_SEQUENCES,MasterCricketEngine} from "../public/themes/cricket-master-engine.js";
test("all 13 outs defined; every step has numeric ascending timing",()=>{
  assert.equal(Object.keys(OUT_TYPES).length,13);
  for(const id of Object.values(OUT_TYPES)){const s=MASTER_SEQUENCES[id];assert.ok(s&&s.length>=3,id);
    for(let i=0;i<s.length;i++){assert.ok(Number.isFinite(s[i].at)&&s[i].at>=0,id+" at");assert.ok(["avatar","ball","wicket","camera","graphics"].includes(s[i].target));
      if(i)assert.ok(s[i].at>=s[i-1].at,id+" order")}}
});
test("dispatch: show/play/shot/animate, hand preference, left-arm bowler mirror",async()=>{
  const got=[];const mk=n=>new Proxy({},{get:(_,k)=>k==="getRigBinder"?undefined:(...a)=>got.push([n,k,a])});
  const e=new MasterCricketEngine({avatar:mk("avatar"),camera:mk("camera"),ball:mk("ball"),wicket:mk("wicket"),graphics:mk("graphics")});
  e.playSequence("OUT-13",{handPreference:"left_hand"});await new Promise(r=>setTimeout(r,1500));
  assert.equal(got.length,4);assert.equal(got[1][0],"graphics");assert.equal(got[3][2][2].handPreference,"left_hand");
  got.length=0;e.playSequence("OUT-03",{bowlerHand:"LEFT_ARM"});await new Promise(r=>setTimeout(r,1500));
  assert.equal(got.find(g=>g[2][0]==="bowler")[2][2].mirror,true);assert.equal(got.find(g=>g[2][0]==="batter")[2][2].mirror,undefined);
  e.playSequence("NOPE");
});

test("rig binder hook runs before play, and is optional",async()=>{
  const order=[];const av={getRigBinder:a=>({applyRigConstraints:(actor,clip,o)=>order.push(["bind",actor,o.handPreference])}),play:(a)=>order.push(["play",a])};
  const e=new MasterCricketEngine({avatar:av});e.playSequence("OUT-10",{handPreference:"left_hand"});await new Promise(r=>setTimeout(r,300));
  assert.deepEqual(order,[["bind","batter","left_hand"],["play","batter"]]);
  const e2=new MasterCricketEngine({avatar:{play:()=>order.push("noBinder")}});e2.playSequence("OUT-10");await new Promise(r=>setTimeout(r,300));
  assert.equal(order.at(-1),"noBinder");
});
