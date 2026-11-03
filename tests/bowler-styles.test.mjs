import test from "node:test";import assert from "node:assert/strict";
import {BowlerStyleManager,BOWLER_HAND_TYPES as H,BOWLER_SKILL_STYLES as S} from "../public/themes/bowler-styles.js";
const m=new BowlerStyleManager();
test("supplied clip names preserved",()=>{
  assert.equal(m.getBowlerClip(H.RIGHT_ARM,S.FAST,"runUp"),"right_arm_fast_runup");
  assert.equal(m.getBowlerClip(H.RIGHT_ARM,S.OFF_SPIN,"delivery"),"right_arm_offspin_delivery");
  assert.equal(m.getBowlerClip(H.LEFT_ARM,S.LEG_SPIN,"delivery"),"left_arm_chinaman_delivery");
  assert.equal(m.getBowlerClip(H.LEFT_ARM,S.FAST,"appeal"),"left_arm_aggressive_appeal");
});
test("all 2 arms x 4 styles x 4 phases resolve to distinct non-default clips",()=>{
  const seen=new Set();
  for(const h of Object.values(H))for(const s of Object.values(S))for(const p of ["runUp","delivery","followThrough","appeal"]){
    const c=m.getBowlerClip(h,s,p);assert.notEqual(c,"default_bowler_action");seen.add(h+s+p+c)}
  assert.equal(seen.size,32);
});
test("left arm mirrors, right arm does not; unknown hand falls back",()=>{
  const l=m.setupBowlerAction(100,H.LEFT_ARM,S.MEDIUM),r=m.setupBowlerAction(0,H.RIGHT_ARM,S.MEDIUM);
  assert.equal(l[0].data.mirror,true);assert.equal(l[1].at,700);assert.equal(r[1].data.mirror,false);
  assert.equal(m.getBowlerClip("X",S.FAST,"runUp"),"right_arm_fast_runup");
});
