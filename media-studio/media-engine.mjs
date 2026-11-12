import {performanceInsights, playerPhotoSearch} from './player-media.mjs';
// SH Media Studio v1 — pure, dependency-free article and poster preparation.
// Produces drafts only. Publishing is controlled by the host backend.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt = (v,n=150) => String(v ?? '').trim().slice(0,n);
const score = s => s && Number.isFinite(Number(s.r)) && Number.isFinite(Number(s.w)) ? `${Number(s.r)}/${Number(s.w)}${s.o != null ? ' ('+txt(s.o,10)+' ov)' : ''}` : '';
export const normalizeLanguage = v => ['en','te','hi'].includes(String(v||'').toLowerCase().split('-')[0]) ? String(v).toLowerCase().split('-')[0] : 'en';
const isFinal = m => m?.ended === true && /won by|won the|match tied|\btied\b|drawn|\bdraw\b|no result|abandoned|cancelled|super over/i.test(String(m.status||''));
const WIN_RE=/^(.+?) won by (?:an? )?(?:innings and )?(\d+) (runs?|wkts?|wickets?)/i;
const LABELS={
 en:{noResult:'No result',drawn:'Match drawn',tied:'Match tied',completed:'Match completed',tag:'MATCH RESULT',desk:'GLOBAL SPORTS DESK',foot:'ORIGINAL MATCH GRAPHIC • SCORING HEROES',overs:'ov',final:'RESULT'},
 te:{noResult:'ఫలితం లేదు',drawn:'మ్యాచ్ డ్రా',tied:'మ్యాచ్ టై',completed:'మ్యాచ్ ముగిసింది',tag:'మ్యాచ్ ఫలితం',desk:'గ్లోబల్ స్పోర్ట్స్ డెస్క్',foot:'ఒరిజినల్ మ్యాచ్ గ్రాఫిక్ • స్కోరింగ్ హీరోస్',overs:'ఓవర్లు',final:'ఫలితం'},
 hi:{noResult:'कोई परिणाम नहीं',drawn:'मैच ड्रा',tied:'मैच टाई',completed:'मैच समाप्त',tag:'मैच परिणाम',desk:'ग्लोबल स्पोर्ट्स डेस्क',foot:'ओरिजिनल मैच ग्राफिक • स्कोरिंग हीरोज़',overs:'ओवर',final:'परिणाम'}};
