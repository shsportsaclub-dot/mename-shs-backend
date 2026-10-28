// Live Tennis API feed (free plan: 100 requests/day, 30/min). Base URL, auth header, GET /matches?status=live, the {data:[...]} envelope and the score shape
// (players.p1/p2.name, score.sets, score.games player-major, score.points, score.server) come from the provider's published client docs. Anything missing is left out.
const BASE = 'https://api.livetennisapi.com/api/public/v1';
const n = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
const nm = p => String((p && (p.name || p.full_name || p.display_name)) || '');
const short = s => { const w = s.trim().split(/\s+/); return w.length > 1 ? w[w.length - 1] : s; };
export function row(m) {
  const pl = m.players || {}, p1 = pl.p1 || m.p1 || {}, p2 = pl.p2 || m.p2 || {}, sc = m.score && typeof m.score === 'object' ? m.score : {};
  const g = Array.isArray(sc.games) ? sc.games : [], sets = Array.isArray(sc.sets) ? sc.sets : [];
  const len = Math.max(Array.isArray(g[0]) ? g[0].length : 0, Array.isArray(g[1]) ? g[1].length : 0), periods = [];
  for (let i = 0; i < len; i++) periods.push([n(g[0] && g[0][i]), n(g[1] && g[1][i])]);
  const pts = sc.points != null && sc.points !== '' ? String(sc.points) : '';
  return { id: 'hltennis:' + m.id, sport: 'tennis', league: String(m.tournament || ''), country: '', startsAt: String(m.start_time || m.scheduled_at || m.starts_at || ''), live: true, ended: false,
    state: 'Live' + (pts ? ' ' + pts : '') + (sc.is_tiebreak ? ' (tie-break)' : ''), period: periods.length || null, clock: null, periods,
    extra: { server: sc.server === 1 || sc.server === 2 ? sc.server : null, points: pts, tiebreak: !!sc.is_tiebreak, doubles: !!(m.is_doubles || m.draw === 'doubles') },
    home: { id: String(p1.id || ''), name: nm(p1), short: short(nm(p1)), img: '', score: n(sets[0]) }, away: { id: String(p2.id || ''), name: nm(p2), short: short(nm(p2)), img: '', score: n(sets[1]) } };
}
export function createLiveTennis({ key, base = BASE, fetchImpl = fetch }) {
  async function get(path) {
    const r = await fetchImpl(base + path, { headers: { Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(12000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j && (j.message || j.error)) || 'Live Tennis API error ' + r.status);
    return j;
  }
  async function list() { const j = await get('/matches?status=live&limit=200'); return (Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : []).map(row); }
  async function raw() { const j = await get('/matches?status=live&limit=1'); return { first: Array.isArray(j.data) ? j.data[0] || null : null, keys: Object.keys(j) }; }
  return { list, raw };
}
