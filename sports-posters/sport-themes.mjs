// Scoring Heroes: per-sport promotional poster definitions.
// Original art assets should be produced separately for each sport.
// Use sport-specific backgrounds; do not reuse cricket artwork for other sports.
export const sportPosterThemes = Object.freeze({
  cricket: {headline:'PLAY. SCORE. CONNECT. CELEBRATE.',tagline:'Every match. Every hero.',scene:'floodlit cricket stadium',action:'batter driving a cricket ball',palette:['#071426','#d4ac65','#b8402e'],equipment:'bat, ball and stumps'},
  football: {headline:'KICK. SCORE. RISE. CELEBRATE.',tagline:'Every goal. Every hero.',scene:'football arena under blue floodlights',action:'striker taking a powerful shot',palette:['#061d32','#27b8d8','#d9f7ff'],equipment:'football and goal'},
  hockey: {headline:'DRIBBLE. STRIKE. WIN. CELEBRATE.',tagline:'Every strike. Every hero.',scene:'hockey turf with dramatic sideline lights',action:'hockey player striking on turf',palette:['#082a28','#47d6a2','#f5c868'],equipment:'hockey stick and ball'},
  badminton: {headline:'SERVE. SMASH. WIN. CELEBRATE.',tagline:'Every rally. Every hero.',scene:'indoor badminton championship court',action:'player airborne for a jump smash',palette:['#1d1037','#b87bff','#f3d6ff'],equipment:'racket and shuttlecock'},
  volleyball: {headline:'SERVE. SPIKE. RISE. CELEBRATE.',tagline:'Every point. Every hero.',scene:'indoor volleyball court with arena lights',action:'attacker spiking over a net',palette:['#162a43','#ffbe45','#e8f5ff'],equipment:'volleyball and net'},
  kabaddi: {headline:'RAID. DEFEND. WIN. CELEBRATE.',tagline:'Every raid. Every hero.',scene:'kabaddi mat in packed arena',action:'raider evading two defenders',palette:['#321218','#ff684b','#ffd36c'],equipment:'kabaddi court markings'},
  basketball: {headline:'DRIBBLE. DUNK. RISE. CELEBRATE.',tagline:'Every basket. Every hero.',scene:'indoor basketball arena',action:'player performing a powerful dunk',palette:['#211222','#fa8b38','#ffd49a'],equipment:'basketball and hoop'},
  baseball: {headline:'PITCH. HIT. RUN. CELEBRATE.',tagline:'Every inning. Every hero.',scene:'night baseball diamond',action:'batter hitting a pitch',palette:['#102a37','#6ccde0','#f5f5f5'],equipment:'baseball, bat and glove'},
  rugby: {headline:'RUN. TACKLE. SCORE. CELEBRATE.',tagline:'Every try. Every hero.',scene:'rugby pitch under stadium floodlights',action:'rugby runner breaking a tackle',palette:['#20102d','#ce6df2','#f3d9fa'],equipment:'rugby ball and goalposts'}
});
export function getSportPosterTheme(sport) {
  return sportPosterThemes[String(sport || '').trim().toLowerCase()] ?? null;
}
