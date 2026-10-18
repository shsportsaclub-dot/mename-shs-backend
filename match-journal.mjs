import commentary from './score-update-commentary.cjs';
const {createSHCommentaryEngine}=commentary;
const copy=x=>JSON.parse(JSON.stringify(x)),clean=(x,n=180)=>String(x??'').slice(0,n),validId=id=>/^(sm)?[a-z0-9-]{1,40}$/i.test(String(id))&&!['constructor','prototype','__proto__'].includes(id);
export function createMatchJournal({state={},save=()=>{},load=()=>null,now=Date.now}={}){
 state.matches=state.matches&&typeof state.matches==='object'?state.matches:{};state.engine=state.engine||{};
 const makeEngine=()=>createSHCommentaryEngine({now,storage:{getItem:()=>JSON.stringify(state.engine),setItem:(k,v)=>state.engine=JSON.parse(v)}});let engine=makeEngine();
 const trim=()=>{state.matches=Object.fromEntries(Object.entries(state.matches).filter(([id,m])=>validId(id)&&m&&now()-(m.checkedAt||0)<14*864e5).sort((a,b)=>b[1].checkedAt-a[1].checkedAt).slice(0,12))};
 const changed=()=>{trim();save(state)};
 function record(id,ep,data,{source='match provider',error='',corrected=false}={}){
  if(!validId(id)||!['currentMatches','match_info','match_squad','match_bbb','match_scorecard'].includes(ep))return null;if(!state.matches[id]){const archived=load(id);if(archived)restore(archived)}let m=state.matches[id]||(state.matches[id]={id,sources:{},score:[],balls:[]});const at=now();m.checkedAt=at;
  m.sources[ep]={checkedAt:at,ok:!error,...(error?{error:clean(error,250)}:{})};if(error){changed();return view(id)}
  if(ep==='match_scorecard'&&data&&Array.isArray(data.scorecard))m.sc=copy(data);
  if(ep==='match_info'&&data&&typeof data==='object')m.mi=copy(data);
  if(ep==='match_squad'&&Array.isArray(data)&&data.length)m.squads=copy(data);
  if(ep==='match_bbb'){
   const rows=Array.isArray(data)?data:Array.isArray(data?.bbb)?data.bbb:Array.isArray(data?.balls)?data.balls:[];
   if(rows.length&&m.derived&&!data?.tracked)m.balls=[];if(rows.length)m.derived=!!data?.tracked;
   const map=new Map((m.balls||[]).map(b=>[b._key,b]));const duplicates=new Map();
   for(const raw of rows.slice(0,6000)){if(!raw||typeof raw!=='object')continue;const inning=raw.inning??raw.innings??raw.scoreboard;if(inning==null||raw.over==null||raw.ball==null)continue;
    const root=String(inning)+'|'+raw.over+'|'+raw.ball,index=duplicates.get(root)||0;duplicates.set(root,index+1);
    const key=raw.id!=null?'id:'+raw.id:root+'|'+(raw.wide?'wd':raw.noball?'nb':'legal')+'|'+index;
    const b=copy(raw);delete b._key;for(const k of ['commentary','text','description'])if(b[k])b[k]=clean(b[k],700);map.set(key,{...b,_key:key});
   }m.balls=[...map.values()].slice(-6000);m.ballSource=data?.source||source;
  }
  const incoming=Array.isArray(data?.score)?copy(data.score):[];
  if(incoming.length){const previous=m.score.at(-1),next=incoming.at(-1),ov=x=>{const [a,b]=String(x??'').split('.');return +a*6+(+b||0)};
   const older=previous&&next&&(incoming.length<m.score.length||incoming.length===m.score.length&&previous.inning===next.inning&&(ov(next.o)<ov(previous.o)||ov(next.o)===ov(previous.o)&&(next.r<previous.r||next.w<previous.w)));
   if(older&&!corrected)m.sources[ep].behind=true;else{if(JSON.stringify(m.score)!==JSON.stringify(incoming))m.scoreChangedAt=at;m.score=incoming;m.scoreSource=ep}
  }
  const meta=m.mi||m.sc||data||{};m.ended=!!m.ended||!!(data?.matchEnded??data?.ended);m.started=!!m.started||!!(data?.matchStarted??data?.started);m.name=clean(meta.name||m.name);m.type=clean(meta.matchType||meta.type||m.type,30);
  const s=m.score.at(-1),card=(m.sc?.scorecard||[]).findLast(c=>String(c.inning).toLowerCase()===String(s?.inning).toLowerCase());
  const scScore=m.sc?.score?.at(-1),coherent=s&&card&&scScore&&s.inning===scScore.inning&&+s.r===+scScore.r&&+s.w===+scScore.w&&String(s.o)===String(scScore.o);
  if(s){const entry=engine.observe({matchId:id,inning:s.inning,team:String(s.inning).replace(/\s+innings?\s*\d*$/i,''),r:s.r,w:s.w,o:s.o,standardOvers:!/hundred/i.test(m.type),ended:m.ended,result:m.ended?(meta.status||''):'',batters:coherent?(card.batting||[]).map(b=>({id:b.batsman?.id,name:b.batsman?.name,r:b.r,b:b.b,fours:b['4s'],sixes:b['6s'],status:b['dismissal-text']||b.dismissal||'',active:/^(batting|not out)$/i.test(b['dismissal-text']||b.dismissal||'')})):[],bowlers:coherent?(card.bowling||[]).map(b=>({id:b.bowler?.id,name:b.bowler?.name,r:b.r,w:b.w,o:b.o})):[]});if(entry)m.commentary=[...(m.commentary||[]),entry].slice(-6000);const point=engine.points(id).at(-1),oldPoint=m.timeline?.at(-1);if(point&&(!oldPoint||point.at!==oldPoint.at||point.r!==oldPoint.r||point.w!==oldPoint.w||point.o!==oldPoint.o))m.timeline=[...(m.timeline||[]),point].slice(-6000);}
  changed();return view(id);
 }
 function view(id){const m=state.matches[id];if(!m)return null;return copy({...m,commentary:m.commentary||engine.entries(id),points:m.timeline||engine.points(id),coverage:{kind:m.balls.length?(m.derived?'derived delivery records':'recorded deliveries'):'score observations',balls:m.balls.length,historyStartsAt:(m.timeline||engine.points(id))[0]?.at||null},stale:!m.ended&&m.scoreChangedAt&&now()-m.scoreChangedAt>180000})}
 function restore(row){if(row?.match&&validId(row.match.id)){state.matches[row.match.id]=row.match;if(row.engine)state.engine[row.match.id]=row.engine;engine=makeEngine()}}
 return {record,view,restore,exportState:()=>copy(state)};
}
