// Original illustrative movement. A confirmed boundary is never turned into a pickup.
export function sampleBoundaryChase({time,start,end,boundary}){
 if(boundary!=='FOUR'&&boundary!=='SIX')return null;
 const elapsed=Math.max(0,time-2.7-.18),speed=7,ramp=.30;
 // The ball may finish over the rope; the athlete stays on the playing surface.
 const radial=Math.hypot(end[0]/75,end[2]/65),scale=radial>.98?.98/radial:1;
 const target=[end[0]*scale,0,end[2]*scale],dx=target[0]-start[0],dz=target[2]-start[2],distance=Math.hypot(dx,dz);
 const travel=speed*(elapsed<ramp?elapsed*elapsed/(2*ramp):elapsed-ramp/2),u=distance>1e-9?Math.min(1,travel/distance):1;
 const moving=elapsed>0&&u<1;
 return {position:[start[0]+dx*u,0,start[2]+dz*u],yaw:distance>1e-9?Math.atan2(dx,dz):0,mode:moving?'run':'idle',localTime:elapsed,phase:moving?'BOUNDARY CHASE':elapsed>0?'ROPE HOLD':'READY'};
}
