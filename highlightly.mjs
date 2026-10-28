// Highlightly multi-sport feed (free plan: about 100 requests a day). Turns each sport's /matches list into one simple shape for the app.
// Field names follow the published Highlightly docs (homeTeam / awayTeam / state.description / state.score); anything missing is left out, never guessed.
export const SPORTS = ['football', 'basketball', 'volleyball', 'handball', 'hockey', 'rugby'];
const BASE = 'https://sports.highlightly.net';
const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
const sumArr = a => Array.isArray(a) ? a.reduce((s, x) => s + (num(x) || 0), 0) : null;
export function scoreOf(state) {
  const sc = state && state.score; if (sc == null) return { home: null, away: null };
  if (typeof sc === 'string') return parseCur(sc);
  if (Array.isArray(sc.homeTeam) || Array.isArray(sc.awayTeam)) return { home: sumArr(sc.homeTeam), away: sumArr(sc.awayTeam) };
  if (sc.current != null) return parseCur(sc.current);
  if (sc.homeTeam != null || sc.awayTeam != null) return { home: num(sc.homeTeam), away: num(sc.awayTeam) };
  return { home: null, away: null };
}
function parseCur(s) { const m = /^\s*(\d+)\s*[-:]\s*(\d+)/.exec(String(s)); return m ? { home: +m[1], away: +m[2] } : { home: null, away: null }; }
const LIVE = /progress|half|period|quarter|set|inning|extra|penalt|break|live|overtime|playing/i, DONE = /finish|ended|full time|after|final|awarded|walkover/i;
export function stateOf(state) {
  const d = String((state && (state.description || state.name)) || '');
  if (DONE.test(d) && !/progress/i.test(d)) return { live: false, ended: true, label: d };
  if (LIVE.test(d) && !/schedul|not started/i.test(d)) return { live: true, ended: false, label: d };
  return { live: false, ended: false, label: d || 'Scheduled' };
}
const team = t => t ? { id: t.id != null ? String(t.id) : '', name: String(t.displayName || t.name || ''), short: String(t.abbreviation || t.shortName || ''), img: String(t.logo || '') } : { id: '', name: '', short: '', img: '' };
// Per-period / per-set points when the provider sends them as arrays. Sets sports (volleyball, tennis) show sets won as the main score.
export function periodsOf(state) {
  const sc = state && state.score; if (!sc || !Array.isArray(sc.homeTeam) || !Array.isArray(sc.awayTeam)) return [];
  const n = Math.max(sc.homeTeam.length, sc.awayTeam.length), out = [];
  for (let i = 0; i < n; i++) out.push([num(sc.homeTeam[i]), num(sc.awayTeam[i])]);
  return out;
}
const SETS = new Set(['volleyball', 'tennis']);
export function setsWon(periods) { let h = 0, a = 0; for (const [x, y] of periods) { if (x == null || y == null) continue; if (x > y) h++; else if (y > x) a++; } return { home: h, away: a }; }
export function row(sport, m) {
  const st = stateOf(m.state), sc0 = scoreOf(m.state), pr = periodsOf(m.state), sc = SETS.has(sport) && pr.length ? setsWon(pr) : sc0, lg = m.league && typeof m.league === 'object' ? m.league : { name: m.league };
  return { id: 'hl' + sport + ':' + m.id, sport, league: String(lg.name || ''), country: String((m.country && m.country.name) || ''), startsAt: m.date || '', live: st.live, ended: st.ended, state: st.label,
    period: m.state && m.state.period != null ? m.state.period : null, clock: m.state && m.state.clock != null ? m.state.clock : null,
    periods: periodsOf(m.state),
    home: { ...team(m.homeTeam), score: sc.home }, away: { ...team(m.awayTeam), score: sc.away } };
}
export function createHighlightly({ key, base = BASE, fetchImpl = fetch }) {
  async function get(sport, params) {
    const q = Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    const r = await fetchImpl(`${base}/${sport}/matches?${q}`, { headers: { 'x-rapidapi-key': key }, signal: AbortSignal.timeout(12000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j && (j.message || j.error)) || 'Highlightly error ' + r.status);
    return j;
  }
  async function list(sport, date) {
    if (!SPORTS.includes(sport)) throw new Error('Unknown sport');
    const out = [];
    for (let off = 0; off < 300; off += 100) {   // at most 3 pages
      const j = await get(sport, { date, timezone: 'Etc/UTC', limit: 100, offset: off });
      const d = Array.isArray(j.data) ? j.data : []; out.push(...d.map(m => row(sport, m)));
      if (d.length < 100) break;
    }
    return out;
  }
  // Admin probe for detail endpoints (match / box-score / lineups): returns the raw JSON so the app can be matched to the real shape.
  async function detail(sport, kind, id) {
    if (!SPORTS.includes(sport) || !/^(matches|box-score|lineups)$/.test(kind) || !/^\d{1,12}$/.test(String(id))) throw new Error('Bad request');
    const r = await fetchImpl(`${base}/${sport}/${kind}/${id}`, { headers: { 'x-rapidapi-key': key }, signal: AbortSignal.timeout(12000) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j && (j.message || j.error)) || 'Highlightly error ' + r.status); return j;
  }
  async function raw(sport, date) { const j = await get(sport, { date, timezone: 'Etc/UTC', limit: 2 }); return { plan: j.plan || null, pagination: j.pagination || null, first: Array.isArray(j.data) ? j.data[0] || null : null }; }
  return { list, raw, detail };
}
