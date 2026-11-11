// Scoring Heroes: verified player imagery and scorecard-driven editorial helpers.
// Google image search is discovery, never a license or identity proof.
const clean = (x,n=120)=>String(x??'').trim().slice(0,n);
export function playerPhotoSearch(player, team) {
 const name=clean(player,90), side=clean(team,90);
 if(!name || !side) return {ok:false,reason:'Player and team required'};
 const query=[name,side,'cricket player official photo'].join(' ');
 return {ok:true,player:name,team:side,query,searchUrl:'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(query),status:'review-required'};
}
export function approvePlayerPhoto({player,team,url,source,license,attribution,identityVerified=false,rightsVerified=false}={}) {
 const u=clean(url,2048);
 if(!/^https:\/\//i.test(u)||!clean(player)||!clean(team)||!clean(source)||!clean(license)||!clean(attribution)||identityVerified!==true||rightsVerified!==true)
  return {ok:false,reason:'Identity, HTTPS source, attribution and publication rights must be verified'};
 return {ok:true,player:clean(player),team:clean(team),url:u,source:clean(source,500),license:clean(license),attribution:clean(attribution,300),approved:true};
}
export function performanceInsights(scorecard={}) {
 const batting=Array.isArray(scorecard.batting)?scorecard.batting:[];
 const bowling=Array.isArray(scorecard.bowling)?scorecard.bowling:[];
 const batters=batting.filter(x=>clean(x.name)&&Number.isFinite(Number(x.runs))&&Number(x.runs)>=0)
  .map(x=>({name:clean(x.name),team:clean(x.team),runs:Number(x.runs),balls:Number.isFinite(Number(x.balls))?Number(x.balls):null,fours:Number.isFinite(Number(x.fours))?Number(x.fours):null,sixes:Number.isFinite(Number(x.sixes))?Number(x.sixes):null}))
  .sort((a,b)=>b.runs-a.runs);
 const bowlers=bowling.filter(x=>clean(x.name)&&Number.isFinite(Number(x.wickets))&&Number(x.wickets)>=0)
  .map(x=>({name:clean(x.name),team:clean(x.team),wickets:Number(x.wickets),runsConceded:Number.isFinite(Number(x.runsConceded))?Number(x.runsConceded):null}))
  .sort((a,b)=>b.wickets-a.wickets || (a.runsConceded??999)-(b.runsConceded??999));
 const paragraphs=[];
 if(batters.length) {const p=batters[0];paragraphs.push(p.name+' led the recorded batting figures with '+p.runs+' runs'+(p.balls!=null?' from '+p.balls+' balls':'')+'.');}
 if(bowlers.length) {const p=bowlers[0];paragraphs.push(p.name+' led the recorded wicket tally with '+p.wickets+' wicket'+(p.wickets===1?'':'s')+'.');}
 return {batters,bowlers,paragraphs,hasPlayerData:!!(batters.length||bowlers.length)};
}
