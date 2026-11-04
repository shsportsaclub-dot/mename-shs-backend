// Free, key-less live scores for football (soccer) and rugby from ESPN's public scoreboard JSON (site.api.espn.com). Used when no Highlightly key is set (or it fails).
// The rows have the same shape as highlightly.mjs so the app needs no change. The JSON shape used: events[].competitions[0].competitors[] { homeAway, score, team{id,displayName,shortDisplayName,abbreviation,logo} }, status.type { state: pre|in|post, shortDetail }, status.displayClock / period.
const BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const FEEDS = {
  football: ['soccer/eng.1', 'soccer/esp.1', 'soccer/ger.1', 'soccer/ita.1', 'soccer/fra.1', 'soccer/uefa.champions', 'soccer/uefa.europa', 'soccer/usa.1', 'soccer/ind.1', 'soccer/fifa.world', 'soccer/conmebol.libertadores'],
  rugby: ['rugby','rugby/289234', 'rugby/180659', 'rugby/242041', 'rugby/267979', 'rugby/164205', 'rugby/270557']   // league ids: Six Nations, Rugby Championship, Premiership, Top 14, URC, Super Rugby etc.; ids that return nothing are skipped
};
const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
export function row(sport, ev, leagueName = '') {
  const c = ev && ev.competitions && ev.competitions[0]; if (!c || !Array.isArray(c.competitors)) return null;
  const h = c.competitors.find(x => x.homeAway === 'home') || c.competitors[0], a = c.competitors.find(x => x.homeAway === 'away') || c.competitors[1]; if (!h || !a) return null;
  const st = (ev.status || c.status || {}), ty = st.type || {}, state = String(ty.state || ''), live = state === 'in', ended = state === 'post' || ty.completed === true;
  const tm = x => { const t = x.team || {}; return { id: String(t.id || ''), name: String(t.displayName || t.name || ''), short: String(t.abbreviation || t.shortDisplayName || t.name || ''), img: String(t.logo || ''), score: num(x.score) }; };
  return { id: 'espn' + sport + ':' + ev.id, sport, league: String(leagueName || (ev.league && ev.league.name) || ''), country: '', startsAt: ev.date || '', live, ended,
    state: live ? String(ty.shortDetail || ty.detail || 'Live') : ended ? String(ty.shortDetail || 'Full time') : String(ty.shortDetail || 'Scheduled'),
    period: num(st.period), clock: live && st.displayClock ? String(st.displayClock) : null, periods: [], home: tm(h), away: tm(a) };
}
export function createEspn({ fetchImpl = fetch, base = BASE } = {}) {
  async function one(path, sport) {
    const r = await fetchImpl(base + '/' + path + '/scoreboard', { signal: AbortSignal.timeout(9000) });
    if (!r.ok) return []; const j = await r.json().catch(() => null); if (!j) return [];
    const ln = (j.leagues && j.leagues[0] && j.leagues[0].name) || '';
    return (Array.isArray(j.events) ? j.events : []).map(e => row(sport, e, ln)).filter(Boolean);
  }
  async function list(sport) {
    const feeds = FEEDS[sport]; if (!feeds) throw new Error('Unknown sport');
    const res = await Promise.all(feeds.map(p => one(p, sport).catch(() => [])));
    const seen = new Set(), out = []; for (const m of res.flat()) { if (seen.has(m.id)) continue; seen.add(m.id); out.push(m); }
    out.sort((x, y) => (y.live - x.live) || String(x.startsAt).localeCompare(String(y.startsAt)));
    return out;
  }
  return { list };
}
export const ESPN_SPORTS = Object.keys(FEEDS);
