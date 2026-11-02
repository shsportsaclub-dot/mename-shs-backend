const ANGLES={STRAIGHT:0,COVER:55,POINT:90,THIRD_MAN:135,FINE_LEG:-145,SQUARE_LEG:-90,MIDWICKET:-55,LONG_ON:-22,LONG_OFF:22};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const num=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function directionFor(region,hand='RIGHT'){if(!(region in ANGLES))throw new Error('Unknown region');return ANGLES[region]*(hand==='LEFT'?-1:1);}
export function positionOnRun(progress,count){const p=Math.max(0,Math.min(progress,count));const leg=Math.min(Math.floor(p),Math.max(0,count-1));const u=p-leg;return leg%2===0?u:1-u;}
function inferredRegion(text){const names={COVER:['cover','కవర్'],POINT:['point','పాయింట్'],MIDWICKET:['mid[ -]?wicket','మిడ్\\s*వికెట్'],FINE_LEG:['fine[ -]?leg','ఫైన్\\s*లెగ్'],SQUARE_LEG:['square[ -]?leg','స్క్వేర్\\s*లెగ్'],THIRD_MAN:['third[ -]?man','థర్డ్\\s*మ్యాన్'],LONG_ON:['long[ -]?on','లాంగ్\\s*ఆన్'],LONG_OFF:['long[ -]?off','లాంగ్\\s*ఆఫ్'],STRAIGHT:['straight','స్ట్రెయిట్']};const found=[];for(const [r,[en,te]]of Object.entries(names)){if(new RegExp(`\\b(?:through|towards?|over|past|to)\\s+(?:deep\\s+)?${en}\\b|\\b${en}\\s+drive\\b`,'i').test(text)||new RegExp(`${te}\\s*(?:వైపు|మీదుగా|డ్రైవ్)`,'u').test(text))found.push(r);}return found.length===1?found[0]:null;}
export function normalizeBall(raw){
 if(!raw||!id(raw.eventId))throw new Error('A stable eventId is required');
 const players=raw.players??{};if(!['striker','nonStriker','bowler'].every(r=>id(players[r]))||new Set([players.striker,players.nonStriker,players.bowler]).size!==3)throw new Error('Distinct scorer player IDs are required');
 const batRuns=raw.batRuns??0,extraRuns=raw.extraRuns??0,extraType=raw.extraType??'NONE',boundary=raw.boundary??'NONE',wicketType=raw.wicketType??'NONE',hand=raw.hand??'RIGHT';
 if(!num(batRuns,0,7)||!num(extraRuns,0,7))throw new Error('Runs must be integers from 0 to 7');
 if(!['NONE','WIDE','NO_BALL','BYE','LEG_BYE','PENALTY'].includes(extraType)||!['NONE','FOUR','SIX'].includes(boundary)||!['RIGHT','LEFT'].includes(hand)||!['NONE','BOWLED','CAUGHT','LBW','RUN_OUT','STUMPED','HIT_WICKET'].includes(wicketType))throw new Error('Unsupported event type');
 if(extraType==='NONE'&&extraRuns!==0||extraType!=='NONE'&&extraRuns<1||['WIDE','BYE','LEG_BYE','PENALTY'].includes(extraType)&&batRuns!==0)throw new Error('Inconsistent extras');
 const extraBoundary=boundary==='FOUR'&&batRuns===0&&(['BYE','LEG_BYE'].includes(extraType)&&extraRuns===4||extraType==='WIDE'&&extraRuns===5);
 if(boundary==='FOUR'&&batRuns!==4&&!extraBoundary||boundary==='SIX'&&batRuns!==6)throw new Error('Boundary does not match runs');
 if(wicketType!=='NONE'){
  if(boundary!=='NONE'||![players.striker,players.nonStriker].includes(raw.dismissedPlayer))throw new Error('Dismissal needs the dismissed player ID');
  if(extraType==='NO_BALL'&&!['RUN_OUT'].includes(wicketType)||extraType==='WIDE'&&!['RUN_OUT','STUMPED','HIT_WICKET'].includes(wicketType))throw new Error('Invalid dismissal on an illegal delivery');
  if(['BOWLED','CAUGHT','LBW','STUMPED','HIT_WICKET'].includes(wicketType)&&batRuns)throw new Error('Dismissal cannot include bat runs');
 }
 if(players.fielder&&(!id(players.fielder)||[players.striker,players.nonStriker].includes(players.fielder)))throw new Error('Invalid fielder');
 let region=raw.shotRegion??'UNKNOWN',directionSource='SCORER';
 if(region==='UNKNOWN'){region=inferredRegion(String(raw.commentary??''));directionSource=region?'COMMENTARY':'ILLUSTRATIVE';region??='STRAIGHT';}
 if(!(region in ANGLES))throw new Error('Unsupported shot region');
 let runsTaken=0;if(boundary==='NONE'){runsTaken=['NONE','NO_BALL'].includes(extraType)?batRuns:extraType==='WIDE'?extraRuns-1:['BYE','LEG_BYE'].includes(extraType)?extraRuns:0;}
 const outcome=wicketType!=='NONE'?'WICKET':boundary!=='NONE'?boundary:extraType!=='NONE'?extraType:batRuns?'RUNS':'DOT';
 const batContact=!['WIDE','BYE','LEG_BYE','PENALTY'].includes(extraType)&&!['BOWLED','LBW','STUMPED','HIT_WICKET'].includes(wicketType);
 const generated=outcome==='WICKET'?`WICKET! ${wicketType.replaceAll('_',' ')}.`:outcome==='FOUR'?`Through ${region.toLowerCase().replaceAll('_',' ')} — FOUR!`:outcome==='SIX'?`Over ${region.toLowerCase().replaceAll('_',' ')} — SIX!`:outcome==='DOT'?'Defended. No run.':`${extraType==='NONE'?'':extraType.replaceAll('_',' ')+' — '}${batRuns+extraRuns} run${batRuns+extraRuns===1?'':'s'}.`;
 if(raw.commentary!==undefined&&(typeof raw.commentary!=='string'||raw.commentary.length>2000))throw new Error('Invalid commentary text');
 if(raw.score&&!num(raw.score.runs,0,99999)||raw.score&&!num(raw.score.wickets,0,10)||raw.score&&!num(raw.score.legalBalls,0,99999))throw new Error('Invalid score snapshot');
 return {...raw,players:{...players},batRuns,extraRuns,extraType,boundary,wicketType,hand,region,directionSource,batContact,runsTaken,outcome,angle:!batContact&&extraBoundary&&directionSource==='ILLUSTRATIVE'?180:directionFor(region,hand),lofted:boundary==='SIX'||wicketType==='CAUGHT'||raw.shotHeight==='LOFTED',isLegal:!['WIDE','NO_BALL','PENALTY'].includes(extraType),commentary:raw.commentary||generated};
}
function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value);}
export class MatchQueue{
 constructor(capacity=64){this.capacity=capacity;this.pending=[];this.seen=new Map();this.acceptedScore={runs:0,wickets:0,legalBalls:0};}
 push(raw){const signature=stable(raw);if(this.seen.has(raw?.eventId)){if(this.seen.get(raw.eventId)!==signature)throw new Error('Event ID conflict');return {accepted:false};}if(this.pending.length>=this.capacity)throw new Error('Playback queue full');if(this.seen.size>=10000)throw new Error('Session capacity reached');const e=normalizeBall(raw);const s=this.acceptedScore;const score=e.score?{...e.score}:{runs:s.runs+e.batRuns+e.extraRuns,wickets:s.wickets+(e.wicketType!=='NONE'?1:0),legalBalls:s.legalBalls+(e.isLegal?1:0)};if(score.wickets>10||score.runs<e.batRuns+e.extraRuns)throw new Error('Invalid resulting score');e.score=score;this.pending.push(e);this.acceptedScore={...score};this.seen.set(e.eventId,signature);return {accepted:true,eventId:e.eventId};}
 next(){return this.pending.shift()??null;}
}
export function boundaryDistance(origin,degrees,a=75,b=65){const r=degrees*Math.PI/180,dx=Math.cos(r),dz=Math.sin(r),[x,z]=origin,A=dx*dx/(a*a)+dz*dz/(b*b),B=2*(x*dx/(a*a)+z*dz/(b*b)),C=x*x/(a*a)+z*z/(b*b)-1;return (-B+Math.sqrt(B*B-4*A*C))/(2*A);}
export function playbackDelta(now,previous){return previous?Math.max(0,Math.min((now-previous)/1000,.5)):0;}
