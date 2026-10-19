// Poll scoring: only answers the provider's own final figures can prove. No guessing; a poll that cannot be proven stays unscored.
export const POLL_POINTS = 10;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
/** match: {status, score:[{r,w,o}], ended}; scorecard: provider scorecard array or null; opts: {winner:[..], ...} */
export function answersFrom(match, scorecard, opts = {}) {
  const out = {}; if (!match || !match.ended) return out;
  const st = norm(match.status), inns = (match.score || []).filter(s => s && s.r != null);
  const winOpts = opts.winner || [];
  if (winOpts.length === 2 && / won /.test(' ' + st + ' ') && !/(tied|no result|abandon|draw)/.test(st)) {
    const hit = winOpts.filter(o => st.includes(norm(o)) && st.indexOf(norm(o)) < st.indexOf(' won '));
    if (hit.length === 1) out.winner = hit[0];
  }
  if (inns.length >= 2 && inns.every(s => Number.isFinite(+s.r))) out.big = inns.some(s => +s.r >= 200) ? 'Yes' : 'No';
  if (Array.isArray(scorecard) && scorecard.length && scorecard.length >= inns.length && inns.length >= 2) {
    const rows = scorecard.flatMap(i => i.batting || []);
    if (rows.length && rows.every(b => Number.isFinite(+b.r))) out.century = rows.some(b => +b.r >= 100) ? 'Yes' : 'No';
  }
  return out;
}
/** polls: db.polls, res: db.pollRes, users: db.users -> ranked list of signed-in voters */
export function board(polls = {}, res = {}, users = {}) {
  const t = {};
  for (const [mid, ans] of Object.entries(res)) for (const [k, a] of Object.entries(ans || {})) {
    if (k === 'at') continue; const p = polls[mid] && polls[mid][k]; if (!p) continue;
    for (const [v, o] of Object.entries(p.votes || {})) {
      const x = t[v] || (t[v] = { pts: 0, ok: 0, n: 0 }); x.n++; if (o === a) { x.ok++; x.pts += POLL_POINTS; }
    }
  }
  const named = Object.entries(t).filter(([v]) => v.startsWith('u:') && users[v.slice(2)]).map(([v, x]) => ({ name: users[v.slice(2)].nick || users[v.slice(2)].name || 'Fan', ...x, voter: v }));
  named.sort((a, b) => b.pts - a.pts || b.ok - a.ok || a.n - b.n || a.name.localeCompare(b.name));
  return { top: named.slice(0, 20).map(({ voter, ...x }, i) => ({ rank: i + 1, ...x })), rank: v => { const i = named.findIndex(x => x.voter === v); return i < 0 ? null : i + 1 }, all: t };
}
