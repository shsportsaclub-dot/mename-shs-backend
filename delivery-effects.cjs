/* SH delivery effects: arrival effects, never a simulated or predicted ball. */
function createSHDeliveryEffects({storage=null,now=Date.now}={}){
 let state={};try{state=JSON.parse(storage?.getItem('sh-delivery-effects-v1')||'{}')}catch{}
 for(const s of Object.values(state))delete s.effect;
 const persist=()=>{try{storage?.setItem('sh-delivery-effects-v1',JSON.stringify(Object.fromEntries(Object.entries(state).slice(-40))))}catch{}};
 const signature=b=>String(b.eventId||b._key||b.id||[b.inning,b.over,b.ball,b.wide?'wd':b.noball?'nb':'legal',b.index??''].join('|'));
 function observe(id,rows,{active=true,ended=false,fromStart=false}={}){
  if(!id||!Array.isArray(rows))return null;if(!rows.length){if(fromStart&&!state[id]){state[id]={key:'',position:'1|-1|0',count:0,ended,seen:[]};persist()}return null}const last=rows.at(-1),key=signature(last),position=String(last.inning)+'|'+last.over+'|'+last.ball,count=rows.filter(b=>String(b.inning)+'|'+b.over+'|'+b.ball===position).length;
  let s=state[id];if(!s){state[id]={key,position,count,ended,seen:rows.slice(-300).map(signature)};persist();return null}
  const known=s.seen.includes(key),same=s.position===position,old=s.position.split('|'),forward=String(last.inning)!==old[0]? !s.seen.some(k=>k===key):last.over*6+last.ball>+old[1]*6+(+old[2]);
  // Same-position replacement is a correction; repeated extras require an added delivery.
  const batRuns=last.batRuns??(!last.xtype&&!last.wide&&!last.noball?last.runs:null);
  let emitted=false;
  if(!known&&active&&(!ended||!s.ended)&&(forward||same&&count>s.count)){
   const kind=last.wicket?'wicket':!last.wide&&!last.noball&&batRuns===6?'six':!last.wide&&!last.noball&&batRuns===4?'four':last.wide?'wide':last.noball?'noball':last.runs===0?'dot':'runs';
   emitted=true;s.effect={kind,label:kind==='wicket'?'WICKET':kind==='six'?'SIX':kind==='four'?'FOUR':kind==='wide'?'WIDE':kind==='noball'?'NO BALL':kind==='dot'?'DOT BALL':last.runs+' RUN'+(last.runs===1?'':'S'),at:now(),key,over:last.over+'.'+last.ball,caption:[last.bowler,last.batter].filter(Boolean).join(' → ')};
  }
  if(key!==s.key&&!emitted)s.effect=null;
  if(!known)s.seen=[...s.seen,key].slice(-300);s.key=key;s.position=position;s.count=count;s.ended=ended;
  if(!active)s.effect=null;persist();return s.effect&&now()-s.effect.at<2600?s.effect:null;
 }
 return{observe};
}
if(typeof module!=='undefined')module.exports={createSHDeliveryEffects};
