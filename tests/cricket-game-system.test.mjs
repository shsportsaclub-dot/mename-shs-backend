import test from "node:test";import assert from "node:assert/strict";
import {CricketGameSystem as G,MATCH_STAGES as M} from "../public/themes/cricket-game-system.js";
const mk=()=>{const log=[];const p=n=>new Proxy({},{get:(_,k)=>(...a)=>log.push([n,k,a])});return{log,r:p("r"),s:p("s"),t:p("t")}};
test("stage flow: practice, toss, walkout, celebration, back to play",()=>{
  const m=mk();const g=new G(m.r,m.s,m.t);assert.equal(g.currentStage,M.PRACTICE);
  g.executeToss("India","bat");assert.equal(g.currentStage,M.TOSS);g.playPlayersWalkout();assert.equal(g.currentStage,M.WALKOUT);
  g.triggerGameAction("MASSIVE_SIX");assert.equal(g.currentStage,M.CELEBRATION);assert.equal(g.endCelebration(),M.IN_PLAY);
});
test("duck only for zero; no crash without data",()=>{
  const banner=(runs)=>{const m=mk();new G(m.r,m.s,m.t).triggerGameAction("WICKET_BOWLED",runs===undefined?undefined:{batsman:"A",runs});return m.log.find(l=>l[1]==="showBigBanner")[2][0].detail};
  assert.match(banner(0),/duck/);assert.match(banner(35),/for 35/);assert.ok(!/duck/.test(banner(undefined)));
});
test("non-bowled wicket skips stump animation; unknown action does something",()=>{
  const m=mk();const g=new G(m.r,m.s,m.t);g.triggerGameAction("WICKET_FALL",{dismissal:"LBW"});
  assert.ok(!m.log.some(l=>l[1]==="animateWicket"));assert.ok(m.log.some(l=>l[1]==="speakCommentary"&&/LBW/.test(l[2][0])));
  m.log.length=0;g.triggerGameAction("SINGLE");assert.equal(g.currentStage,M.IN_PLAY);assert.equal(m.log.length,1);
});
test("te commentary",()=>{const m=mk();new G(m.r,m.s,m.t,{language:"te"}).executeToss("India","bat");assert.match(m.log.find(l=>l[1]==="speakCommentary")[2][0],/gelichi/)});
