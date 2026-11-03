import {shotKinematics} from './shot-kinematics.mjs';

// Authoring-space joint channels (degrees and metres), NOT motion capture.
// Use a separate rig mapping before applying these channels to a Mixamo skeleton.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const PHASES=[0,.16,.32,.48,.56,.78,1];
const PHASE_NAMES=['stance','load','footwork','downswing','contact','follow_through','recover'];
export function createBattingPoseTrack(shot,handedness='RHB'){
 const k=shotKinematics(shot,handedness),s=handedness==='RHB'?1:-1;
 const {shoulderTurnDegrees:shoulderSigned,hipTurnDegrees:hipSigned,followThroughDegrees:finishSigned,aimDegrees:aimSigned}=k.motionTargets;
 const shoulder=shoulderSigned*s,hip=hipSigned*s,finish=finishSigned*s,aim=aimSigned*s;
 const lead=handedness==='RHB'?'left':'right',trail=handedness==='RHB'?'right':'left';
 const front=k.footwork==='front',low=/sweep|scoop|ramp/.test(shot),high=/hook|pull|upper_cut/.test(shot);
 const power=/helicopter|slog|lofted|hook|pull/.test(shot);
 const steps=[
  {rootYaw:0,hipsYaw:0,chestYaw:0,leadFootZ:0,trailFootZ:0,leadKnee:7,trailKnee:8,leadShoulderX:8,trailShoulderX:8,leadElbow:30,trailElbow:50,batAngle:15,headYaw:0,rootY:0},
  {rootYaw:0,hipsYaw:-hip*.25,chestYaw:-shoulder*.4,leadFootZ:0,trailFootZ:0,leadKnee:9,trailKnee:12,leadShoulderX:-15,trailShoulderX:-20,leadElbow:48,trailElbow:65,batAngle:-45,headYaw:0,rootY:0},
  {rootYaw:aim*.08,hipsYaw:-hip*.15,chestYaw:-shoulder*.3,leadFootZ:front?.35:0,trailFootZ:front?0:-.28,leadKnee:low?70:front?35:12,trailKnee:low?55:front?18:35,leadShoulderX:-12,trailShoulderX:-35,leadElbow:40,trailElbow:80,batAngle:-65,headYaw:0,rootY:low?-.28:0},
  {rootYaw:aim*.13,hipsYaw:hip*.55,chestYaw:shoulder*.55,leadFootZ:front?.35:0,trailFootZ:front?0:-.28,leadKnee:low?75:front?40:15,trailKnee:low?60:front?20:40,leadShoulderX:45,trailShoulderX:65,leadElbow:25,trailElbow:45,batAngle:10,headYaw:aim*.06,rootY:low?-.3:0},
  {rootYaw:aim*.18,hipsYaw:hip*.85,chestYaw:shoulder*.8,leadFootZ:front?.35:0,trailFootZ:front?0:-.28,leadKnee:low?80:front?42:16,trailKnee:low?62:front?22:42,leadShoulderX:high?90:low?15:65,trailShoulderX:high?95:low?25:70,leadElbow:20,trailElbow:30,batAngle:65,headYaw:aim*.08,rootY:low?-.3:0},
  {rootYaw:aim*.25,hipsYaw:hip*.8,chestYaw:shoulder,leadFootZ:front?.35:0,trailFootZ:front?0:-.28,leadKnee:low?65:front?35:14,trailKnee:low?50:front?18:35,leadShoulderX:high?130:low?45:105,trailShoulderX:high?125:low?65:110,leadElbow:power?60:40,trailElbow:power?85:55,batAngle:finish,headYaw:aim*.12,rootY:low?-.2:0},
  {rootYaw:0,hipsYaw:0,chestYaw:0,leadFootZ:0,trailFootZ:0,leadKnee:7,trailKnee:8,leadShoulderX:8,trailShoulderX:8,leadElbow:30,trailElbow:50,batAngle:15,headYaw:0,rootY:0}
 ];
 // All rotational channels are expressed in batter-local coordinates. Mirroring changes
 // yaw and swing direction; forward/back and knee bend remain positive local magnitudes.
 const yaw=['rootYaw','hipsYaw','chestYaw','headYaw','batAngle'];
 const frames=steps.map((p,i)=>({time:PHASES[i],phase:PHASE_NAMES[i],...Object.fromEntries(Object.entries(p).map(([key,value])=>[key,yaw.includes(key)?value*s:value]))}));
 return {shot,handedness,leadFoot:lead,trailFoot:trail,frames,source:'PROCEDURAL_AUTHORING_TARGETS',retargeted:false,visuallyVerified:false};
}
export function sampleBattingPose(track,time){
 const t=clamp(time,0,1),f=track.frames;
 let i=0;while(i<f.length-2&&t>f[i+1].time)i++;
 const a=f[i],b=f[i+1],u=smooth((t-a.time)/(b.time-a.time));
 const out={};for(const key of Object.keys(a)){if(key==='time'||key==='phase')continue;out[key]=lerp(a[key],b[key],u)}
 return {time:t,phase:a.phase,pose:out};
}
