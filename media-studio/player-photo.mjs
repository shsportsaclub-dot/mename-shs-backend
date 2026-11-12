// Licensed player photos from Wikimedia Commons, via the Wikipedia page of the player.
// A photo is used only when ALL hold: exactly one Wikipedia page matches the exact name, its description says "cricketer",
// the page image is on Commons with a free licence (CC BY, CC BY-SA, CC0 or public domain), and attribution is available.
// Otherwise there is no photo. Nothing here ever generates or guesses a face.
const API = 'https://en.wikipedia.org/w/api.php', COMMONS = 'https://commons.wikimedia.org/w/api.php';
const FREE = /^(CC BY(?:-SA)?(?: \d(?:\.\d)?)?|CC0(?: 1\.0)?|Public domain|PD)/i;
const strip = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = n => String(n || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
async function getJson(url, f, ms) { const r = await f(url, { signal: AbortSignal.timeout(ms), headers: { 'user-agent': 'ScoringHeroes/1.0 (sports media; contact via site)' } }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
export async function findPlayerPhoto(name, {fetchImpl = fetch, timeoutMs = 12000, width = 320} = {}) {
  const want = norm(name); if (want.split(' ').length < 2) return {ok: false, reason: 'name too short to verify'};
  try {
    const q = new URLSearchParams({action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: name + ' cricketer', gsrlimit: '6', prop: 'pageimages|description', piprop: 'name', redirects: '1'});
    const j = await getJson(API + '?' + q, fetchImpl, timeoutMs), pages = Object.values(j?.query?.pages || {});
    const hits = pages.filter(p => norm(p.title) === want && /cricket/i.test(p.description || ''));
    if (hits.length !== 1) return {ok: false, reason: hits.length ? 'ambiguous name' : 'no matching cricketer page'};
    const file = hits[0].pageimage; if (!file) return {ok: false, reason: 'page has no image'};
    const c = new URLSearchParams({action: 'query', format: 'json', origin: '*', titles: 'File:' + file, prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: String(width)});
    const cj = await getJson(COMMONS + '?' + c, fetchImpl, timeoutMs), ii = Object.values(cj?.query?.pages || {})[0]?.imageinfo?.[0];
    if (!ii) return {ok: false, reason: 'image details missing'};
    const md = ii.extmetadata || {}, lic = strip(md.LicenseShortName?.value), artist = strip(md.Artist?.value);
    if (!FREE.test(lic) || /\b(NC|ND)\b/i.test(lic)) return {ok: false, reason: 'licence not free: ' + (lic || 'unknown')};
    if (!/^image\/(jpeg|png|webp)$/.test(ii.mime || '')) return {ok: false, reason: 'unsupported image type'};
    const r = await fetchImpl(ii.thumburl || ii.url, {signal: AbortSignal.timeout(timeoutMs), headers: {'user-agent': 'ScoringHeroes/1.0'}});
    if (!r.ok) return {ok: false, reason: 'image download HTTP ' + r.status};
    const bytes = Buffer.from(await r.arrayBuffer()); if (bytes.length < 2000 || bytes.length > 600000) return {ok: false, reason: 'image size out of range'};
    return {ok: true, bytes, mime: ii.mime, license: lic, artist: artist.slice(0, 60) || 'Unknown author', credit: ((artist.slice(0, 40) || 'Unknown author') + ', ' + lic), page: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(hits[0].title.replace(/ /g, '_'))};
  } catch (e) { return {ok: false, reason: String(e.message || e).slice(0, 80)}; }
}
