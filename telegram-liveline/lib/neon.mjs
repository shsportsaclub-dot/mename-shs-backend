// Neon Postgres over its HTTPS SQL endpoint (no npm package, so the Render build stays "echo ok").
// POST https://<host>/sql  with header Neon-Connection-String and body { query, params }.
// The bot keeps its own table, tg_liveline_state; it never touches the app's tables.
export function neonKV(connectionString, { base, log = () => {} } = {}) {
  if (!connectionString) return null;
  let host;
  try { host = new URL(connectionString).hostname; } catch { return null; }
  const hosts = base ? [base] : [`https://${host}/sql`, ...(host.includes('-pooler') ? [`https://${host.replace('-pooler', '')}/sql`] : [])];
  let good = null;
  async function q(query, params = []) {
    let last;
    for (const u of good ? [good] : hosts) {
      try {
        const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json', 'Neon-Connection-String': connectionString, 'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'false' }, body: JSON.stringify({ query, params }), signal: AbortSignal.timeout(15000) });
        const j = await r.json().catch(() => null);
        if (!r.ok) { last = new Error((j && (j.message || j.error)) || `Neon HTTP ${r.status}`); continue; }
        good = u;
        return j || {};
      } catch (e) { last = e; }
    }
    throw last || new Error('Neon unreachable');
  }
  let ready = null;
  const init = () => (ready ||= q('CREATE TABLE IF NOT EXISTS tg_liveline_state (k text PRIMARY KEY, v text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())').catch(e => { ready = null; throw e; }));
  return {
    async get(k) {
      await init();
      const j = await q('SELECT v FROM tg_liveline_state WHERE k = $1', [k]);
      const row = (j.rows || [])[0];
      return row ? (Array.isArray(row) ? row[0] : row.v) : null;
    },
    async set(k, v) {
      await init();
      await q('INSERT INTO tg_liveline_state (k, v, updated_at) VALUES ($1, $2, now()) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now()', [k, v]);
    },
    endpoint: () => good,
  };
}
