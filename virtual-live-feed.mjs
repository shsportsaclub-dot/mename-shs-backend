import {normalizeBall} from './scripts/original-cricket/core.mjs';
// Read-only adapter for the existing /api/shared/matches/:id scorer format.
const liveId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const liveStable=v=>Array.isArray(v)?'['+v.map(liveStable).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+liveStable(v[k])).join(',')+'}':JSON.stringify(v);
const wicketKinds={'Bowled':'BOWLED','Caught':'CAUGHT','LBW':'LBW','Run out':'RUN_OUT','Stumped':'STUMPED','Hit wicket':'HIT_WICKET'};
function liveRegion(ang,hand){if(!ang||!Number.isFinite(ang.a))return 'UNKNOWN';let degrees=Math.atan2(Math.cos(ang.a),-Math.sin(ang.a))*180/Math.PI;if(hand==='LEFT')degrees=-degrees;let sector=Math.round(degrees/45);if(sector< -3)sector+=8;if(sector>4)sector-=8;return ({0:'STRAIGHT',1:'COVER',2:'POINT',3:'THIRD_MAN',4:'UNKNOWN','-3':'FINE_LEG','-2':'SQUARE_LEG','-1':'MIDWICKET'})[sector]||'UNKNOWN';}
export function scorerSnapshot(data,matchId){
 const m=data?.m;if(!m||m.id!==matchId||!Array.isArray(m.innings))throw new Error('Published match data does not match this viewer');
 const bpo=Number(m.bpo)||6,nbp=Number(m.nbp)||1,index=Number.isInteger(m.cur)?m.cur:0,inn=m.innings[index];
 if(!Number.isInteger(bpo)||bpo<1||bpo>12||!Number.isInteger(nbp)||nbp<1||nbp>7)throw new Error('Unsupported match format');
 const playerData=data.players||{},batTeam=inn?.bat,fieldTeam=inn?.bowl,fieldingXI=(m.xi?.[fieldTeam]||[]).map(String),battingXI=(m.xi?.[batTeam]||[]).map(String);
 const roster=Object.entries(playerData).filter(([id])=>liveId(id)).map(([id,p])=>({id,name:String(p?.name||id).slice(0,100),team:fieldingXI.includes(id)?'field':'bat',number:Number(p?.jersey)||undefined,role:String(p?.role||''),bowlingStyle:String(p?.bowl||'').slice(0,100),hand:/left/i.test(p?.bat||'')?'LEFT':'RIGHT'}));
 const keeper=fieldingXI.includes(m.keeper?.[fieldTeam])?m.keeper[fieldTeam]:fieldingXI.find(id=>/^(wk|wicket.?keeper)$/i.test(playerData[id]?.role||''))||null;
 const cur=inn?.cur||{};const currentPlayers=[cur.s,cur.n,cur.bl].every(liveId)?{striker:cur.s,nonStriker:cur.n,bowler:cur.bl}:null;
 const teams=[m.a,m.b].map(tid=>{const xi=(m.xi?.[tid]||[]).map(String).filter(liveId);return {id:tid,name:String(data.teams?.[tid]?.name||tid||'Team').slice(0,100),xi,captain:xi.includes(m.cap?.[tid])?m.cap[tid]:null};});
 const toss=teams.some(t=>t.id===m.toss)&&['bat','bowl'].includes(m.dec)?{winner:m.toss,decision:m.dec}:null;
 const context={teams,toss,matchId,title:[data.teams?.[m.a]?.name||m.a,data.teams?.[m.b]?.name||m.b].join(' vs '),venue:String(m.venue||''),status:String(m.status||''),bpo,inning:index+1,roster,fieldingXI,keeper,currentPlayers};
 const score={runs:0,wickets:0,legalBalls:0},records=[];
 const dis=Array.isArray(inn?.dis)?inn.dis:[],pen=Array.isArray(inn?.pen)?inn.pen:[];
 for(const p of pen)score.runs+=Math.max(0,Number(p.r)||0);
 score.wickets+=dis.filter(d=>d.t<0).length;
 const raw=Array.isArray(inn?.ev)?inn.ev:[];
 for(let j=0;j<raw.length;j++){
  const e=raw[j]||{},r=Number(e.r)||0,x=e.x||'',isLegal=x!=='wd'&&x!=='nb';
  score.runs+=r+(x==='wd'?1:x==='nb'?nbp:0);if(e.w)score.wickets++;if(isLegal)score.legalBalls++;score.wickets+=dis.filter(d=>d.t===j).length;
  const ids={striker:e.bt,nonStriker:e.pre?.n,bowler:e.bl};
  const hand=/left/i.test(playerData[e.bt]?.bat||'')?'LEFT':'RIGHT';
  const extras={wd:'WIDE',nb:'NO_BALL',b:'BYE',lb:'LEG_BYE'};
  const extraType=extras[x]||'NONE',batRuns=['','nb'].includes(x)?r:0,extraRuns=x==='wd'?r+1:x==='nb'?nbp:['b','lb'].includes(x)?r:0;
  const boundary=!e.ot&&!e.w?(r===6&&!['wd','b','lb'].includes(x)?'SIX':r===4?'FOUR':'NONE'):'NONE';
  const wk=e.w?wicketKinds[e.w]:null;
  let supported=Object.values(ids).every(liveId)&&new Set(Object.values(ids)).size===3&&Number.isInteger(r)&&r>=0&&r<=7&&extraRuns<=7&&!e.ot&&(!e.w||!!wk)&&(!x||x in extras);
  const dismissed=e.out||e.bt;
  if(e.w&&![ids.striker,ids.nonStriker].includes(dismissed))supported=false;
  const fielderMatches=fieldingXI.filter(id=>id===e.fld||playerData[id]?.name===e.fld);
  if(fielderMatches.length===1)ids.fielder=fielderMatches[0];
  const region=liveRegion(e.ang,hand),batter=String(playerData[e.bt]?.name||e.bt||'Batter'),bowler=String(playerData[e.bl]?.name||e.bl||'Bowler');
  const commentary=String(e.commentary||e.text||'').trim().slice(0,2000)||`${bowler} to ${batter}. ${e.w?e.w+' — wicket.':boundary==='FOUR'?'FOUR!':boundary==='SIX'?'SIX!':x==='wd'?'Wide.':x==='nb'?'No ball. '+r+' bat runs.':r?r+' run'+(r===1?'':'s')+'.':'No run.'}${region==='UNKNOWN'?'':' Toward '+region.toLowerCase().replaceAll('_',' ')+'.'}`;
  const event={eventId:`${matchId}-i${index}-b${j}`,players:ids,batRuns,boundary,extraType,extraRuns,wicketType:wk||'NONE',...(wk?{dismissedPlayer:dismissed}:{}),shotRegion:region,hand,commentary,score:{...score},inning:index+1};
  try{normalizeBall(event);}catch{supported=false;}
  records.push({key:liveStable(e),event,supported,reason:supported?'':'This saved action needs unsupported details or complete player IDs'});
 }
 return {matchId,epoch:liveStable([index,bpo,nbp,dis,pen]),records,score:{...score},context};
}
export class FeedCursor{
 constructor(matchId,viewer){this.matchId=matchId;this.viewer=viewer;this.epoch=null;this.keys=[];}
 baseline(snapshot,mode,note){this.viewer.syncBaseline(snapshot.score,snapshot.context);this.epoch=snapshot.epoch;this.keys=snapshot.records.map(r=>r.key);this.viewer.showStatus(note);return {mode};}
 ingest(snapshot){
  if(snapshot.matchId!==this.matchId)throw new Error('Feed match changed');this.viewer.applyContext(snapshot.context);
  if(this.epoch===null)return this.baseline(snapshot,'baseline','Connected to scorer. Waiting for the next saved ball.');
  if(this.epoch!==snapshot.epoch||this.keys.length>snapshot.records.length||this.keys.some((k,i)=>k!==snapshot.records[i]?.key))return this.baseline(snapshot,'resync','Score correction or innings change synced. Waiting for the next saved ball.');
  const next=snapshot.records.slice(this.keys.length);
  if(next.some(r=>!r.supported))return this.baseline(snapshot,'unsupported','Score synced; one saved action cannot be visualized accurately by this prototype.');
  for(const record of next){this.viewer.pushBall(record.event);this.keys.push(record.key);}
  this.viewer.showStatus(next.length?`${next.length} scorer event${next.length===1?'':'s'} received.`:'Scorer connected · waiting for the next saved ball.');
  return {mode:next.length?'append':'unchanged',count:next.length};
 }
}
export class LiveFeedConnection{
 constructor({matchId,viewer,fetchImpl=(...args)=>globalThis.fetch(...args),subscribe=null,intervalMs=2500}){if(!liveId(matchId))throw new Error('Invalid match ID');this.matchId=matchId;this.viewer=viewer;this.fetchImpl=fetchImpl;this.subscribe=subscribe;this.intervalMs=intervalMs;this.cursor=new FeedCursor(matchId,viewer);this.busy=false;this.closed=false;}
 async poll(){if(this.closed||this.busy)return;this.busy=true;try{const response=await this.fetchImpl('/api/shared/matches/'+encodeURIComponent(this.matchId),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Match feed HTTP '+response.status);const j=await response.json();if(!j.ok||!j.item?.data)throw new Error('Match is not published yet');this.cursor.ingest(scorerSnapshot(j.item.data,this.matchId));}catch(e){this.viewer.showStatus('Scorer connection: '+e.message);}finally{this.busy=false;}}
 start(){this.poll();this.timer=setInterval(()=>this.poll(),this.intervalMs);if(this.subscribe)this.unsubscribe=this.subscribe(change=>{if(change.col==='matches'&&change.id===this.matchId)this.poll()});return this;}
 stop(){this.closed=true;clearInterval(this.timer);if(this.unsubscribe)this.unsubscribe();}
}
