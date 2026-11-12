// SH Global Sports Media — source registry and publication gate v1
// Research references are not permissions to scrape, republish or reuse photos.
export const CHANNELS = Object.freeze([
 ['CricTracker','https://whatsapp.com/channel/0029VaAWZf67Noa8G0GHdJ2Q','cricket'],
 ['Cricket with Ansh','https://whatsapp.com/channel/0029VaEtjL38fewweOpH6g17','cricket'],
 ['IPL Cricket News','https://whatsapp.com/channel/0029VaJWno3JENxssY7qSy23','cricket'],
 ['ICC','https://whatsapp.com/channel/0029Va1l6bYElah0fPmOD40v','cricket'],
 ['India','https://whatsapp.com/channel/0029VbBXIEN3QxRrKVWMO42Y','general'],
 ['SPORT1','https://whatsapp.com/channel/0029VaDkoZ84NVifzXzKfD1w','multi-sport']
].map(([name,url,sport])=>Object.freeze({name,url,sport,access:'reference-only'})));
export const SOURCES = Object.freeze([
 ['cricket','ICC','https://www.icc-cricket.com/fixtures-results'],
 ['cricket','BCCI','https://www.bcci.tv/'],
 ['cricket','CricTracker','https://www.crictracker.com/'],
 ['football','FIFA','https://www.fifa.com/'],
 ['football','UEFA','https://www.uefa.com/'],
 ['basketball','FIBA','https://www.fiba.basketball/'],
 ['basketball','NBA','https://www.nba.com/'],
 ['tennis','ATP','https://www.atptour.com/'],
 ['tennis','WTA','https://www.wtatennis.com/'],
 ['badminton','BWF','https://bwfbadminton.com/'],
 ['hockey','FIH','https://www.fih.hockey/'],
 ['volleyball','FIVB','https://www.fivb.com/'],
 ['kabaddi','Pro Kabaddi','https://www.prokabaddi.com/'],
 ['baseball','MLB','https://www.mlb.com/'],
 ['rugby','World Rugby','https://www.world.rugby/'],
 ['athletics','World Athletics','https://worldathletics.org/'],
 ['multi-sport','Olympics','https://www.olympics.com/'],
 ['multi-sport','Reuters Sports','https://www.reuters.com/sports/'],
 ['multi-sport','BBC Sport','https://www.bbc.com/sport/']
].map(([sport,name,url])=>Object.freeze({sport,name,url,access:'public-reference',licensedFeed:false})));
export const LOCKED_RULES = Object.freeze([
 'official-result-verification','team-and-player-identity-check','source-attribution',
 'rights-cleared-images-only','immutable-brand-asset-ids','original-layouts-only',
 'no-fabricated-performances','duplicate-detection','publication-quality-gate',
 'global-sport-extensibility'
]);
const clean = x => String(x??'').trim();
const https = x => /^https:\/\//i.test(clean(x));
export function evaluateStory(story={}) {
 const reasons=[];
 if(!clean(story.sport)||!clean(story.eventId)) reasons.push('sport/event ID missing');
 if(!clean(story.headline)||!clean(story.body)) reasons.push('headline or story missing');
 if(!Array.isArray(story.sources)||!story.sources.some(s=>https(s.url)&&s.verified===true)) reasons.push('verified source missing');
 if(story.type==='match-result' && !(story.resultVerified===true && clean(story.result))) reasons.push('official result unverified');
 const media=(story.media||[]).filter(m=>m&&m.url);
 for(const m of media) if(!https(m.url)||m.approved!==true||!clean(m.license)||!clean(m.attribution)||!clean(m.subjectVerified)) reasons.push('media rights/identity unverified');
 if(story.claimsVerified!==true) reasons.push('story claims not verified');
 return {eligible:reasons.length===0,reasons,photoReady:media.some(m=>m.kind==='photo'),status:reasons.length?'research-required':'editorial-ready'};
}
export function dedupeKey(story={}) {
 return [clean(story.sport).toLowerCase(),clean(story.eventId).toLowerCase(),clean(story.type).toLowerCase(),clean(story.result).toLowerCase()].join('|');
}
export function planStory(story={}) {
 const gate=evaluateStory(story);
 return {key:dedupeKey(story),gate,outputs:gate.eligible?['epaper-draft','social-poster-draft','reel-storyboard']:[],externalPublish:false,notes:'External publication requires authorized accounts, asset licenses and rendered-output QA.'};
}

/**
 * Mandatory artwork policy. A missing source photo must never produce a blank
 * story image or an unlicensed copy of a search-result thumbnail.
 * The research adapter is deliberately external: a Google search URL is NOT
 * evidence of image rights and does not imply search was executed.
 */
export function planArtwork(story={}) {
 const q=[story.sport,story.competition,story.teams?.join(' vs '),story.date,story.headline].filter(Boolean).join(' ');
 const researchUrl='https://www.google.com/search?q='+encodeURIComponent(q);
 const media=(story.media||[]).filter(m=>m&&m.kind==='photo');
 const licensed=media.find(m=>https(m.url)&&m.approved===true&&clean(m.license)&&clean(m.attribution)&&m.subjectVerified===true);
 const gate=evaluateStory(story);
 return {
  eventId:clean(story.eventId),researchUrl,
  mode:licensed?'verified-licensed-photo':'original-illustration',
  sourcePhoto:licensed?{url:licensed.url,license:licensed.license,attribution:licensed.attribution}:null,
  originalArtworkRequired:!licensed,
  renderRequired:true,
  publishAllowed:gate.eligible,
  safeguards:['No hotlinked search thumbnails','No invented player likeness','Clearly label illustrations','Render and inspect output before publication']
 };
}
