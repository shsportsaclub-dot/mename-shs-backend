// SH Media Studio v1 — pure, dependency-free article and poster preparation.
// Produces drafts only. Publishing is controlled by the host backend.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt = (v,n=150) => String(v ?? '').trim().slice(0,n);
const score = s => s && Number.isFinite(Number(s.r)) && Number.isFinite(Number(s.w)) ? `${Number(s.r)}/${Number(s.w)}${s.o != null ? ' ('+txt(s.o,10)+' ov)' : ''}` : '';
const isFinal = m => m?.ended === true && /won by|match tied|drawn|no result|abandoned/i.test(String(m.status||''));
const validId = x => /^[a-z0-9-]{1,64}$/i.test(String(x||''));
export function prepareMedia(m, {language='te', photo=null}={}) {
  if (!validId(m?.id)) throw new Error('Invalid match ID');
  if (!isFinal(m)) return {ok:false,reason:'Final result not verified; do not publish'};
  const teams=(m.teams||[]).slice(0,2).map(t=>txt(typeof t==='string'?t:t?.name,75));
  if(teams.length!==2 || teams.some(x=>!x)) return {ok:false,reason:'Missing team names'};
  const innings=(m.score||[]).filter(x=>Number.isFinite(Number(x.r))&&Number.isFinite(Number(x.w))).slice(0,4);
  if(!innings.length) return {ok:false,reason:'Missing verified scorecard'};
  const result=txt(m.status,170), venue=txt(m.venue,140), competition=txt(m.name,160);
  const winner=/^(.+?) won by (\d+) (runs?|wkts?|wickets?)/i.exec(result);
  const winnerName=winner?txt(winner[1],75):'';
  const winnerVerified=teams.some(x=>x.toLowerCase()===winnerName.toLowerCase());
  const headline=winner && winnerVerified
    ? (language==='te'?`${winnerName} విజయం — ${winner[2]} ${/run/i.test(winner[3])?'పరుగుల':'వికెట్ల'} తేడాతో`:`${winnerName} win by ${winner[2]} ${winner[3]}`)
    : (language==='te'?`${teams[0]} vs ${teams[1]} — మ్యాచ్ ముగిసింది`:`${teams[0]} vs ${teams[1]} — Match completed`);
  const summary=innings.map((x,i)=>`${txt(x.inning||teams[i%2],75)}: ${score(x)}`).join(' | ');
  const paragraphs=language==='te' ? [
    `${teams[0]}, ${teams[1]} మధ్య జరిగిన మ్యాచ్ ముగిసింది. అధికారిక మ్యాచ్ స్థితి: ${result}.`,
    `స్కోర్ వివరాలు: ${summary}.`,
    venue?`వేదిక: ${venue}.`:''
  ].filter(Boolean) : [
    `The match between ${teams[0]} and ${teams[1]} has finished. Verified status: ${result}.`,
    `Scorecard: ${summary}.`,
    venue?`Venue: ${venue}.`:''
  ].filter(Boolean);
  // No invented wicket-takers, quotes, milestones, photos or highlight clips.
  const licensedPhoto = photo && photo.approved === true && photo.url && photo.license && photo.attribution
    ? {url:String(photo.url),license:txt(photo.license,80),attribution:txt(photo.attribution,250)} : null;
  const key = `sh-media-${m.id}-final`;
  return {ok:true,id:key,matchId:m.id,language,kind:'result',verified:true,headline,summary,paragraphs,
    social:{caption:`${headline}\n${summary}\n#ScoringHeroes #MatchResult`,format:'4:5',imageRequired:false},
    epaper:{title:headline,subtitle:competition,body:paragraphs,format:'A4',photo:licensedPhoto},
    photo:licensedPhoto,publication:'internal-auto-eligible',externalPublishing:'disabled-without-account-permissions',
    posterSvg:renderPoster({headline,summary,result,venue,teams})};
}
export function renderPoster({headline,summary,result,venue,teams}) {
  const line=(v,y,size=42,color='#ffffff')=>`<text x="90" y="${y}" font-family="sans-serif" font-size="${size}" font-weight="700" fill="${color}">${esc(txt(v,125))}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07152b"/><stop offset=".6" stop-color="#172b62"/><stop offset="1" stop-color="#772044"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#bg)"/><rect x="40" y="40" width="1000" height="1270" rx="36" fill="none" stroke="#d9bb77" stroke-width="4"/>${line('MATCH REPORT',165,34,'#f0c878')}${line(teams.join('  VS  '),310,45)}${line(headline,440,39,'#f0c878')}${line(summary,630,34)}${line(result,770,34)}${line(venue,930,29,'#dddddd')}${line('SCORING HEROES  •  SPORTS DESK',1180,28,'#ffffff')}</svg>`;
}
export function publishDecision(prepared, existingIds=new Set(), {autoEnabled=false}={}) {
  if (!prepared?.ok || !prepared.verified) return {publish:false,reason:'Unverified match'};
  if (!autoEnabled) return {publish:false,reason:'Auto publishing disabled'};
  if (existingIds.has(prepared.id)) return {publish:false,reason:'Already published'};
  return {publish:true,id:prepared.id,channel:'scoring-heroes-internal'};
}
