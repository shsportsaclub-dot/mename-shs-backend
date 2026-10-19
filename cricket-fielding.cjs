// ICC Men's ODI/T20I Playing Conditions, effective October 2026, clause 28.7.
function createSHCricketFielding(){
 const t20={5:9,6:11,7:13,8:14,9:16,10:18,11:20,12:22,13:23,14:25,15:27,16:29,17:31,18:32,19:34,20:36};
 const odi=[[20,4,12,4],[21,4,13,4],[22,5,13,4],[23,5,14,4],[24,5,14,5],[25,5,15,5],[26,5,16,5],[27,6,16,5],[28,6,17,5],[29,6,17,6],[30,6,18,6],[31,6,19,6],[32,7,19,6],[33,7,20,6],[34,7,20,7],[35,7,21,7],[36,7,22,7],[37,8,22,7],[38,8,23,7],[39,8,23,8],[40,8,24,8],[41,8,25,8],[42,9,25,8],[43,9,26,8],[44,9,26,9],[45,9,27,9],[46,9,28,9],[47,10,28,9],[48,10,29,9],[49,10,29,10],[50,10,30,10]];
 function plan({profile='custom',overs=20,balls=0,slowOverRate=false}={}){
  let phases=[];
  if(profile==='icc-men-t20'&&t20[overs]!=null)phases=[{name:'Powerplay',end:t20[overs],outside:2},{name:'After powerplay',end:overs*6,outside:5}];
  if(profile==='icc-men-odi'){const row=odi.find(x=>x[0]===overs);if(row)phases=[{name:'Powerplay 1',end:row[1]*6,outside:2},{name:'Powerplay 2',end:(row[1]+row[2])*6,outside:4},{name:'Powerplay 3',end:overs*6,outside:5}]}
  if(!phases.length)return {supported:false,profile,reason:'Use the approved competition fielding conditions for this format.'};
  const phase=phases.find(x=>balls<x.end)||phases.at(-1),outside=Math.max(0,phase.outside-(slowOverRate?1:0));
  return {supported:true,profile,version:'October 2026',phases,powerplayBalls:phases[0].end,phase:phase.name,outside,slowOverRate,complete:balls>=overs*6};
 }
 return {plan};
}
if(typeof module!=='undefined')module.exports={createSHCricketFielding};
