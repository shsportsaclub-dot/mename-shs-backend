function createSHScorerPhases(){
 function summary(events,{ballsPerOver=6,limit=0,marked={},inning=0,noBallPenalty=1}={}){let legal=0,runs=0,wickets=0,balls=0;const overs=new Set();for(const e of events||[]){const extra=e.x==='wd'||e.x==='nb',over=Math.floor(legal/ballsPerOver),key=inning+':'+over,active=Object.prototype.hasOwnProperty.call(marked,key)?!!marked[key]:legal<limit;if(active){runs+=(+e.r||0)+(e.x==='wd'?1:e.x==='nb'?noBallPenalty:0);wickets+=+!!e.w;if(!extra)balls++;overs.add(over+1)}if(!extra)legal++}return{runs,wickets,balls,overs:[...overs]}}
 return{summary};
}
if(typeof module!=='undefined')module.exports={createSHScorerPhases};
