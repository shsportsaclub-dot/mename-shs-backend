function createSHPulseModel(){
 const name=x=>typeof x==='object'&&x?String(x.name||''):String(x||'');
 function deliveries(data){const rows=Array.isArray(data)?data:data?.bbb||data?.balls||[];if(!Array.isArray(rows))return[];
 return rows.map((x,index)=>{if(!x||typeof x!=='object')return null;const inning=x.inning??x.innings??x.scoreboard,over=Number(x.over),ball=Number(x.ball),runs=Number(x.total_runs??(typeof x.runs==='object'?x.runs.total:x.runs)??x.run);
 if(inning==null||!Number.isInteger(over)||over<0||!Number.isInteger(ball)||ball<1||ball>6||!Number.isFinite(runs)||runs<0)return null;
 const wide=!!x.wide||Number(x.extras?.wides)>0,noball=!!x.noball||Number(x.extras?.noballs)>0,wicket=x.wicket===true||x.wicket===1||x.isWicket===true||Array.isArray(x.wickets)&&x.wickets.length>0;
 const label=wicket?'W':wide?runs+'wd':noball?runs+'nb':String(runs),derived=!!data?.tracked||!!x.derived;
 const batter=name(x.batsman||x.batter),bowler=name(x.bowler),result=wicket?'Wicket'+(x.out?' · '+name(x.out):'')+(x.kind?' · '+x.kind:''):wide?runs+' wide'+(runs===1?'':'s'):noball?runs+' run'+(runs===1?'':'s')+' including no-ball':runs===0?'No run':runs===4?'Four':runs===6?'Six':runs+' run'+(runs===1?'':'s');
 return{team:name(x.team),inning:String(inning),over,ball,runs,wide,noball,wicket,label,derived,batter,bowler,index,text:String(x.commentary||x.text||x.comment||x.description||'').trim()||[bowler&&batter?bowler+' to '+batter:bowler||batter,result].filter(Boolean).join(' — ')};
 }).filter(Boolean).sort((a,b)=>a.inning.localeCompare(b.inning,undefined,{numeric:true})||a.over-b.over||a.ball-b.ball||a.index-b.index);
 }
 function overs(data){const map=new Map();for(const b of deliveries(data)){const key=b.inning+'|'+b.over;let g=map.get(key);if(!g)map.set(key,g={inning:b.inning,over:b.over,runs:0,wickets:0,balls:[]});g.runs+=b.runs;g.wickets+=+b.wicket;g.balls.push(b)}return[...map.values()].map(g=>{const legal=g.balls.filter(b=>!b.wide&&!b.noball);return{...g,complete:legal.length===6&&new Set(legal.map(b=>b.ball)).size===6,derived:g.balls.some(b=>b.derived)}}).map((g,i,all)=>{const before=all.slice(0,i+1).filter(x=>x.inning===g.inning);const full=before.every((x,n)=>x.over===n&&x.complete);return{...g,knownTotal:full?{r:before.reduce((s,x)=>s+x.runs,0),w:before.reduce((s,x)=>s+x.wickets,0)}:null}})}
 return{deliveries,overs};
}
if(typeof module!=='undefined')module.exports={createSHPulseModel};
