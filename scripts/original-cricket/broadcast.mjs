// Read-only presentation derived from saved deliveries in the current innings.
export function matchBroadcastSummary(records,context,score){
 const names=new Map((context.roster||[]).map(p=>[p.id,p.name])),batters=new Map(),bowlers=new Map(),highlights=[],achievements=[];
 const playerName=id=>names.get(id)||id||'Player';
 for(const record of records){
  const e=record.event,id=e.players?.striker,bid=e.players?.bowler,br=Number.isInteger(e.batRuns)?e.batRuns:0;
  if(!id||!bid)continue;
  if(!batters.has(id))batters.set(id,{id,name:playerName(id),runs:0,balls:0,fours:0,sixes:0,status:'not out'});
  if(!bowlers.has(bid))bowlers.set(bid,{id:bid,name:playerName(bid),runs:0,balls:0,wickets:0});
  const b=batters.get(id),bow=bowlers.get(bid),before=b.runs,priorWickets=bow.wickets,isLegal=!['WIDE','NO_BALL','PENALTY'].includes(e.extraType),milestones=[];
  b.runs+=br;if(isLegal)b.balls++;if(e.boundary==='FOUR'&&br===4)b.fours++;if(e.boundary==='SIX'&&br===6)b.sixes++;
  bow.runs+=br+(['WIDE','NO_BALL'].includes(e.extraType)?e.extraRuns:0);if(isLegal)bow.balls++;
  if(e.savedWicketLabel||e.wicketType&&e.wicketType!=='NONE'){
   const out=e.dismissedPlayer||id;if(!batters.has(out))batters.set(out,{id:out,name:playerName(out),runs:0,balls:0,fours:0,sixes:0,status:'not out'});batters.get(out).status=e.savedWicketLabel||e.wicketType.replaceAll('_',' ');
   if(['BOWLED','CAUGHT','LBW','STUMPED','HIT_WICKET'].includes(e.wicketType))bow.wickets++;
  }
  for(let n=50;n<=b.runs;n+=50)if(before<n)milestones.push(`${b.name} · ${n} runs`);
  for(const n of [3,5,10])if(priorWickets<n&&bow.wickets>=n)milestones.push(`${bow.name} · ${n} wickets`);
  for(const text of milestones)achievements.push({eventId:e.eventId,text});
  const wickets=!!e.savedWicketLabel||e.wicketType&&e.wicketType!=='NONE',highlight=wickets||e.boundary==='FOUR'||e.boundary==='SIX';
  if(highlight||milestones.length)highlights.push({eventId:e.eventId,kind:wickets?'WICKET':e.boundary!=='NONE'?e.boundary:'MILESTONE',text:wickets?`${playerName(e.dismissedPlayer||id)} · ${e.savedWicketLabel||e.wicketType.replaceAll('_',' ')}`:`${b.name} · ${e.boundary==='FOUR'?'FOUR':e.boundary==='SIX'?'SIX':br+' runs'}`,score:{...e.score},milestones});
 }
 return {inning:context.inning||1,bpo:context.bpo||6,score:{...score},batters:[...batters.values()],bowlers:[...bowlers.values()],highlights,achievements};
}
export function cricketBanner(event,summary){
 const wicket=event.wicketType&&event.wicketType!=='NONE',boundary=event.boundary==='FOUR'||event.boundary==='SIX';
 const milestones=summary?.highlights?.find(h=>h.eventId===event.eventId)?.milestones||[];
 return {title:wicket?'WICKET':boundary?event.boundary:milestones.length?'MILESTONE':event.extraType&&event.extraType!=='NONE'?event.extraType.replaceAll('_',' '):event.batRuns?`${event.batRuns} RUN${event.batRuns===1?'':'S'}`:'DOT BALL',kind:wicket?'wicket':boundary?'boundary':milestones.length?'milestone':'runs',subtitle:milestones.join(' • ')||event.commentary||'',score:`${event.score.runs} / ${event.score.wickets}`};
}
