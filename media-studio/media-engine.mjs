import {performanceInsights, playerPhotoSearch} from './player-media.mjs';
// SH Media Studio v1 — pure, dependency-free article and poster preparation.
// Produces drafts only. Publishing is controlled by the host backend.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt = (v,n=150) => String(v ?? '').trim().slice(0,n);
const score = s => s && Number.isFinite(Number(s.r)) && Number.isFinite(Number(s.w)) ? `${Number(s.r)}/${Number(s.w)}${s.o != null ? ' ('+txt(s.o,10)+' ov)' : ''}` : '';
export const normalizeLanguage = v => ['en','te','hi'].includes(String(v||'').toLowerCase().split('-')[0]) ? String(v).toLowerCase().split('-')[0] : 'en';
const isFinal = m => m?.ended === true && /won by|match tied|drawn|no result|abandoned/i.test(String(m.status||''));
const validId = x => /^[a-z0-9-]{1,64}$/i.test(String(x||''));
export function prepareMedia(m, {language='en', photo=null}={}) {
  language=normalizeLanguage(language);
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
  const hindi=language==='hi';
  const headline=winner && winnerVerified
    ? (language==='te'?`${winnerName} విజయం — ${winner[2]} ${/run/i.test(winner[3])?'పరుగుల':'వికెట్ల'} తేడాతో`:`${winnerName} win by ${winner[2]} ${winner[3]}`)
    : (language==='te'?`${teams[0]} vs ${teams[1]} — మ్యాచ్ ముగిసింది`:`${teams[0]} vs ${teams[1]} — Match completed`);
  const normalized=innings.map((x,i)=>({name:txt(x.inning||teams[i%2],75).replace(/,.*?(?= Inning)/i,''),runs:Number(x.r),wickets:Number(x.w),overs:txt(x.o,12)}));
  // Reject ambiguous or misattributed innings instead of publishing a false scorecard.
  const canonical = value => String(value||'').toLowerCase().replace(/\\s+inning\\s*\\d+.*$/i,'').replace(/[^a-z0-9]/g,'');
  const teamKeys=teams.map(canonical);
  if(normalized.length>=2){
    const inningsTeams=normalized.slice(0,2).map(x=>canonical(x.name));
    if(inningsTeams.some(x=>!teamKeys.includes(x)) || inningsTeams[0]===inningsTeams[1])
      return {ok:false,reason:'Scorecard innings team mismatch; manual source verification required'};
  }
  const summary=normalized.map(x=>`${x.name}: ${x.runs}/${x.wickets}${x.overs?' ('+x.overs+' ov)':''}`).join(' | ');
  const a=normalized[0],b=normalized[1];
  const chasing=b&&a&&b.runs>a.runs;
  const margin=winnerVerified&&winner?Number(winner[2]):null;
  const analysis=[];
  if(a&&b){
    if(language==='te'){
      analysis.push(`మొదట బ్యాటింగ్ చేసిన ${a.name} ${a.overs||'నమోదైన'} ఓవర్లలో ${a.runs} పరుగులకు ${a.wickets} వికెట్లు కోల్పోయింది. తరువాత ${b.name} ${b.overs||'నమోదైన'} ఓవర్లలో ${b.runs} పరుగులు చేసి ${b.wickets} వికెట్లు కోల్పోయింది.`);
      if(chasing&&winnerVerified&&/wkt/i.test(winner[3]))analysis.push(`${b.name} లక్ష్యాన్ని ఛేదించి ${margin} వికెట్ల తేడాతో గెలిచింది. లక్ష్యానికి అవసరమైన పరుగులు ${a.runs+1}; నమోదైన రెండో ఇన్నింగ్స్ స్కోరు ${b.runs}/${b.wickets}.`);
      else if(!chasing&&winnerVerified&&/run/i.test(winner[3]))analysis.push(`${a.name} ప్రత్యర్థిని ${b.runs} పరుగులకే పరిమితం చేసి ${margin} పరుగుల తేడాతో విజయం సాధించింది.`);
    }else if(hindi){
      analysis.push(`पहले दर्ज पारी में ${a.name} ने ${a.overs||'दर्ज'} ओवर में ${a.runs}/${a.wickets} बनाए। अगली पारी में ${b.name} ने ${b.overs||'दर्ज'} ओवर में ${b.runs}/${b.wickets} बनाए।`);
      if(chasing&&winnerVerified&&/wkt/i.test(winner[3]))analysis.push(`${b.name} ने ${a.runs+1} रन का लक्ष्य हासिल कर ${margin} विकेट से जीत दर्ज की।`);
      else if(!chasing&&winnerVerified&&/run/i.test(winner[3]))analysis.push(`${a.name} ने विपक्ष को ${b.runs} रन पर रोककर ${margin} रन से जीत दर्ज की।`);
    }else{
      analysis.push(`In the first recorded innings, ${a.name} posted ${a.runs}/${a.wickets}${a.overs?' in '+a.overs+' overs':''}. ${b.name} replied with ${b.runs}/${b.wickets}${b.overs?' in '+b.overs+' overs':''}.`);
      if(chasing&&winnerVerified&&/wkt/i.test(winner[3]))analysis.push(`Chasing a target of ${a.runs+1}, ${b.name} reached ${b.runs}/${b.wickets} to secure a ${margin}-wicket victory.`);
      else if(!chasing&&winnerVerified&&/run/i.test(winner[3]))analysis.push(`${a.name} defended its total, restricting ${b.name} to ${b.runs} and winning by ${margin} runs.`);
    }
  }
  // Derived strictly from recorded innings; no invented player contributions.
  if(a&&b){
    const balls=o=>{const m=/^(\d+)(?:\.(\d))?$/.exec(String(o||''));return m?Number(m[1])*6+Number(m[2]||0):0};
    const first=balls(a.overs),second=balls(b.overs);
    if(first&&second){
      const r1=(a.runs*6/first).toFixed(2),r2=(b.runs*6/second).toFixed(2);
      analysis.push(language==='te'
        ? 'రెండు ఇన్నింగ్స్‌ల రన్‌రేట్లు వరుసగా '+r1+', '+r2+' పరుగులు/ఓవర్.'
        : language==='hi'
        ? 'दोनों पारियों की रन गति क्रमशः '+r1+' और '+r2+' रन प्रति ओवर रही।'
        : 'The recorded run rates were '+r1+' and '+r2+' runs per over respectively.');
    }
    if(/rain|reduced/i.test(result)) analysis.push(language==='te'?'అధికారిక ఫలితంలో వర్షం వల్ల ఓవర్లు తగ్గినట్లు పేర్కొన్నారు.':language==='hi'?'आधिकारिक परिणाम में बारिश से ओवर घटने का उल्लेख है।':'The official result notes a rain-related reduction in overs.');
  }
  const playerPerformance=performanceInsights(m.scorecard || m.playerScorecard || {});
  const photoSearches=playerPerformance.batters.slice(0,2).concat(playerPerformance.bowlers.slice(0,2)).filter((p,i,a)=>a.findIndex(q=>q.name===p.name&&q.team===p.team)===i).map(p=>playerPhotoSearch(p.name,p.team));
  const paragraphs=language==='te' ? [
    `${teams[0]}, ${teams[1]} మధ్య మ్యాచ్ ముగిసింది. ఫలితం: ${result}.`,...analysis,
    `పూర్తి స్కోరు: ${summary}.`,venue?`వేదిక: ${venue}.`:''
  ].filter(Boolean) : hindi ? [
    `${teams[0]} और ${teams[1]} का मैच समाप्त हुआ। परिणाम: ${result}।`,...analysis,
    `स्कोरकार्ड: ${summary}।`,venue?`स्थान: ${venue}।`:''
  ].filter(Boolean) : [
    `${teams[0]} and ${teams[1]} completed their match. Result: ${result}.`,...analysis,
    `Full recorded score: ${summary}.`,venue?`Venue: ${venue}.`:''
  ].filter(Boolean);
  if(playerPerformance.hasPlayerData) paragraphs.splice(Math.min(2,paragraphs.length),0,...playerPerformance.paragraphs);
  // No invented wicket-takers, quotes, milestones, photos or highlight clips.
  const licensedPhoto = photo && photo.approved === true && photo.url && photo.license && photo.attribution
    ? {url:String(photo.url),license:txt(photo.license,80),attribution:txt(photo.attribution,250)} : null;
  const key = `sh-media-${m.id}-final`;
  return {ok:true,id:key,matchId:m.id,language,kind:'result',verified:true,headline,summary,paragraphs,
    social:{caption:`${headline}\n${summary}\n${analysis[0]||''}\n#ScoringHeroes #MatchResult`,format:'4:5',imageRequired:false},
    epaper:{title:headline,subtitle:competition,body:paragraphs,format:'A4',photo:licensedPhoto},
    photo:licensedPhoto,playerPerformance,photoSearches,publication:'internal-auto-eligible',externalPublishing:'disabled-without-account-permissions',
    posterSvg:renderPoster({headline,summary,result,venue,teams,language})};
}
export function renderPoster({headline,summary,result,venue,teams,language='en'}) {
  const wrap=(value,max=27,maxLines=3)=>{const words=String(value||'').split(/\s+/);const lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word}else line=(line+' '+word).trim()}if(line)lines.push(line);return lines.slice(0,maxLines).map((x,i,a)=>i===maxLines-1&&lines.length>maxLines?x.slice(0,max-1)+'…':x)};
  const lines=(value,y,size,max,maxLines,color='#fff',weight=700)=>wrap(value,max,maxLines).map((v,i)=>`<text x="84" y="${y+i*size*1.32}" font-family="Noto Sans,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(v)}</text>`).join('');
  const left=String(teams?.[0]||'TEAM 1'),right=String(teams?.[1]||'TEAM 2');
  const parsed=String(summary).split(' | ').slice(0,2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07152b"/><stop offset=".55" stop-color="#132b5b"/><stop offset="1" stop-color="#47173d"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#bg)"/><rect x="42" y="42" width="996" height="1266" rx="30" fill="none" stroke="#d9bb77" stroke-width="3"/><text x="84" y="133" font-size="32" font-weight="800" letter-spacing="4" fill="#f0c878">SCORING HEROES</text><text x="84" y="181" font-size="23" fill="#c7d2e5">SPORTS DESK  /  MATCH RESULT</text><path d="M84 212H996" stroke="#d9bb77" stroke-width="2"/>${lines(left,290,40,38,2)}<text x="84" y="392" font-size="28" fill="#f0c878">VERSUS</text>${lines(right,452,40,38,2)}<rect x="70" y="520" width="940" height="170" rx="20" fill="#091a36" stroke="#506080"/>${lines(headline,575,40,39,2,'#f0c878')}${parsed.map((v,i)=>lines(v,770+i*130,34,44,2,'#fff',650)).join('')}${lines(result,1060,28,58,2,'#f0c878')}${lines(venue,1162,26,62,2,'#d4dceb',500)}<text x="84" y="1260" font-size="23" font-weight="700" fill="#f0c878">VERIFIED SCORECARD • SCORING HEROES</text></svg>`;
}
export function publishDecision(prepared, existingIds=new Set(), {autoEnabled=false}={}) {
  if (!prepared?.ok || !prepared.verified) return {publish:false,reason:'Unverified match'};
  if (!autoEnabled) return {publish:false,reason:'Auto publishing disabled'};
  if (existingIds.has(prepared.id)) return {publish:false,reason:'Already published'};
  return {publish:true,id:prepared.id,channel:'scoring-heroes-internal'};
}
