import {SHOTS,battingMotion} from './batting-handedness.mjs';
// Explicit, side-aware motion targets. Angles are preliminary design targets in degrees,
// not measurements from the supplied FBX clips or verified coaching biomechanics.
const families={
 defence:[8,15,12,0],straight_drive:[38,35,40,5],cover_drive:[44,42,52,30],on_drive:[40,40,45,-25],off_drive:[38,38,42,20],square_drive:[42,42,55,55],backfoot_drive:[35,22,40,25],pull:[75,65,95,-75],hook:[85,70,110,-95],square_cut:[62,45,80,80],late_cut:[35,20,65,110],upper_cut:[70,48,100,95],flick:[40,55,70,-50],leg_glance:[25,25,45,-90],sweep:[65,75,100,-85],reverse_sweep:[70,80,105,85],slog_sweep:[85,90,130,-80],helicopter:[90,80,160,-45],scoop:[60,70,110,-115],ramp:[55,45,100,110],lofted_drive:[70,65,110,10]
};
export function shotKinematics(shot,handedness='RHB'){
 const stance=battingMotion(shot,handedness), [shoulderTurn,hipTurn,followThrough,aim]=families[shot]||[];
 if(shoulderTurn===undefined)throw Error('Missing shot motion specification: '+shot);
 const sign=handedness==='RHB'?1:-1;
 return {...stance, motionTargets:{shoulderTurnDegrees:shoulderTurn*sign,hipTurnDegrees:hipTurn*sign,followThroughDegrees:followThrough*sign,aimDegrees:aim*sign},
 phases:[{name:'stance',t:0},{name:'load',t:.16},{name:'footwork',t:.32},{name:'downswing',t:.48},{name:'contact',t:.56},{name:'follow_through',t:.78},{name:'recover',t:1}],
 note:'Kinematic targets only. No cricket shot FBX generated or verified.'};
}
export function validateShotCatalog(){return SHOTS.every(s=>!!families[s]);}
