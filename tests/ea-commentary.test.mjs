import test from "node:test";import assert from "node:assert/strict";
import {EAPerformanceCommentarySystem as C,LINES} from "../public/themes/ea-commentary.js";
const mk=()=>{const log=[];const p=n=>new Proxy({},{get:(_,k)=>(...a)=>log.push([n,k,a])});return{log,s:p("s"),g:p("g")}};
test("unknown event no longer crashes (default case)",()=>{const m=mk();new C(m.s,m.g).triggerEvent("RUN_1");assert.equal(m.log[0][1],"playAmbientCrowd")});
test("missing data does not crash",()=>{const m=mk();const c=new C(m.s,m.g);for(const e of["BOUNDARY_4","MASSIVE_SIX","WICKET_FALL","DOT_BALL_PRESSURE"])c.triggerEvent(e)});
test("wicket line follows the dismissal, not always 'Bowled'",()=>{
  const m=mk();new C(m.s,m.g).triggerEvent("WICKET_FALL",{batsman:"X",dismissal:"LBW"});
  const v=m.log.find(l=>l[1]==="speakVoiceover")[2][0];assert.ok(LINES.en.WICKET.LBW.includes(v));assert.ok(!/stumps are shattered|Timber/i.test(v));
  const m2=mk();new C(m2.s,m2.g).triggerEvent("WICKET_FALL",{dismissal:"BOWLED"});assert.equal(m2.log[0][2][0],"stumps_flying_clatt");
});
test("no immediate repeat; te lines available",()=>{
  const m=mk();const c=new C(m.s,m.g,{language:"te",random:()=>0});c.triggerEvent("MASSIVE_SIX");c.triggerEvent("MASSIVE_SIX");
  const v=m.log.filter(l=>l[1]==="speakVoiceover").map(l=>l[2][0]);assert.notEqual(v[0],v[1]);assert.ok(LINES.te.MASSIVE_SIX.includes(v[0]));
});
