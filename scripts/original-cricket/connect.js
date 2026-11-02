// Read-only connection to the scorer published by this same backend.
{
const params=new URLSearchParams(location.search),mid=params.get('mid');
if(mid!==null){
 document.body.classList.add('connected');
 const style=document.createElement('style');style.textContent='.connected header,.connected footer,.connected .side{display:none}.connected .layout{display:block;padding:0;max-width:none}.connected .stage{height:100vh;min-height:350px;max-height:none;border:0;border-radius:0}.feedNote{position:absolute;left:18px;top:90px;max-width:80%;background:#091b2de8;padding:8px 12px;border-radius:8px;font-size:12px;color:#c2d7e3}.feedMask{position:absolute;inset:0;background:#071725;display:grid;place-items:center;text-align:center;padding:30px;z-index:5}.connected .view{z-index:6;flex-wrap:wrap;max-width:92%}';document.head.append(style);
 const note=document.createElement('div');note.className='feedNote';note.textContent='Connecting to scorer…';stage.append(note);
 const mask=document.createElement('div');mask.className='feedMask';mask.textContent='Connecting to published match…';stage.append(mask);
 const audio=document.createElement('button');audio.textContent='ENABLE SOUND';audio.onclick=async()=>{await $('#sound').onclick();audio.textContent=$('#sound').textContent;};$('.view').append(audio);
 const voice=document.createElement('select');voice.setAttribute('aria-label','Commentary voice');for(const [value,text]of [['off','Text commentary'],['en','English voice'],['te','Telugu voice'],['hi','Hindi voice']]){voice.add(new Option(text,value));}voice.style.cssText='width:auto;font-size:10px;padding:5px';voice.onchange=()=>{$('#voice').value=voice.value;};$('.view').append(voice);
 for(const [text,action]of [['MATCH INTRO',()=>window.SHCricket.startPresentation('intro')],['TEAM WALKOUT',()=>window.SHCricket.startPresentation('walkout')],['BOWLING XI',()=>window.SHCricket.showBowlingXI()]]){const b=document.createElement('button');b.textContent=text;b.onclick=()=>{const r=action();if(r.accepted)mask.style.display='none';else note.textContent='Waiting for published XI, or current ball to finish.';};$('.view').append(b);}
 if(!/^[\w-]{3,40}$/.test(mid)){mask.textContent='Invalid match ID. Open Virtual Live from a published match.';note.textContent='No match connected.';}else{
 const viewer={applyContext:c=>{window.SHCricket.applyContext(c);if(c.currentPlayers||window.SHCricket.getState().presentation)mask.style.display='none';},syncBaseline:(score,c)=>{window.SHCricket.syncBaseline(score,c);mask.style.display=c.currentPlayers||window.SHCricket.getState().presentation?'none':'grid';mask.textContent='Score synced. Waiting for scorer to select batsmen and bowler.';},pushBall:e=>{const result=window.SHCricket.pushBall(e);mask.style.display='none';return result;},showStatus:text=>{note.textContent=text;if(mask.style.display!=='none'&&text.startsWith('Scorer connection:'))mask.textContent=text;}};
 const connection=new LiveFeedConnection({matchId:mid,viewer,subscribe:notify=>{const source=new EventSource('/api/shared-stream');source.onmessage=e=>{try{notify(JSON.parse(e.data));}catch{}};return()=>source.close();}}).start();
 window.SHLiveFeed=connection;window.addEventListener('pagehide',()=>connection.stop(),{once:true});
 }
}
}
