/* Facts used by the compact live view. No delivery or player is inferred from a score delta. */
function createSHLiveView(){
 const num=v=>v==null||v===''||!Number.isFinite(Number(v))?null:Number(v);
 const balls=(v,bpo)=>{if(v==null||v==='')return null;const p=String(v).split('.'),o=Number(p[0]),b=Number(p[1]||0);return Number.isInteger(o)&&o>=0&&Number.isInteger(b)&&b>=0&&b<bpo?o*bpo+b:null};
 function model(W,all=[]){
  const m=W.m||{},cards=W.sc?.scorecard||[],scores=m.score?.length?m.score:W.sc?.score||[],index=Math.max(cards.length,scores.length,1),card=cards[index-1]||{},score=scores[index-1]||{},tot=card.totals||{},bpo=num(m.bpo)||(/hundred/i.test(m.type||'')?5:6),used=balls(score.o??tot.O??card.o,bpo),r=num(score.r??tot.R??card.r),w=num(score.w??tot.W??card.w),o=score.o??tot.O??card.o;
  const unlimited=/test|first.?class|multi.?day/i.test(m.type||'')||num(m.overs)>=900,ov=num(m.ov??m.overs),maxBalls=unlimited?null:num(m.maxBalls??m.totalBalls)??(/hundred/i.test(m.type||'')?100:(ov>0?ov*bpo:/odi|odm/i.test(m.type||'')?300:/t10/i.test(m.type||'')?60:120));
  const rows=all.filter(b=>String(b.inning)===String(index)),last=rows.at(-1)||null,over=last?.over,overRows=last?rows.filter(b=>b.over===over):[],previous=last?rows.filter(b=>b.over===over-1):[],legal=overRows.filter(b=>!b.wide&&!b.noball).length;
  const explicit=num(m.target??W.mi?.target??W.sc?.target),first=num(scores[0]?.r??cards[0]?.totals?.R??cards[0]?.r),target=!unlimited&&index===2?(explicit>0?explicit:first==null?null:first+1):null,left=maxBalls==null||used==null?null:Math.max(0,maxBalls-used),need=target==null||r==null?null:Math.max(0,target-r),rrr=need!=null&&left>0?need*bpo/left:null,crr=used>0&&r!=null?r*bpo/used:null;
  const dis=b=>String(b['dismissal-text']??b.dismissal??'').trim().toLowerCase(),batters=(card.batting||[]).filter(b=>b.batsman?.name),active=batters.filter(b=>/^(batting|not out)$/.test(dis(b))).slice(0,2),out=batters.filter(b=>dis(b)&&!/^(batting|not out|did not bat|yet to bat)$/.test(dis(b))),lastWicket=out.at(-1)||null,bowling=(card.bowling||[]).filter(b=>b.bowler?.name),bowler=last?.bowler?bowling.find(b=>b.bowler.name===last.bowler):null;
  let partnership=null,provided=card.part||card.partnership;if(provided&&num(provided.r??provided.runs)!=null&&num(provided.b??provided.balls)!=null)partnership={r:num(provided.r??provided.runs),b:num(provided.b??provided.balls)};
  if(!partnership&&rows.length){let wi=rows.findLastIndex(b=>b.wicket),since=rows.slice(wi+1),expected=wi<0?0:rows[wi].over*bpo+rows[wi].ball-1+(!rows[wi].wide&&!rows[wi].noball?1:0),complete=true;for(const b of since){if(b.over*bpo+b.ball-1!==expected){complete=false;break}if(!b.wide&&!b.noball)expected++}if(complete)partnership={r:since.reduce((s,b)=>s+b.runs,0),b:since.filter(b=>!b.wide&&!b.noball).length}}
  return {m,index,card,r,w,o,used,bpo,maxBalls,unlimited,rows,last,overRows,previous,over,legal,target,left,need,rrr,crr,active,lastWicket,bowling,bowler,partnership,name:score.inning||card.inning||m.teams?.[index-1]?.name||m.teams?.[index-1]||'Batting team',started:!!m.started,done:!!m.ended,break:!!m.brk};
 }
 return {model};
}
if(typeof module!=='undefined')module.exports={createSHLiveView};
