// Scoring Heroes reusable event-to-FBX motion mapping.
// This is an integration adapter; it does not synthesize unavailable cricket motions.
export const motions = Object.freeze(['idle_twist','walk','run']);
export function motionForEvent(event={}) {
  const type=String(event.eventType||event.type||'').toUpperCase();
  const commentary=String(event.commentary||'').toLowerCase();
  if (/RUN|SPRINT|CHASE|BETWEEN_WICKETS/.test(type)||/\b(run|running|sprint|chase)\b/.test(commentary)) return 'run';
  if (/WALK|PLAYER_ENTRY|EXIT/.test(type)||/\b(walk|walking|enters)\b/.test(commentary)) return 'walk';
  return 'idle_twist';
}
export function bindMatchMotion(playMotion,target=window) {
  const handler=e=>playMotion(motionForEvent(e.detail||e));
  target.addEventListener('sh:match-event',handler);
  return ()=>target.removeEventListener('sh:match-event',handler);
}
