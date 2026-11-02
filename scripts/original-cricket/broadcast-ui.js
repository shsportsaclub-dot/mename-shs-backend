function createCricketBroadcastUI({document,panel,banner,ticker,canOpen,getRoster}){
 let context=null,summary=null,currentView=null,lastBanner=null;const played=new Map();
 const node=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(className)e.className=className;return e;};
 const headline=node('strong','','eventTitle'),sub=node('span','','eventSubtitle'),score=node('b','','eventScore');banner.replaceChildren();banner.append(headline);banner.append(sub);banner.append(score);for(let i=0;i<10;i++){const p=node('i','','eventSpark');p.style.cssText='--i:'+i;banner.append(p);}
 const overs=(balls,bpo)=>Math.floor(balls/bpo)+'.'+balls%bpo;
 const tick=text=>{ticker.textContent=text+'     •     '+text;ticker.style.animation=text.length>45?'cricketTicker 24s linear infinite':'none';};
 const table=(headers,rows)=>{const wrap=node('div',undefined,'scoreTableWrap'),t=node('table'),head=node('thead'),tr=node('tr');for(const h of headers)tr.append(node('th',h));head.append(tr);t.append(head);const body=node('tbody');for(const row of rows){const r=node('tr');for(const value of row)r.append(node('td',value));body.append(r);}t.append(body);wrap.append(t);return wrap;};
 function renderPanel(kind){
  if(!canOpen())return {accepted:false};currentView=kind;panel.replaceChildren();panel.append(node('strong',kind==='scorecard'?'LATEST SCORER SCORECARD':kind==='highlights'?'CONFIRMED MATCH HIGHLIGHTS':'THIS INNINGS · RECORDS & ACHIEVEMENTS'));
  const close=node('button','CLOSE');close.onclick=()=>{panel.style.display='none';currentView=null;};panel.append(close);
  const nav=node('div',undefined,'broadcastNav');for(const [name,label]of [['highlights','HIGHLIGHTS'],['scorecard','SCORECARD'],['records','ACHIEVEMENTS']]){const b=node('button',label);b.onclick=()=>renderPanel(name);nav.append(b);}panel.append(nav);
  if(!summary){panel.append(node('p','Waiting for saved deliveries.'));panel.style.display='block';return {accepted:true};}
  panel.append(node('p',`Innings ${summary.inning} · ${summary.score.runs} / ${summary.score.wickets} · ${overs(summary.score.legalBalls,summary.bpo)} overs`));
  if(kind==='scorecard'){
   panel.append(table(['BATTER','RUNS','BALLS','4s','6s','STATUS'],summary.batters.map(b=>[b.name,b.runs,b.balls,b.fours,b.sixes,b.status])));
   panel.append(table(['BOWLER','OVERS','RUNS','WICKETS'],summary.bowlers.map(b=>[b.name,overs(b.balls,summary.bpo),b.runs,b.wickets])));
   const batTotal=summary.batters.reduce((n,b)=>n+b.runs,0);panel.append(node('p','Extras / adjustments: '+Math.max(0,summary.score.runs-batTotal)));
  }else if(kind==='highlights'){
   if(!summary.highlights.length)panel.append(node('p','No boundary, wicket or milestone recorded yet.'));
   for(const h of summary.highlights.slice().reverse()){const card=node('article',undefined,'highlightCard '+h.kind.toLowerCase());card.append(node('b',h.kind));card.append(node('span',h.text));card.append(node('small',`${h.score.runs} / ${h.score.wickets} · ${overs(h.score.legalBalls,summary.bpo)} ov`));for(const m of h.milestones)card.append(node('small',m));panel.append(card);}
  }else{
   const top=summary.batters.slice().sort((a,b)=>b.runs-a.runs)[0],best=summary.bowlers.slice().sort((a,b)=>b.wickets-a.wickets||a.runs-b.runs)[0];
   if(top)panel.append(node('p',`Top score this innings: ${top.name} · ${top.runs} (${top.balls})`));
   if(best)panel.append(node('p',`Best bowling this innings: ${best.name} · ${best.wickets} / ${best.runs}`));
   panel.append(node('p',`Boundaries recorded: ${summary.batters.reduce((n,b)=>n+b.fours,0)} fours · ${summary.batters.reduce((n,b)=>n+b.sixes,0)} sixes`));
   for(const a of summary.achievements)panel.append(node('article',a.text,'highlightCard milestone'));
   if(!summary.achievements.length)panel.append(node('p','No 50-run or 3/5/10-wicket milestone recorded yet.'));
  }
  panel.style.display='block';return {accepted:true};
 }
 return {setContext(c){context=c;summary=c.broadcast||summary;if(currentView&&panel.style.display==='block')renderPanel(currentView);},baseline(s,c){context=c;played.clear();summary=c.broadcast||matchBroadcastSummary([],c,s);banner.style.display='none';lastBanner=null;const recent=summary.highlights.slice(-3).map(h=>h.text).join(' • ');tick(recent||`Score synced · ${s.runs} / ${s.wickets} · waiting for the next saved ball`);if(currentView&&panel.style.display==='block')renderPanel(currentView);},result(e){played.set(e.eventId,{event:e,supported:true});if(!context?.broadcast)summary=matchBroadcastSummary([...played.values()],{roster:getRoster(),bpo:context?.bpo||6,inning:context?.inning||1},e.score);const b=cricketBanner(e,summary);headline.textContent=b.title;sub.textContent=b.subtitle;score.textContent=b.score;banner.className='eventBanner '+b.kind;if(lastBanner!==e.eventId){banner.style.animation='none';void banner.offsetWidth;banner.style.animation='';lastBanner=e.eventId;}tick(`${b.title} · ${e.commentary||''} · ${b.score}`);},visibility(show){banner.style.display=show?'flex':'none';},newBall(){banner.style.display='none';panel.style.display='none';currentView=null;},show:renderPanel,reset(){played.clear();summary=null;context=null;banner.style.display='none';currentView=null;tick('Ready · waiting for a confirmed ball event');}};
}