const validId = x => /^[a-z0-9-]{1,64}$/i.test(String(x||''));
export function prepareMedia(m, {language='en', photo=null, artwork=null}={}) {
  language=normalizeLanguage(language);
  if (!validId(m?.id)) throw new Error('Invalid match ID');
  if (!isFinal(m)) return {ok:false,reason:'Final result not verified; do not publish'};
  const teams=(m.teams||[]).slice(0,2).map(t=>txt(typeof t==='string'?t:t?.name,75));
  if(teams.length!==2 || teams.some(x=>!x)) return {ok:false,reason:'Missing team names'};
  const innings=(m.score||[]).filter(x=>Number.isFinite(Number(x.r))&&Number.isFinite(Number(x.w))).slice(0,4);
  const result=txt(m.status,170), venue=txt(m.venue,140), competition=txt(m.name,160);
  const winner=WIN_RE.exec(result);
  const winnerName=winner?txt(winner[1],75):'';
  const winnerVerified=teams.some(x=>x.toLowerCase()===winnerName.toLowerCase());
  const hindi=language==='hi';
  const L=LABELS[language]||LABELS.en;
  const outcome=/abandon|no result|cancel/i.test(result)?'noresult':/\btied?\b|super over/i.test(result)&&!winner?'tie':/draw/i.test(result)&&!winner?'draw':'';
  const inns=/won by an? innings/i.test(result);
  const headline=winner && winnerVerified
    ? (language==='te'?`${winnerName} విజయం — ${inns?'ఇన్నింగ్స్, ':''}${winner[2]} ${/run/i.test(winner[3])?'పరుగుల':'వికెట్ల'} తేడాతో`:language==='hi'?`${winnerName} की ${inns?'पारी और ':''}${winner[2]} ${/run/i.test(winner[3])?'रन':'विकेट'} से जीत`:`${winnerName} win by ${inns?'an innings and ':''}${winner[2]} ${/run/i.test(winner[3])?(winner[2]==='1'?'run':'runs'):(winner[2]==='1'?'wicket':'wickets')}`)
    : outcome==='noresult' ? `${teams[0]} vs ${teams[1]} — ${L.noResult}`
    : outcome==='draw' ? `${teams[0]} vs ${teams[1]} — ${L.drawn}`
    : outcome==='tie' ? `${teams[0]} vs ${teams[1]} — ${L.tied}`
    : `${teams[0]} vs ${teams[1]} — ${L.completed}`;
  // Resolve every innings to one of the two teams. The provider sometimes sends "Team A,Team B Inning 1"
  // (batting side is the one that is not the previous innings' side) or lower-case names.
  const canonical = value => String(value||'').toLowerCase().replace(/\s+inning\s*\d+.*$/i,'').replace(/[^a-z0-9]/g,'');
  const teamKeys=teams.map(canonical);
  let prev=-1;const normalized=[];let mismatch=false;
  for(const x of innings){
    const parts=String(x.inning||'').replace(/\s+inning\s*\d+.*$/i,'').split(',').map(canonical).filter(Boolean);
    let cand=parts.map(k=>teamKeys.indexOf(k)).filter(i=>i>=0);
    let idx=-1;
    if(!parts.length){idx=prev<0?0:(innings.length<=2?1-prev:prev)}
    else if(cand.length===1)idx=cand[0];
    else if(cand.length>1){const other=cand.filter(i=>i!==prev);idx=(other.length?other:cand)[other.length?other.length-1:cand.length-1]}
    if(idx<0){mismatch=true;break}
    normalized.push({name:teams[idx],teamIndex:idx,runs:Number(x.r),wickets:Number(x.w),overs:txt(x.o,12)});prev=idx;
  }
  if(mismatch || (normalized.length===2&&normalized[0].teamIndex===normalized[1].teamIndex))
    return {ok:false,reason:'Scorecard innings team mismatch; manual source verification required'};
  const summary=normalized.map(x=>`${x.name}: ${x.runs}/${x.wickets}${x.overs?' ('+x.overs+' ov)':''}`).join(' | ');
  const a=normalized.length<=2?normalized[0]:null,b=normalized.length<=2?normalized[1]:null;
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
  const rawCard=m.scorecard || m.playerScorecard || {};
  const playerPerformance=performanceInsights(rawCard);
  const photoSearches=playerPerformance.batters.slice(0,2).concat(playerPerformance.bowlers.slice(0,2)).filter((p,i,a)=>a.findIndex(q=>q.name===p.name&&q.team===p.team)===i).map(p=>playerPhotoSearch(p.name,p.team));
  const paragraphs=language==='te' ? [
    `${teams[0]}, ${teams[1]} మధ్య మ్యాచ్ ముగిసింది. ఫలితం: ${result}.`,...analysis,
    summary?`పూర్తి స్కోరు: ${summary}.`:'',venue?`వేదిక: ${venue}.`:''
  ].filter(Boolean) : hindi ? [
    `${teams[0]} और ${teams[1]} का मैच समाप्त हुआ। परिणाम: ${result}।`,...analysis,
    summary?`स्कोरकार्ड: ${summary}।`:'',venue?`स्थान: ${venue}।`:''
  ].filter(Boolean) : [
    `${teams[0]} and ${teams[1]} completed their match. Result: ${result}.`,...analysis,
    summary?`Full recorded score: ${summary}.`:'',venue?`Venue: ${venue}.`:''
  ].filter(Boolean);
  if(playerPerformance.hasPlayerData) paragraphs.splice(Math.min(2,paragraphs.length),0,...playerPerformance.paragraphs);
  // No invented wicket-takers, quotes, milestones, photos or highlight clips.
  const licensedPhoto = photo && photo.approved === true && /^https:\/\//i.test(String(photo.url||'')) && photo.license && photo.attribution && photo.subjectVerified === true
    ? {url:String(photo.url),approved:true,subjectVerified:true,license:txt(photo.license,80),attribution:txt(photo.attribution,250)} : null;
  const players=[...new Map([...playerPerformance.batters,...playerPerformance.bowlers].map(p=>[p.name.toLowerCase()+'|'+p.team.toLowerCase(),{name:p.name,team:p.team}])).values()];
  const research={status:playerPerformance.hasPlayerData?'scorecard-players-available':'external-research-needed',matchQuery:[teams.join(' vs '),competition,venue,'scorecard'].filter(Boolean).join(' '),matchSearchUrl:'https://www.google.com/search?q='+encodeURIComponent([teams.join(' vs '),competition,venue,'scorecard'].filter(Boolean).join(' ')),playerPhotoSearches:photoSearches};
  const key = `sh-media-${m.id}-final`;
  return {ok:true,id:key,matchId:m.id,language,kind:'result',verified:true,headline,summary,paragraphs,
    social:{caption:[headline,summary,analysis[0]||'','#ScoringHeroes #MatchResult'].filter(Boolean).join('\n'),format:'4:5',imageRequired:true},
    epaper:{title:headline,subtitle:competition,body:paragraphs,format:'A4',photo:licensedPhoto},
    photo:licensedPhoto,players,playerPerformance,photoSearches,research,publication:'internal-auto-eligible',externalPublishing:'disabled-without-account-permissions',
    scoreless:!normalized.length,innings:normalized,
    posterSvg:renderPoster({headline,summary,result,venue,teams,language,innings:normalized,artwork})};
}
// Original illustrated match poster. No third-party image or fake player likeness.
// Font stack covers Latin, Telugu and Devanagari on Android/iOS/desktop; the SVG is shown as an <img> so it cannot load web fonts.
const FONT='"Noto Sans","Noto Sans Telugu","Noto Sans Devanagari","Telugu Sangam MN","Gautami","Kohinoor Telugu","Kohinoor Devanagari",Arial,sans-serif';
// artwork: {mime, b64} = AI illustration (no text/names inside it). It replaces the generic bat-and-ball drawing; all text stays deterministic.
export function renderPoster(o) {
  const svg=renderPosterBase(o), a=o&&o.artwork;
  if(!a||!a.b64||!/^image\/(png|jpeg|webp)$/.test(a.mime||''))return svg;
  const layer='<image href="data:'+a.mime+';base64,'+a.b64+'" x="0" y="0" width="1080" height="740" preserveAspectRatio="xMidYMid slice"/><rect x="0" y="0" width="1080" height="740" fill="#050b1c" opacity=".42"/><rect x="0" y="300" width="1080" height="440" fill="#050b1c" opacity=".38"/><text x="1040" y="722" text-anchor="end" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="#e6eefb" opacity=".85">AI-generated illustration</text>\n';
  return svg.replace(/ <g transform="translate\(640 330\)[^\n]*\n/,'').replace(/ <g transform="translate\(800 640\)[^\n]*\n/,'').replace(' <rect x="40" y="40" width="1000"',layer+' <rect x="40" y="40" width="1000"');
}
function renderPosterBase({headline,summary,result,venue,teams,language='en',innings=null}) {
 const L=LABELS[normalizeLanguage(language)]||LABELS.en;
 const safe=(v,n=160)=>esc(String(v??'').slice(0,n));
 // Word wrap by character budget (counts grapheme-ish code points so Telugu/Hindi do not overflow).
 const wrap=(s,max0=26,limit=3)=>{const max=/[^\x00-\x7f]/.test(String(s||''))?Math.max(6,Math.floor(max0*.72)):max0;const words=String(s||'').trim().split(/\s+/).filter(Boolean),out=[];let line='';for(const word of words){const cand=line?line+' '+word:word;if([...cand].length>max&&line){out.push(line);line=word}else line=cand}if(line)out.push(line);if(out.length>limit){const cut=out.slice(0,limit);cut[limit-1]=[...cut[limit-1]].slice(0,Math.max(1,max-1)).join('')+'…';return cut}return out};
 const textLines=(value,x,y,size,max=26,limit=3,color='#fff',weight=800,anchor='start')=>wrap(value,max,limit).map((t,i)=>'<text x="'+x+'" y="'+(y+i*size*1.27)+'" text-anchor="'+anchor+'" font-family='+"'"+FONT.replace(/"/g,'&quot;')+"'"+' font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'">'+safe(t)+'</text>').join('');
 // Per-team score: one innings => 92/5, several (Test) => 310 & 120/3.
 const byTeam=[0,1].map(i=>{const mine=(innings||[]).filter(x=>x.teamIndex===i);return {name:teams?.[i]||'',score:mine.map(x=>x.runs+(x.wickets<10?'/'+x.wickets:'')).join(' & '),overs:mine.length===1&&mine[0].overs?mine[0].overs+' '+L.overs:''}});
 const hasScore=byTeam.some(t=>t.score);
 const hl=[...String(headline||'')].length,hs=hl>52?40:hl>38?46:54,hmax=hl>52?25:hl>38?21:18;
 const stars=Array.from({length:45},(_,i)=>'<circle cx="'+((i*193+67)%1080)+'" cy="'+((i*311+29)%920)+'" r="'+(i%3+1)+'" fill="#fff" opacity=".12"/>').join('');
 const box=hasScore?`<rect x="78" y="750" width="924" height="245" rx="24" fill="#071329" stroke="#bd965d" stroke-width="2" opacity=".97"/>
 ${textLines(byTeam[0].name,110,806,28,24,2,'#cddff0',700)}
 ${textLines(byTeam[0].score||'—',110,914,byTeam[0].score.length>9?50:64,14,1,'#f9d58b')}
 ${textLines(byTeam[0].overs,110,968,22,24,1,'#9fb4cf',600)}
 <path d="M532 775V968" stroke="#b79c73" stroke-width="2" opacity=".7"/>
 ${textLines(byTeam[1].name,565,806,28,24,2,'#cddff0',700)}
 ${textLines(byTeam[1].score||'—',565,914,byTeam[1].score.length>9?50:64,14,1,'#f9d58b')}
 ${textLines(byTeam[1].overs,565,968,22,24,1,'#9fb4cf',600)}`
 :`<rect x="78" y="750" width="924" height="245" rx="24" fill="#071329" stroke="#bd965d" stroke-width="2" opacity=".97"/>
 ${textLines(teams?.[0],540,830,42,30,1,'#f9d58b',800,'middle')}
 ${textLines('vs',540,885,26,10,1,'#9fb4cf',700,'middle')}
 ${textLines(teams?.[1],540,945,42,30,1,'#f9d58b',800,'middle')}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
 <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#050b1c"/><stop offset=".55" stop-color="#10335b"/><stop offset="1" stop-color="#100f2b"/></linearGradient><linearGradient id="gold" x2="1" y2="1"><stop stop-color="#fff1b8"/><stop offset=".5" stop-color="#d6a14e"/><stop offset="1" stop-color="#ffe5a2"/></linearGradient><radialGradient id="glow"><stop stop-color="#18b9e1" stop-opacity=".46"/><stop offset="1" stop-color="#18b9e1" stop-opacity="0"/></radialGradient><filter id="shadow"><feDropShadow dx="0" dy="15" stdDeviation="18" flood-opacity=".5"/></filter></defs>
 <rect width="1080" height="1350" fill="url(#bg)"/>${stars}
 <circle cx="760" cy="420" r="480" fill="url(#glow)"/>
 <path d="M0 0H1080V280L0 680Z" fill="#ffffff" opacity=".035"/>
 <path d="M0 910Q540 710 1080 950V1350H0Z" fill="#040c1e" opacity=".78"/>
 <g opacity=".16" stroke="#b7e5ff" fill="none"><ellipse cx="540" cy="1110" rx="520" ry="105" stroke-width="6"/><ellipse cx="540" cy="1110" rx="350" ry="65" stroke-width="4"/><path d="M540 930V1260M0 1110H1080" stroke-width="3"/></g>
 <g transform="translate(640 330) rotate(-24)" filter="url(#shadow)"><path d="M140 330L140 110Q140 60 185 60H280Q325 60 325 110V330Q325 365 285 365H180Q140 365 140 330Z" fill="#d8a96e" stroke="#ffe3a3" stroke-width="10"/><path d="M185 70V353M228 70V355M278 70V355" stroke="#9a6c3f" stroke-width="4" opacity=".6"/><rect x="215" y="365" width="40" height="240" rx="16" fill="#201d25" stroke="#b6a47d" stroke-width="7"/><path d="M219 410H251M219 445H251M219 480H251M219 515H251M219 550H251" stroke="#e6c57a" stroke-width="6"/></g>
 <g transform="translate(800 640)" filter="url(#shadow)"><circle r="96" fill="#ad1235" stroke="#ff5c6b" stroke-width="8"/><path d="M-58 -72Q12 0 -58 72M-39 -86Q33 0 -39 86" fill="none" stroke="#f8e6c6" stroke-width="5" stroke-dasharray="8 8"/><circle cx="-28" cy="-33" r="40" fill="#ff9d9d" opacity=".14"/></g>
 <rect x="40" y="40" width="1000" height="1270" rx="26" fill="none" stroke="url(#gold)" stroke-width="3"/>
 <rect x="70" y="74" width="500" height="76" rx="12" fill="#050c20" opacity=".84"/>
 <text x="94" y="126" font-family="Arial,sans-serif" font-size="37" font-weight="900" letter-spacing="3" fill="url(#gold)">SCORING HEROES</text>
 ${textLines(L.desk,84,202,23,40,1,'#c6d9ee',700)}
 <rect x="82" y="252" width="330" height="50" rx="25" fill="#d7a354"/>${textLines(L.tag,106,286,25,22,1,'#0a1730',900)}
 ${textLines(headline,80,385,hs,hmax,4,'#ffffff')}
 <path d="M82 715H998" stroke="url(#gold)" stroke-width="4"/>
 ${box}
 ${textLines(result,86,1066,27,60,3,'#fff2ce',700)}
 ${textLines(venue,86,1170,24,66,2,'#b9c9de',500)}
 <path d="M82 1225H998" stroke="#ad8952" stroke-width="2"/>
 ${textLines(L.foot,84,1272,23,60,1,'#f6d99b',800)}
 </svg>`;
}
export function publishDecision(prepared, existingIds=new Set(), {autoEnabled=false}={}) {
  if (!prepared?.ok || !prepared.verified) return {publish:false,reason:'Unverified match'};
  if (!autoEnabled) return {publish:false,reason:'Auto publishing disabled'};
  if (existingIds.has(prepared.id)) return {publish:false,reason:'Already published'};
  return {publish:true,id:prepared.id,channel:'scoring-heroes-internal'};
}
