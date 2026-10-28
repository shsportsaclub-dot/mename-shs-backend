// Live Tennis API feed (free plan: 100 requests/day, 30/min). Base URL, auth header, GET /matches?status=live, the {data:[...]} envelope and the score shape
// (players.p1/p2.name, score.sets, score.games player-major, score.points, score.server) come from the provider's published client docs. Anything missing is left out.
const BASE = 'https://api.livetennisapi.com/api/public/v1';
const n = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
const nm = p => String((p && (p.name || p.full_name || p.display_name)) || '');
const short = s => { const w = s.trim().split(/\s+/); return w.length > 1 ? w[w.length - 1] : s; };
export function row(m) {
  const pl = m.players || {}, p1 = pl.p1 || m.p1 || {}, p2 = pl.p2 || m.p2 || {}, sc = m.score && typeof m.score === 'object' ? m.score : {};
  const raw = sc.games ?? m.games ?? sc.set_scores ?? sc.setScores ?? m.set_scores ?? null, sraw = sc.sets ?? m.sets ?? null, periods = [];
  const pair = x => Array.isArray(x) ? [n(x[0]), n(x[1])] : x && typeof x === 'object' ? [n(x.p1 ?? x.home ?? x.a ?? x[1]), n(x.p2 ?? x.away ?? x.b ?? x[2])] : null;
  if (Array.isArray(raw) && raw.length === 2 && Array.isArray(raw[0]) && Array.isArray(raw[1])) {   // player-major: [[6,3],[4,6]]
    const len = Math.max(raw[0].length, raw[1].length); for (let i = 0; i < len; i++) periods.push([n(raw[0][i]), n(raw[1][i])]);
  } else if (Array.isArray(raw)) { for (const x of raw) { const q = pair(x); if (q) periods.push(q); } }     // set-major: [[6,4],[3,6]] or [{p1,p2}]
  else if (Array.isArray(sraw) && sraw.length && typeof sraw[0] === 'object') { for (const x of sraw) { const q = pair(x); if (q) periods.push(q); } }
  const sets = Array.isArray(sraw) && sraw.every(v => typeof v !== 'object' || v == null) ? sraw : null;
  const done = periods.slice(0, -1).filter(q => q[0] != null && q[1] != null), calc = [done.filter(q => q[0] > q[1]).length, done.filter(q => q[1] > q[0]).length], won = sets ? [n(sets[0]), n(sets[1])] : periods.length ? calc : [null, null];
  const pts = sc.points != null && sc.points !== '' ? String(sc.points) : '';
  return { id: 'hltennis:' + m.id, sport: 'tennis', league: String(m.tournament || ''), country: '', startsAt: String(m.start_time || m.scheduled_at || m.starts_at || ''), live: true, ended: false,
    state: 'Live' + (pts ? ' ' + pts : '') + (sc.is_tiebreak ? ' (tie-break)' : ''), period: periods.length || null, clock: null, periods,
    extra: { server: sc.server === 1 || sc.server === 2 ? sc.server : null, points: pts, tiebreak: !!sc.is_tiebreak, doubles: !!(m.is_doubles || m.draw === 'doubles') },
    home: { id: String(p1.id || ''), name: nm(p1), short: short(nm(p1)), img: '', score: won[0] }, away: { id: String(p2.id || ''), name: nm(p2), short: short(nm(p2)), img: '', score: won[1] } };
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
