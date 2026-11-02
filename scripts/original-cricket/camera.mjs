// Original broadcast camera director. Time is the delivery playback clock,
// so seeking, slow devices and commentary delays cannot desync camera cuts.
const camAdd=(a,b)=>a.map((v,i)=>v+b[i]);
const camMix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
const camClamp=u=>Math.max(0,Math.min(1,u));
export function cricketCamera({mode='auto',time=0,active=false,event={},resolve=5.5,flight=2.8,batter=[-10,0,0],runner=[9,0,0],bowler=[20,0,0],ball=[0,1,0],fieldStart=[20,0,20],fieldEnd=[20,0,20]}){
 const shot=(name,eye,target,fov=.75)=>({name,eye,target,fov});
 const portrait=(name,p,side=1)=>shot(name,camAdd(p,[2.1,1.1,side*1.3]),camAdd(p,[0,1.30,0]),.58);
 if(mode==='wide')return shot('STADIUM',[60,52,48],[0,0,0]);
 if(mode==='face')return portrait('PLAYER',batter);
 const handed=event.hand==='LEFT'?-1:1;
 if(!active){const phase=Math.floor(time/5)%3,u=(time%5)/5;if(phase===0)return portrait('BATTER READY',camAdd(batter,[0,0,Math.sin(u*Math.PI)*.25]),handed);if(phase===1)return portrait('BOWLER READY',bowler,-1);return shot('GROUND OVERVIEW',camMix([83,37,64],[78,34,69],u),[0,0,0],.8);}
 if(time<.7)return portrait('BOWLER CLOSE-UP',bowler,-1);
 if(time<2.35)return shot('BOWLING END',[33,4.8,6.5*handed],[-7,.85,0],.63);
 if(time<2.9)return shot('BATTING CONTACT',camAdd(batter,[2.8,1.9,4.8*handed]),camAdd(batter,[.8,1,0]),.85);
 if(time<resolve){
  const fieldTime=time-2.7,atBall=fieldTime>=flight-.55;
  if(event.boundary==='NONE'&&atBall&&['CAUGHT','RUN_OUT','STUMPED'].includes(event.wicketType))return shot('WICKET ACTION',camAdd(fieldEnd,[5,3.1,7*handed]),camAdd(fieldEnd,[0,1,0]),.85);
  if(event.runsTaken&&fieldTime>=flight)return shot('RUNNING BETWEEN WICKETS',[0,15,26],camMix(batter,runner,.5),.9);
  if(event.boundary==='NONE'&&atBall&&!['BOWLED','LBW'].includes(event.wicketType)){
   const p=camMix(fieldStart,fieldEnd,camClamp(fieldTime/flight));return shot('FIELDING',camAdd(p,[7,4,8*handed]),camAdd(ball,[0,.5,0]),.9);
  }
  const a=(event.angle||0)*Math.PI/180;
  const u=camClamp((time-2.9)/.40),blend=u*u*(3-2*u),eye=camAdd(ball,[-Math.cos(a)*13,event.lofted?6:4,-Math.sin(a)*13+8*handed]);return shot(event.lofted?'AERIAL BALL FOLLOW':'BALL FOLLOW',camMix(camAdd(batter,[2.8,1.9,4.8*handed]),eye,blend),camMix(camAdd(batter,[.8,1,0]),ball,blend),.85+.05*blend);
 }
 const resultTime=time-resolve;
 if(event.wicketType&&event.wicketType!=='NONE'){
  if(resultTime<.8)return shot('UMPIRE',[15.8,2.1,5.5],[12,1.15,1.8],.67);
  return portrait('DISMISSED BATTER',event.dismissedPlayer===event.players?.nonStriker?runner:batter,handed);
 }
 if(event.boundary&&event.boundary!=='NONE'&&resultTime<.8)return shot('CROWD REACTION',[58,10,44],[76,5,62],.85);
 if(event.outcome==='DOT')return portrait('BOWLER REACTION',bowler,-1);
 return portrait('BATTER REACTION',batter,handed);
}

// Explicit diagnostic views, all rendered from one original demonstration delivery.
export function cricketStudyCamera(index,{batter,bowler,fieldEnd}){const close=(name,p,offset,target=[0,1,0],fov=.65)=>({name,eye:camAdd(p,offset),target:camAdd(p,target),fov});if(index<2)return close(index===0?'01 RUN-UP':'02 RELEASE',bowler,[-4,1.65,5.1],[0,1.05,0],.68);if(index<5)return close(['','','03 FOOTWORK','04 CONTACT','05 FOLLOW-THROUGH'][index],batter,[3.1,1.45,4.7],[.30,1.0,0],.60);return close('06 FIELDING',fieldEnd,[4.4,1.65,5.4],[0,.78,0],.62);}
