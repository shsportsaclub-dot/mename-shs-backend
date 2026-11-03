import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {SHOTS} from "../public/vendor/batting-master.js";
const dir=new URL("../public/vendor/batpose/",import.meta.url);
const ids=["STANCE",...SHOTS.map(s=>s.id)];
test("every shot has a baked pose table for right and left hand",()=>{
  for(const h of ["R","L"])for(const id of ids)assert.ok(fs.existsSync(new URL(`${id}_${h}.json`,dir)),`${id}_${h}.json missing`);
});
test("tables are well formed and the grip stays on the handle",()=>{
  let worstG=0,worstP=0;
  for(const h of ["R","L"])for(const id of ids){
    const t=JSON.parse(fs.readFileSync(new URL(`${id}_${h}.json`,dir),"utf8"));
    assert.equal(t.hand,h);assert.equal(t.fps,30);
    const w=t.keys.reduce((s,[,n])=>s+n,0);
    assert.ok(t.f.length>=2,id);
    assert.equal(t.f.length,id==="STANCE"?2:Math.ceil(t.dur*30)+1,id+" frames");
    for(const fr of t.f){assert.equal(fr.length,w);for(const v of fr)assert.ok(Number.isFinite(v))}
    if(id!=="STANCE"){worstG=Math.max(worstG,t.m.g);worstP=Math.max(worstP,t.m.p)}
  }
  assert.ok(worstG<=4,"worst grip error "+worstG+" cm");   // hands vs handle
  assert.ok(worstP<=1.5,"worst bat penetration "+worstP+" cm");
});
