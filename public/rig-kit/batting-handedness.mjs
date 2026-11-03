/* Scoring Heroes: stance-aware shot planning. Kinematic intent only, not a rendered FBX clip. */
export const SHOTS = Object.freeze(['defence','straight_drive','cover_drive','on_drive','off_drive','square_drive','backfoot_drive','pull','hook','square_cut','late_cut','upper_cut','flick','leg_glance','sweep','reverse_sweep','slog_sweep','helicopter','scoop','ramp','lofted_drive']);
export function battingMotion(shot, handedness='RHB', footwork='auto') {
  if (!SHOTS.includes(shot)) throw new RangeError('Unknown shot: '+shot);
  if (!['RHB','LHB'].includes(handedness)) throw new RangeError('Use RHB or LHB');
  const right = handedness==='RHB';
  const backfoot = /backfoot|pull|hook|cut|upper/.test(shot);
  const leadFoot = right ? 'left' : 'right';
  const trailFoot = right ? 'right' : 'left';
  const selectedFootwork = footwork==='auto' ? (backfoot?'back':'front') : footwork;
  if (!['front','back','neutral'].includes(selectedFootwork)) throw new RangeError('Invalid footwork');
  return {
    shot, handedness, leadFoot, trailFoot, bottomHand:trailFoot, topHand:leadFoot,
    footwork:selectedFootwork,
    bodyTurnSign:right?1:-1,
    batSwingSign:right?1:-1,
    offSideSign:right?1:-1,
    legSideSign:right?-1:1,
    phases:['stance','weight_transfer','backswing','downswing','contact','follow_through','recovery'],
    availableFBXClip:false,
    status:'MOTION_SPEC_ONLY_REQUIRES_SHOT_ANIMATION_AND_VISUAL_TEST'
  };
}
