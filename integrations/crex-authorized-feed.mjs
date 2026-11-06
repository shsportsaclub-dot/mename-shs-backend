// Scoring Heroes — CREX authorized-feed adapter (ESM).
// This module does NOT reverse-engineer CREX, bypass app controls, or scrape private endpoints.
// Activate only after CREX supplies a licensed feed URL and access credentials.
// Expected feed response: {matches:[{id,team1,team2,deliveries:[...]}]} or {data:[...]}.
// Preserve source IDs and player/team names; never invent deliveries.
const required = (v, label) => { if (!v) throw new Error(label + ' not configured'); return v; };
const str = v => v == null ? '' : String(v).trim();
const num = v => v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
export function normalizeCrexDelivery(raw, matchId) {
  if (!raw || typeof raw !== 'object') return null;
  const ballId = str(raw.deliveryId ?? raw.ballId ?? raw.id);
  const over = num(raw.over ?? raw.overNumber);
  const ball = num(raw.ball ?? raw.ballNumber);
  const innings = num(raw.innings ?? raw.inning);
  if (!ballId && (over === null || ball === null || innings === null)) return null;
  return {
    source: 'crex-authorized', matchId: str(matchId),
    deliveryId: ballId || [innings, over, ball].join('.'),
    innings, over, ball,
    battingTeam: str(raw.battingTeam ?? raw.batting_team),
    bowlingTeam: str(raw.bowlingTeam ?? raw.bowling_team),
    batter: str(raw.batter ?? raw.batsman ?? raw.striker),
    bowler: str(raw.bowler),
    runs: num(raw.runs ?? raw.totalRuns),
    batterRuns: num(raw.batterRuns ?? raw.batsmanRuns),
    extras: num(raw.extras),
    wicket: raw.wicket === true || raw.isWicket === true,
    dismissal: str(raw.dismissal ?? raw.wicketType),
    commentary: str(raw.commentary ?? raw.text),
    timestamp: str(raw.timestamp ?? raw.updatedAt),
    verified: true
  };
}
export function createCrexAuthorizedFeed({feedUrl = process.env.CREX_LICENSED_FEED_URL, token = process.env.CREX_LICENSED_FEED_TOKEN, fetchImpl = fetch} = {}) {
  const cache = new Map();
  async function getMatch(matchId) {
    required(feedUrl, 'CREX_LICENSED_FEED_URL');
    const url = new URL(feedUrl);
    if (url.protocol !== 'https:') throw new Error('Licensed feed requires HTTPS');
    // Prevent arbitrary destination substitution by callers: feed URL is operator-configured.
    url.searchParams.set('matchId', str(matchId));
    const headers = {'accept':'application/json'};
    if (token) headers.authorization = 'Bearer ' + token;
    const res = await fetchImpl(url, {headers, signal: AbortSignal.timeout(12000)});
    if (!res.ok) throw new Error('CREX authorized feed HTTP ' + res.status);
    const payload = await res.json();
    const match = payload.match ?? payload.data ?? payload;
    const rows = Array.isArray(match.deliveries) ? match.deliveries : Array.isArray(match.balls) ? match.balls : [];
    const deliveries = [];
    for (const raw of rows) {
      const d = normalizeCrexDelivery(raw, matchId);
      if (!d) continue;
      const key = str(matchId) + ':' + d.deliveryId;
      const previous = cache.get(key);
      if (previous === JSON.stringify(d)) continue;
      cache.set(key, JSON.stringify(d));
      deliveries.push(d);
    }
    if (cache.size > 10000) cache.clear();
    return {
      source: 'crex-authorized', matchId: str(matchId),
      teams: [str(match.team1 ?? match.homeTeam), str(match.team2 ?? match.awayTeam)].filter(Boolean),
      deliveries, dataAvailable: rows.length > 0, fetchedAt: new Date().toISOString()
    };
  }
  return {getMatch};
}
