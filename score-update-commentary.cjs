/* SH score-update commentary. Observations are not a delivery-by-delivery feed. */
function createSHCommentaryEngine(options={}){
 const clock=options.now||(()=>Date.now()),storage=options.storage,key='sh-score-commentary-v1';
 const clean=(v,n=160)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').slice(0,n),num=v=>v==null||v===''?null:Number.isFinite(Number(v))?Number(v):null;
 const balls=o=>{const m=/^(\d+)(?:\.([0-5]))?$/.exec(String(o??''));return m?Number(m[1])*6+Number(m[2]||0):null};
 let records={};try{const j=JSON.parse(storage?.getItem(key)||'{}');if(j&&typeof j==='object'&&!Array.isArray(j))records=j}catch{}
 const trim=()=>{records=Object.fromEntries(Object.entries(records).filter(([id,r])=>id.length<=120&&r&&Array.isArray(r.entries)&&r.last&&typeof r.last.inning==='string'&&Array.isArray(r.last.batters)&&Array.isArray(r.last.bowlers)&&Number.isFinite(r.at)&&clock()-r.at<7*864e5).sort((a,b)=>b[1].at-a[1].at).slice(0,20))};
 const save=()=>{trim();try{storage?.setItem(key,JSON.stringify(records))}catch{}};
 const players=(list,kind)=>(Array.isArray(list)?list:[]).slice(0,30).map(p=>({id:clean(p.id||p.name),name:clean(p.name),r:num(p.r),b:num(p.b),w:num(p.w),o:p.o==null?'':clean(p.o,20),fours:num(p.fours),sixes:num(p.sixes),status:kind==='bat'?clean(p.status,180):'',active:p.active===true})).filter(p=>p.name).sort((a,b)=>a.id.localeCompare(b.id));
 function normalize(x){
  if(!x||!x.matchId||['__proto__','constructor','prototype'].includes(String(x.matchId))||!x.inning||num(x.r)==null||num(x.w)==null||num(x.r)<0||num(x.w)<0)return null;
  return {matchId:clean(x.matchId,120),inning:clean(x.inning),team:clean(x.team||x.inning),r:num(x.r),w:num(x.w),o:x.o==null?'':clean(x.o,20),balls:x.standardOvers===false?null:balls(x.o),batters:players(x.batters,'bat'),bowlers:players(x.bowlers,'bowl'),bowler:clean(x.bowler),ended:x.ended===true,result:clean(x.result,300)};
 }
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const score=s=>s.team+' '+s.r+'/'+s.w+(s.o?' ('+s.o+' ov)':'');
 const batter=p=>p.name+(p.r==null?'':' '+p.r)+(p.b==null?'':' ('+p.b+')');
 function observe(input){
  const s=normalize(input);if(!s)return null;trim();const prior=records[s.matchId],old=prior?.last,changedInning=old&&old.inning.toLowerCase()!==s.inning.toLowerCase();
  if(old&&same(old,s)){if(!Array.isArray(prior.points)||!prior.points.length){prior.points=[{at:clock(),inning:s.inning,team:s.team,r:s.r,w:s.w,o:s.o,balls:s.balls,correction:false}];save()}return null;}
  let text='',kind='update';
  if(!old||changedInning){kind='summary';text=(changedInning?'New innings observed. ':'')+score(s)+'.';const active=s.batters.filter(p=>p.active);if(active.length)text+=' At the crease: '+active.map(batter).join('; ')+'.';if(s.bowler)text+=' Bowler: '+s.bowler+'.';else if(s.bowlers.length)text+=' Bowling figures: '+s.bowlers.map(p=>p.name+' '+(p.w??'—')+'/'+(p.r??'—')+(p.o?' ('+p.o+' ov)':'')).join('; ')+'.';}
  else {
   const dr=s.r-old.r,dw=s.w-old.w,db=s.balls!=null&&old.balls!=null?s.balls-old.balls:null;
   const correction=dr<0||dw<0||db!=null&&db<0;
   if(correction){kind='correction';text='Score correction: '+score(old)+' → '+score(s)+'.';}
   else {
    const parts=[];
    if(dr||dw||db>0)parts.push(score(s)+'. '+dr+' run'+(dr===1?'':'s')+' added since the previous update'+(db>0?' across '+db+' legal ball'+(db===1?'':'s'):'')+'.');
    if(dw>0){kind='wicket-update';parts.push(dw+' wicket'+(dw===1?'':'s')+' added since the previous update.');}
    for(const p of s.batters){const q=old.batters.find(q=>q.id===p.id);if(!q){if(p.active)parts.push('Scorecard now lists '+batter(p)+' at the crease.');continue;}
     if(p.r!=null&&q.r!=null&&p.r>q.r)parts.push(p.name+' adds '+(p.r-q.r)+' run'+(p.r-q.r===1?'':'s')+'; now '+batter(p)+'.');
     if(p.fours!=null&&q.fours!=null&&p.fours>q.fours)parts.push(p.name+': '+(p.fours-q.fours)+' additional four'+(p.fours-q.fours===1?'':'s')+' recorded.');
     if(p.sixes!=null&&q.sixes!=null&&p.sixes>q.sixes)parts.push(p.name+': '+(p.sixes-q.sixes)+' additional six'+(p.sixes-q.sixes===1?'':'es')+' recorded.');
     if(p.status&&p.status!==q.status&&!p.active)parts.push(p.name+' — scorecard status: '+p.status+'.');
    }
    for(const p of s.bowlers){const q=old.bowlers.find(q=>q.id===p.id);if(q&&(p.r!==q.r||p.w!==q.w||p.o!==q.o))parts.push('Bowling update: '+p.name+' '+(p.w??'—')+'/'+(p.r??'—')+(p.o?' ('+p.o+' ov)':'')+'.');}
    text=parts.join(' ');
   }
  }
  if(s.ended&&(!old?.ended||old.result!==s.result)&&s.result)text+=(text?' ':'')+'Match result: '+s.result+'.';
  const at=clock(),entries=Array.isArray(prior?.entries)?prior.entries.slice(-119):[];let entry=null;
  const points=Array.isArray(prior?.points)?prior.points.slice(-359):[],last=points[points.length-1];
  if(!last||last.inning!==s.inning||last.r!==s.r||last.w!==s.w||last.o!==s.o)points.push({at,inning:s.inning,team:s.team,r:s.r,w:s.w,o:s.o,balls:s.balls,correction:kind==='correction'});
  if(text){entry={at,inning:s.inning,kind,text:clean(text,2000),source:'SH score-update commentary'};entries.push(entry)}
  records[s.matchId]={at,last:s,entries,points};save();return entry;
 }
 function entries(matchId){trim();return (records[clean(matchId,120)]?.entries||[]).filter(e=>e&&typeof e.text==='string'&&Number.isFinite(e.at)).map(e=>({...e,text:clean(e.text,2000),inning:clean(e.inning),kind:clean(e.kind,30)}));}
 function points(matchId){trim();return (records[clean(matchId,120)]?.points||[]).filter(p=>p&&Number.isFinite(p.at)&&Number.isFinite(p.r)&&Number.isFinite(p.w)&&typeof p.inning==='string').map(p=>({...p,inning:clean(p.inning),team:clean(p.team)}))}
 return {observe,entries,points};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createSHCommentaryEngine};
