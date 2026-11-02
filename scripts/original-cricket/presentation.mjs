// Broadcast introductions use saved XI/captains/toss. No random toss or ratings.
export function cricketIntro(context,elapsed,kind='intro'){
 const teams=context?.teams;if(!Array.isArray(teams)||teams.length!==2)return null;
 const usable=teams.filter(t=>t.xi?.length);if(!usable.length)return null;
 const captains=kind==='intro'&&teams.every(t=>t.captain&&t.xi.includes(t.captain));
 const t=Math.max(0,elapsed),walkStart=captains?4:0;
 if(captains&&t<4){const winner=teams.find(team=>team.id===context.toss?.winner);return {phase:'CAPTAINS',actors:teams.map((team,i)=>({id:team.captain,p:[i?1.1:-1.1,0,0],yaw:i?-Math.PI/2:Math.PI/2,mode:'idle'})),eye:[.2,1.9,5],target:[0,1.1,0],title:teams.map(team=>team.name).join(' vs '),caption:winner?`${winner.name} won the toss and chose to ${context.toss.decision}.`:'Captains introduction · toss decision not published.'};}
 const walkTime=t-walkStart,index=Math.floor(walkTime/4);if(index>=usable.length)return null;
 const team=usable[index],progress=(walkTime%4)/4;
 const ids=team.captain?[team.captain,...team.xi.filter(id=>id!==team.captain)]:team.xi;
 return {phase:'TEAM WALKOUT',actors:ids.slice(0,11).map((id,i)=>({id,p:[i===0?0:((i%2)?-1:1)*(.8+Math.floor((i-1)/2)*.4),0,-Math.ceil(i/2)*1.1-5+progress*4],yaw:0,mode:'walk'})),eye:[4.8,2.6,6],target:[0,1,-2],title:team.name,caption:'Playing XI · '+ids.length+' players'+(team.captain?' · captain leads':'')};
}
