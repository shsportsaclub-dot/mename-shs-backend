// Scoring Heroes: provider-first odds / probability display adapter.
// This module never fabricates market odds. Use it at the existing scoreboard slot.
const valid = n => typeof n === 'number' && Number.isFinite(n);
const number = x => x === null || x === undefined || x === '' ? null : (valid(Number(x)) ? Number(x) : null);
const probability = x => { const n=number(x); return n !== null && n >= 0 && n <= 100 ? n : null; };
const market = x => { const n=number(x); return n !== null && n > 1 ? n : null; };
export function oddsOrWinningProbability({ odds, probabilities, home, away } = {}) {
  const h = market(odds?.home), a = market(odds?.away), d = market(odds?.draw);
  // Never mix market odds and model probabilities in the same scoreboard slot.
  if (h !== null && a !== null) return {
    mode: 'odds', source: 'provider', home: h.toFixed(2), away: a.toFixed(2),
    ...(d !== null ? { draw: d.toFixed(2) } : {})
  };
  const hp = probability(probabilities?.home), ap = probability(probabilities?.away);
  const dp = probability(probabilities?.draw);
  if (hp !== null && ap !== null) return {
    mode: 'probability', source: probabilities?.source || 'model',
    home: hp.toFixed(1) + '%', away: ap.toFixed(1) + '%',
    ...(dp !== null ? { draw: dp.toFixed(1) + '%' } : {})
  };
  return { mode: 'unavailable', home: null, away: null };
}
