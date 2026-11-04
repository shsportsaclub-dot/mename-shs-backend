// CricketData (cricapi.com) client: current matches list + per-match scorecard.
export function cricket({ key, base = 'https://api.cricapi.com/v1', log = () => {} }) {
  const get = async (ep, q = {}) => {
    if (!key) throw Object.assign(new Error('CRIC_API_KEY is not set'), { code: 503 });
    const qs = new URLSearchParams({ apikey: key, ...q }).toString();
    const r = await fetch(`${base}/${ep}?${qs}`, { signal: AbortSignal.timeout(10000) });
    const j = await r.json();
    if (j.status !== 'success') throw new Error(j.reason || `CricketData ${ep} failed`);
    return j.data;
  };
  let list = { t: 0, data: [] }, inflight = null;
  async function current(maxAgeMs = 15000) {
    if (Date.now() - list.t < maxAgeMs) return list.data;
    if (inflight) return inflight;
    inflight = (async () => {
      const rows = [];
      for (let page = 0; page < 3; page++) {
        const d = await get('currentMatches', { offset: String(page * 25) });
        const arr = Array.isArray(d) ? d : [];
        const seen = new Set(rows.map(m => m.id));
        const fresh = arr.filter(m => m && m.id && !seen.has(m.id));
        rows.push(...fresh);
        if (arr.length < 25 || !fresh.length) break;
      }
      list = { t: Date.now(), data: rows };
      return rows;
    })();
    try { return await inflight; } finally { inflight = null; }
  }
  async function scorecard(id) {
    const d = await get('match_scorecard', { id });
    return d && typeof d === 'object' ? d : null;
  }
  // Raw call for diagnostics: shows exactly what the provider answered and how long it took.
  async function raw(ep, q = {}) {
    const t = Date.now();
    try {
      const qs = new URLSearchParams({ apikey: key || '', ...q }).toString();
      const r = await fetch(`${base}/${ep}?${qs}`, { signal: AbortSignal.timeout(10000) });
      const j = await r.json().catch(() => null);
      return { ep, http: r.status, ms: Date.now() - t, status: j?.status, reason: j?.reason, info: j?.info, data: j?.data };
    } catch (e) { return { ep, http: 0, ms: Date.now() - t, status: 'network-error', reason: e.message }; }
  }
  return { current, scorecard, raw };
}
