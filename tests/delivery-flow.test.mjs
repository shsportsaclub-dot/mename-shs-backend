import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createSportmonks } from '../sportmonks.mjs';
const file=process.env.SH_APP_FILE||'app-index.html';
const html=fs.readFileSync(file,'utf8');
test('all inline scripts compile, and flow helpers are inside the script',()=>{
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 assert.ok(html.indexOf('/* WORLD DETAIL FLOW:')>html.indexOf('<script'));
 assert.ok(!html.includes("if(W.bbErr||W.mi?.bbbEnabled===false)return"));
 assert.ok(html.includes("comm(shAvailableBalls(W).length?{...W,bbErr:''}:W)"));
});
test('Sportmonks keeps explicit innings so a two-innings chart can separate deliveries',async()=>{
 const raw=[{inning:1,ball:0.1,team_id:10,score:{runs:4}},{scoreboard:'S2',ball:0.1,team_id:20,score:{runs:1,is_wicket:true}},{ball:0.2,score:{runs:0}}];
 const sm=createSportmonks({token:'test',fetchImpl:async()=>({ok:true,json:async()=>({data:{balls:raw}})})});
 const rows=await sm.bbb(1);assert.equal(rows[0].inning,1);assert.equal(rows[1].inning,2);assert.equal(rows[1].wicket,true);assert.equal(rows[1].runs,1);assert.equal(rows[0].team_id,10);assert.equal(rows[2].inning,undefined);
});
test('refresh retains good delivery data on transient error and stops after leaving the match',async()=>{
 const a=html.indexOf('/* WORLD DETAIL FLOW:'),b=html.indexOf('/* END WORLD DETAIL FLOW */',a);
 const W={m:{id:'fixture',started:true,ended:false},bb:{bbb:[{inning:1,over:0,ball:1,runs:4}]}};let calls=0,renders=0,observed=0;
 const context={shObserveScoreCommentary(snapshot){assert.equal(snapshot,W);observed++},UI:{view:'wmatch',wm:W},document:{hidden:false},A:{wOpen(){},wmTab(){}},XV:{wmatch(){}},cbpGraphs(){},setInterval(){},render(){renders++},wLoad:async ep=>{calls++;return ep==='match_bbb'?{ok:false,error:'Temporary failure'}:{ok:true,data:ep==='match_scorecard'?{score:[]}:{matchStarted:true,matchEnded:false}}},Date};
 vm.createContext(context);vm.runInContext(html.slice(a,b),context);await context.shRefreshWorldDetails(W,true);assert.equal(calls,3);assert.equal(W.bb.bbb[0].runs,4);assert.equal(W.detailBusy,false);assert.equal(W.bbBusy,0);assert.equal(renders,1);assert.equal(observed,1);
 context.UI.view='home';await context.shRefreshWorldDetails(W,true);assert.equal(calls,3);
});
