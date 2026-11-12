// Automatic QA for news posters. Every check is real (decode, hash, text, URL fetch); results are stored on the job.
import crypto from 'node:crypto';
import {sniff} from './news-pipeline.mjs';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const text = svg => svg.replace(/<image[^>]*>/g,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ');
export const tokens = title => String(title).match(/[A-Za-zऀ-౿]*[A-Z0-9ऀ-౿][A-Za-z0-9ऀ-౿]*(?:[\/\-.][A-Za-z0-9]+)*/g) || [];
// jobs: all stored jobs (for duplicate detection). image: {bytes,mime}|null. svg: composed poster. assetUrl: permanent URL or ''.
export async function qaJob({job, image, svg, jobs = {}, fetchImpl = fetch, requireAsset = false}) {
  const checks = [], add = (name, ok, note = '') => checks.push({name, ok: !!ok, note});
  const flat = text(svg || ''), words = tokens(job.title);
  add('poster-composed', svg && svg.startsWith('<svg') && /viewBox="0 0 1080 1350"/.test(svg), 'poster is 1080x1350');
  const missing = words.filter(w => !flat.toLowerCase().includes(w.toLowerCase()));
  add('names-and-numbers-in-poster', !missing.length, missing.length ? 'missing: ' + missing.slice(0, 6).join(', ') : words.length + ' tokens present');
  add('job-id-and-source', flat.includes(job.jobId.slice(3, 11).toUpperCase()) && (!job.source?.name || flat.includes(job.source.name)), '');
  if (job.image?.status === 'generated') {
    add('image-exists', image && image.bytes?.length > 5000, image ? image.bytes.length + ' bytes' : 'no image');
    add('image-decodes', image && sniff(image.bytes), image ? String(sniff(image.bytes)) : '');
    const h = image ? hash(image.bytes) : '';
    const dup = Object.values(jobs).find(j => j.jobId !== job.jobId && j.image?.sha256 === h && h);
    add('image-unique', !dup, dup ? 'same image as ' + dup.jobId : 'sha256 ' + h.slice(0, 12));
    add('ai-label', /AI-generated/.test(flat), 'AI disclosure on poster');
    job.image.sha256 = h;
  } else add('graphic-fallback', /Original Scoring Heroes graphic/.test(flat), 'no AI image; original graphic labelled');
  const fetchSame = async (name, url, want) => { try { const r = await fetchImpl(url); const b = Buffer.from(await r.arrayBuffer()); add(name, r.ok && hash(b) === hash(want), 'HTTP ' + r.status + ', ' + b.length + ' bytes'); } catch (e) { add(name, false, String(e.message).slice(0, 80)); } };
  if (job.asset?.url) await fetchSame('poster-url-serves-same-bytes', job.asset.url, Buffer.from(svg || ''));
  else add('permanent-storage', !requireAsset, requireAsset ? 'not stored permanently' : 'storage not configured (local disk only)');
  if (job.image?.assetUrl && image) await fetchSame('image-url-serves-same-bytes', job.image.assetUrl, image.bytes);
  return {passed: checks.every(c => c.ok), checks, at: Date.now()};
}
