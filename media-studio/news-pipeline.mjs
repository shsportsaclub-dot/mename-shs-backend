// SH Media Studio — News pipeline: news item -> job (unique Job ID) -> AI image -> poster -> internal publication.
// Pure and dependency-injected so every step can be tested without network access.
import crypto from 'node:crypto';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STATUS = Object.freeze({queued:'queued',imaging:'imaging',ready:'ready',published:'published',failed:'failed',review:'manual_review'});
export const canonTitle = t => String(t||'').toLowerCase().replace(/\s+[-–|]\s+[^-–|]{2,40}$/,'').replace(/[^a-z0-9ऀ-෿ ]+/g,' ').replace(/\s+/g,' ').trim();
// Same story from the same outlet always maps to the same ID, whatever tracking query the link carries.
export const jobIdFor = item => 'nj-' + crypto.createHash('sha1').update(canonTitle(item?.title)).digest('hex').slice(0,14);
const SPORTS = [['cricket',/cricket|ipl|bcci|t20|odi|test match|wicket|innings|ranji|bbl|psl|century|batter|batsman|bowler|stumps|run chase|sheffield shield|asia cup/i],['football',/football|soccer|premier league|la liga|fifa|uefa|goal\b|champions league|isl\b/i],['tennis',/tennis|wimbledon|atp|wta|grand slam|us open|roland garros/i],['basketball',/basketball|nba|wnba/i],['hockey',/hockey|fih\b/i],['badminton',/badminton|bwf|shuttler/i],['kabaddi',/kabaddi|pkl/i],['volleyball',/volleyball/i],['baseball',/baseball|mlb/i],['rugby',/rugby/i]];
export const sportOf = title => (SPORTS.find(([,re])=>re.test(String(title||'')))||['sport'])[0];
// The prompt describes the scene, never the people: no names, faces, logos or text go to the image model.
export function buildImagePrompt(title) {
  const sport = sportOf(title), t = String(title||'').toLowerCase();
  const mood = /century|hundred|record|win|won|victory|title|champion|trophy|final/.test(t) ? 'triumphant celebration, golden confetti' : /injur|ban|out of|ruled out|setback|lose|lost|defeat/.test(t) ? 'tense, emotional, rain and floodlights' : /auction|sign|transfer|squad|named/.test(t) ? 'team announcement atmosphere, spotlight' : 'dramatic match atmosphere';
  return `Original cinematic ${sport} illustration for a news poster, ${mood}, packed stadium under floodlights at night, generic unnamed athletes seen as silhouettes or from behind, rich navy and gold colour palette, vertical 4:5 composition, no text, no letters, no numbers, no logos, no watermark, no real person likeness`;
}
export const seedFor = id => parseInt(crypto.createHash('sha1').update(id).digest('hex').slice(0,7),16);
const cap = (s,n) => String(s||'').replace(/\s+/g,' ').trim().slice(0,n);
export function newJob(item, now = Date.now()) {
  const title = cap(item.title,220); if (!title) return null;
  const id = jobIdFor(item), source = { name: cap(item.source||'News',80), url: /^https:\/\//i.test(item.link||'') ? String(item.link).slice(0,600) : '', publishedAt: item.date ? (Date.parse(item.date) || null) : null };
  return { jobId:id, kind:'news', title, caption: `${title}\nSource: ${source.name}\n#ScoringHeroes #SportsNews`,
    source, status: STATUS.queued, attempts: 0, createdAt: now, updatedAt: now, publishedAt: null, channel: 'scoring-heroes-internal',
    image: { status:'pending', kind:'ai-illustration', provider:null, prompt: buildImagePrompt(title), seed: seedFor(id), generatedAt:null, disclosure:'AI-generated illustration, not a photograph' },
    history: [{ at: now, status: STATUS.queued }] };
}
const mark = (job, status, note, now) => { job.status = status; job.updatedAt = now; job.history = (job.history||[]).concat({ at: now, status, ...(note?{note:cap(note,160)}:{}) }).slice(-12); return job; };
// ---- image generation service (free providers; chosen by env) ----
export const sniff = b => b.length>12 && ((b[0]===0xFF&&b[1]===0xD8)?'image/jpeg':(b[0]===0x89&&b[1]===0x50)?'image/png':(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP')?'image/webp':'');
export async function generateImage({prompt, seed, provider='auto', hfToken='', openaiKey='', openaiModel='', googleKey='', googleModel='', googleBase='https://generativelanguage.googleapis.com', fetchImpl=fetch, timeoutMs=60000, width=1024, height=1280}) {
  const use = provider==='auto' ? ((openaiKey&&openaiModel)?'openai':(googleKey&&googleModel)?'google':hfToken?'huggingface':'pollinations') : provider;
  if (use==='google' && !(googleKey&&googleModel)) return {ok:false,permanent:true,provider:use,error:'GOOGLE_API_KEY and GOOGLE_IMAGE_MODEL must both be set'};
  if (use==='openai' && !(openaiKey&&openaiModel)) return {ok:false,permanent:true,provider:use,error:'OPENAI_API_KEY and OPENAI_IMAGE_MODEL must both be set'};
  if (use==='none') return {ok:false,permanent:true,error:'Image provider disabled'};
  const ctl = new AbortController(), timer = setTimeout(()=>ctl.abort(), timeoutMs);
  try {
    let r;
    if (use==='google') {
      r = await fetchImpl((googleBase||'https://generativelanguage.googleapis.com')+'/v1/models/'+encodeURIComponent(googleModel)+':generateContent', {method:'POST',signal:ctl.signal,headers:{'x-goog-api-key':googleKey,'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['TEXT','IMAGE']}})});
      if (!r.ok) return {ok:false,provider:use,error:'Google HTTP '+r.status};
      const j = await r.json(), part = (j?.candidates?.[0]?.content?.parts||[]).find(x=>(x.inlineData||x.inline_data)?.data), d = part && (part.inlineData||part.inline_data);
      if (!d) return {ok:false,provider:use,error:'Google returned no image'};
      r = {ok:true,headers:{get:()=> d.mimeType||d.mime_type||'image/png'},arrayBuffer:async()=>Buffer.from(d.data,'base64')};
    }
    else if (use==='openai') {
      r = await fetchImpl('https://api.openai.com/v1/images/generations', {method:'POST',signal:ctl.signal,headers:{authorization:'Bearer '+openaiKey,'content-type':'application/json'},body:JSON.stringify({model:openaiModel,prompt,size:'1024x1536',n:1})});
      if (!r.ok) return {ok:false,provider:use,error:'OpenAI HTTP '+r.status};
      const j = await r.json(), d = j?.data?.[0];
      if (d?.b64_json) r = {ok:true,headers:{get:()=> 'image/png'},arrayBuffer:async()=>Buffer.from(d.b64_json,'base64')};
      else if (d?.url) r = await fetchImpl(d.url,{signal:ctl.signal});
      else return {ok:false,provider:use,error:'OpenAI returned no image'};
    }
    else if (use==='huggingface') r = await fetchImpl('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {method:'POST',signal:ctl.signal,headers:{authorization:'Bearer '+hfToken,'content-type':'application/json',accept:'image/png'},body:JSON.stringify({inputs:prompt,parameters:{width,height,seed}})});
    else r = await fetchImpl(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`, {signal:ctl.signal});
    if (!r.ok) return {ok:false,provider:use,error:'Image service HTTP '+r.status};
    const buf = Buffer.from(await r.arrayBuffer()), mime = sniff(buf);
    if (!mime) return {ok:false,provider:use,error:'Image service returned a non-image'};
    if (buf.length > 6e6) return {ok:false,provider:use,error:'Image too large'};
    return {ok:true,provider:use,mime,bytes:buf};
  } catch (e) { return {ok:false,provider:use,error:e.name==='AbortError'?'Image service timed out':String(e.message||e).slice(0,120)}; }
  finally { clearTimeout(timer); }
}
// ---- poster: original layout; the generated picture sits behind the caption ----
const wrap=(s,max,limit)=>{const w=String(s||'').trim().split(/\s+/).filter(Boolean),o=[];let l='';for(const x of w){const c=l?l+' '+x:x;if([...c].length>max&&l){o.push(l);l=x}else l=c}if(l)o.push(l);if(o.length>limit){const k=o.slice(0,limit);k[limit-1]=[...k[limit-1]].slice(0,Math.max(1,max-1)).join('')+'…';return k}return o};
const FONT="'Noto Sans','Noto Sans Telugu','Noto Sans Devanagari','Telugu Sangam MN',Gautami,Arial,sans-serif";
export function renderNewsPoster(job, image = null) {
  const lines = wrap(job.title, /[^\x00-\x7f]/.test(job.title)?20:26, 6), size = lines.length>4?52:60;
  const when = job.source?.publishedAt ? new Date(job.source.publishedAt).toISOString().slice(0,10) : '';
  const tx=(t,x,y,s,c,w=800,extra='')=>`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${s}" font-weight="${w}" fill="${c}" ${extra}>${esc(t)}</text>`;
  const pic = image ? `<image href="data:${image.mime};base64,${image.bytes.toString('base64')}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="1080" height="1350" fill="url(#bg)"/><circle cx="780" cy="420" r="460" fill="#18b9e1" opacity=".18"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#050b1c"/><stop offset=".55" stop-color="#10335b"/><stop offset="1" stop-color="#100f2b"/></linearGradient><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#050b1c" stop-opacity="0"/><stop offset=".62" stop-color="#050b1c" stop-opacity=".78"/><stop offset="1" stop-color="#050b1c" stop-opacity=".96"/></linearGradient><linearGradient id="gold" x2="1" y2="1"><stop stop-color="#fff1b8"/><stop offset=".5" stop-color="#d6a14e"/><stop offset="1" stop-color="#ffe5a2"/></linearGradient></defs>
 ${pic}<rect width="1080" height="1350" fill="url(#fade)"/>
 <rect x="40" y="40" width="1000" height="1270" rx="26" fill="none" stroke="url(#gold)" stroke-width="3"/>
 <rect x="70" y="74" width="170" height="52" rx="26" fill="#d7a354"/>${tx('NEWS',100,110,26,'#0a1730',900,'letter-spacing="3"')}
 ${lines.map((l,i)=>tx(l,80,640+i*size*1.25,size,'#ffffff',800)).join('')}
 <path d="M82 1130H998" stroke="url(#gold)" stroke-width="3"/>
 ${tx('Source: '+(job.source?.name||'News')+(when?'  •  '+when:''),82,1180,28,'#f6d99b',700)}
 ${tx(image?(job.image?.disclosure||'AI-generated illustration'):'Original Scoring Heroes graphic',82,1228,22,'#b9c9de',500)}
 ${tx('SCORING HEROES  •  JOB '+job.jobId.slice(3,11).toUpperCase(),82,1272,22,'#c6d9ee',700,'letter-spacing="2"')}</svg>`;
}
// ---- orchestration (dependency-injected) ----
// store: object keyed by jobId, persisted by the caller. Returns what happened so the host can log and save.
export async function runPipeline({items=[], store, generate, now=()=>Date.now(), maxNew=5, maxProcess=2, maxAgeMs=3*864e5, autoPublish=true, maxAttempts=3, keep=300, finalize=null}) {
  const out = {created:0, review:0, duplicates:0, imaged:0, published:0, failed:0, fallback:0, stale:0};
  const known = new Set(Object.keys(store)), titles = new Set(Object.values(store).map(j=>canonTitle(j.title)));
  for (const it of items) {
    if (out.created >= maxNew) break;
    const job = newJob(it, now()); if (!job) continue;
    if (known.has(job.jobId) || titles.has(canonTitle(job.title))) { out.duplicates++; continue; }
    if (job.source.publishedAt && now() - job.source.publishedAt > maxAgeMs) { out.stale++; continue; }
    store[job.jobId] = job; known.add(job.jobId); titles.add(canonTitle(job.title)); out.created++;
  }
  const todo = Object.values(store).filter(j=>j.status===STATUS.queued || j.status===STATUS.ready || (j.status===STATUS.failed && j.attempts<maxAttempts && now()-j.updatedAt>6e5)).sort((a,b)=>a.createdAt-b.createdAt).slice(0,maxProcess);
  for (const job of todo) {
    if (job.status === STATUS.published) continue;                 // never post the same story twice
    if (job.status !== STATUS.ready) {
      mark(job, STATUS.imaging, '', now()); job.attempts++;
      const r = await generate(job);
      if (r?.ok) { job.image = {...job.image, status:'generated', provider:r.provider, generatedAt:now(), bytes:r.bytes.length}; mark(job, STATUS.ready, 'image generated by '+r.provider, now()); out.imaged++; }
      else if (job.attempts >= maxAttempts || r?.permanent) { job.image = {...job.image, status:'fallback', kind:'graphic', error:cap(r?.error,120)}; mark(job, STATUS.ready, 'image unavailable, using original graphic', now()); out.fallback++; }
      else { job.image = {...job.image, error:cap(r?.error,120)}; mark(job, STATUS.failed, r?.error||'image failed', now()); out.failed++; continue; }
    }
    if (finalize && job.status === STATUS.ready) {            // store permanently + automatic QA; a failing AI image falls back to the original graphic
      let f = await finalize(job);
      if (!f?.passed && job.image?.status === 'generated') { job.image = {...job.image, status:'fallback', kind:'graphic', error:'QA: '+cap((f?.checks||[]).filter(c=>!c.ok).map(c=>c.name).join(','),100)}; f = await finalize(job); }
      if (!f?.passed) { mark(job, STATUS.review, 'QA failed: '+cap((f?.checks||[]).filter(c=>!c.ok).map(c=>c.name+' '+c.note).join('; '),160), now()); out.review++; continue; }
    }
    if (autoPublish && job.status === STATUS.ready) { job.publishedAt = now(); mark(job, STATUS.published, 'published to Scoring Heroes feed', now()); out.published++; }
  }
  const all = Object.values(store).sort((a,b)=>b.createdAt-a.createdAt);
  for (const j of all.slice(keep)) if (j.status===STATUS.published) delete store[j.jobId];   // old published jobs age out; the title index above still blocks recent repeats
  return out;
}
export const publicJob = j => ({jobId:j.jobId,title:j.title,caption:j.caption,source:j.source,status:j.status,attempts:j.attempts,createdAt:j.createdAt,publishedAt:j.publishedAt,image:{status:j.image?.status,kind:j.image?.kind,provider:j.image?.provider||null,disclosure:j.image?.disclosure,generatedAt:j.image?.generatedAt||null},assetUrl:j.image?.assetUrl||null,posterAssetUrl:j.asset?.url||null,qa:j.qa?{passed:j.qa.passed,at:j.qa.at,failed:j.qa.checks.filter(c=>!c.ok).map(c=>c.name)}:null,posterUrl:'/api/news-poster?job='+encodeURIComponent(j.jobId),history:j.history});
