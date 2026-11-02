import {fitBatToHands} from './equipment.mjs';
// Original authored keys, metres/radians. These are not extracted commercial motions.
const motionMix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u),motionClamp=x=>Math.max(0,Math.min(1,x));
const motionSmooth=x=>{x=motionClamp(x);return x*x*(3-2*x);};
const motionKey=(time,hips,pelvisYaw,spineYaw,lean,feet,batGrip,batTip,leftHand=[-.24,1.05,.12],rightHand=[.24,1.05,.12])=>({time,hips,pelvisYaw,spineYaw,lean,feet,batGrip,batTip,leftHand,rightHand});
const readyFeet=[[-.105,.08,.06],[.105,.08,-.06]],driveFeet=[[-.11,.08,.40],[.11,.08,-.06]];
const batKeys=[
 motionKey(0,[0,-.035,-.02],0,-.08,.10,readyFeet,[.08,1.02,.22],[.12,.17,.42]),
 motionKey(2.15,[0,-.035,-.02],0,-.08,.10,readyFeet,[.08,1.02,.22],[.12,.17,.42]),
 motionKey(2.42,[0,-.07,.02],-.08,-.20,.18,[[-.11,.14,.18],[.11,.08,-.06]],[.12,1.20,.19],[.30,1.97,-.17]),
 motionKey(2.57,[0,-.10,.06],-.10,-.28,.23,driveFeet,[.10,1.23,.23],[.27,2.02,-.12]),
 motionKey(2.70,[0,-.10,.08],.04,.18,.25,driveFeet,[.035,1.04,.32],[.04,.20,.80]),
 motionKey(2.88,[0,-.075,.08],.14,.49,.16,driveFeet,[-.18,1.43,.34],[-.55,2.08,.18]),
 motionKey(3.25,[0,-.06,.075],.18,.61,.11,driveFeet,[-.22,1.49,.28],[-.68,2.09,.03]),
 motionKey(3.65,[0,-.045,.04],.07,.28,.12,driveFeet,[-.12,1.30,.25],[-.42,1.85,.10]),
 motionKey(4.15,[0,-.035,-.02],0,-.08,.10,readyFeet,[.08,1.02,.22],[.12,.17,.42])
];
function interpolateMotion(keys,time){let a=keys[0],b=a;for(let i=1;i<keys.length;i++){b=keys[i];if(time<=b.time)break;a=b;}const u=a===b?0:motionSmooth((time-a.time)/(b.time-a.time));const m={};for(const k of ['hips','batGrip','batTip','leftHand','rightHand'])m[k]=motionMix(a[k],b[k],u);for(const k of ['pelvisYaw','spineYaw','lean'])m[k]=a[k]+(b[k]-a[k])*u;m.feet=a.feet.map((p,i)=>motionMix(p,b.feet[i],u));return m;}
export function sampleCricketMotion(mode,time=0,hand='RIGHT'){
 if(!Number.isFinite(time))time=0;
 let m;
 if(mode==='bat'||mode==='shot')m=interpolateMotion(batKeys,mode==='shot'?time+2.35:time);
 else{
  m=interpolateMotion(batKeys,0);m.hips=[0,0,0];m.pelvisYaw=0;m.spineYaw=0;m.lean=.025;
  if(mode==='hero'){m.batGrip=[-.16,1.03,.30];m.batTip=[.68,1.12,.30];}
  else if(mode==='bowl'){
   const plant=[[-.11,.08,.30],[.11,.13,-.24]];
   const runTime=Math.min(time,1.3);
   const runPose=()=>{const s=Math.sin(runTime*11),lift=Math.max(0,s),liftR=Math.max(0,-s);m.hips=[0,Math.abs(s)*.025,0];m.lean=.13;m.spineYaw=Math.sin(time*11)*.10;m.feet=[[-.10,.08+lift*.16,-s*.34],[.10,.08+liftR*.16,s*.34]];m.leftHand=[-.24,1.09+s*.18,s*.24];m.rightHand=[.24,1.09-s*.18,-s*.24];return m;};
   if(time<1.3)m=runPose();
   else m=interpolateMotion([
    {...runPose(),time:1.3},
    motionKey(1.55,[0,.05,0],-.10,-.16,-.04,[[-.10,.19,.18],[.10,.35,-.20]],m.batGrip,m.batTip,[-.20,1.62,.24],[.22,1.67,-.36]),
    motionKey(1.82,[0,-.04,.025],-.12,-.20,.02,plant,m.batGrip,m.batTip,[-.18,1.60,.25],[.23,1.95,-.16]),
    motionKey(2,[0,-.025,.04],.04,.24,.13,plant,m.batGrip,m.batTip,[-.22,1.05,.30],[.22,2.02,.08]),
    motionKey(2.30,[0,-.07,.13],.15,.46,.38,plant,m.batGrip,m.batTip,[-.26,1.04,.22],[.20,1.02,.63]),
    motionKey(2.65,[0,0,.18],.12,.18,.14,[[-.11,.08,.30],[.11,.08,.56]],m.batGrip,m.batTip,[-.23,1.04,.12],[.24,.97,.28]),
    motionKey(3.0,[0,0,0],0,0,.025,readyFeet,m.batGrip,m.batTip)
   ],time);
  }else if(mode==='pickup'||mode==='field'||mode==='keeper'){
   const u=mode==='keeper'?.72:motionSmooth(Math.min(time,.7)/.7);m.hips=[0,-.27*u,.035*u];m.lean=.03+.56*u;m.feet=[[-.19,.08,.17],[.19,.08,-.07]];m.leftHand=[-.10,1.05-.77*u,.35+.08*u];m.rightHand=[.10,1.05-.77*u,.35+.08*u];
  }else if(mode==='catch'){m.hips=[0,-.06,0];m.lean=.08;m.leftHand=[-.12,1.75,.35];m.rightHand=[.12,1.75,.35];}
  else if(mode==='run'||mode==='walk'){
   const walk=mode==='walk',s=Math.sin(time*(walk?6:10));m.lean=walk?.06:.18;m.spineYaw=s*.10;m.hips=[0,Math.abs(s)*(walk?.015:.035),0];m.feet=[[-.1,.08+Math.max(0,s)*(walk?.06:.15),-s*(walk?.18:.36)],[.1,.08+Math.max(0,-s)*(walk?.06:.15),s*(walk?.18:.36)]];m.leftHand=[-.24,1.12+s*.16,s*.23];m.rightHand=[.24,1.12-s*.16,-s*.23];
  }else if(mode==='out'){m.hips=[0,-.025,0];m.lean=.15;m.leftHand=[-.22,1.06,.15];m.rightHand=[.22,1.06,.15];}
 }
 if(hand==='LEFT'){
  for(const k of ['hips','batGrip','batTip'])m[k][0]*=-1;m.pelvisYaw*=-1;m.spineYaw*=-1;
  m.feet=[m.feet[1].slice(),m.feet[0].slice()];m.feet.forEach(p=>p[0]*=-1);
 }
 m.phase=mode==='bat'||mode==='shot'?(time<2.42?'READY':time<2.57?'FOOTWORK':time<2.70?'BACKLIFT':time<2.82?'CONTACT':time<3.65?'FOLLOW-THROUGH':'RECOVERY'):mode==='bowl'?(time<1.55?'RUN-UP':time<1.95?'FRONT-FOOT PLANT':time<2.08?'RELEASE':'BOWLING FOLLOW-THROUGH'):mode==='pickup'||mode==='field'?'FIELDING':mode.toUpperCase();return m;
}
export function cricketBodyPoint(p,m){
 const w=motionSmooth((p[1]-.90)/.61),yaw=m.pelvisYaw+m.spineYaw*w,lean=m.lean*(.22+.78*w),x=p[0],y=p[1]-.90,z=p[2],a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);
 return [a+m.hips[0],.90+y*Math.cos(lean)-b*Math.sin(lean)+m.hips[1],y*Math.sin(lean)+b*Math.cos(lean)+m.hips[2]];
}
export function cricketBodyVector(v,m,height=1.53){const w=motionSmooth((height-.90)/.61),yaw=m.pelvisYaw+m.spineYaw*w,lean=m.lean*(.22+.78*w),x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);return [x,v[1]*Math.cos(lean)-z*Math.sin(lean),v[1]*Math.sin(lean)+z*Math.cos(lean)];}
export function cricketArmAnchors(m){return [[-.205,1.43,0],[.205,1.43,0]].map(p=>cricketBodyPoint(p,m));}
export function cricketMotionBat(m,height=1.85,hand='RIGHT'){return fitBatToHands({grip:cricketBodyPoint(m.batGrip,m),tip:cricketBodyPoint(m.batTip,m),height,hand,shoulders:cricketArmAnchors(m)});}
