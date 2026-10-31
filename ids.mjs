// Scoring Heroes permanent identities. ONE PLAYER = ONE PERMANENT ID, ONE MATCH = ONE PERMANENT ID.
//   player  SH-P-YYYYMM-NNNNNN   (monthly sequence)
//   match   SH-M-YYYYMMDD-NNNNNN (daily sequence)
// Allocation is one synchronous critical section on a single Node thread: the sequence is advanced, the identity is
// written and the store is saved before the caller sees the ID. A retry with the same key returns the stored ID.
import crypto from 'node:crypto';

const PAD = n => String(n).padStart(6, '0');
export const PLAYER_RE = /^SH-P-\d{6}-\d{6}$/, MATCH_RE = /^SH-M-\d{8}-\d{6}$/;

export function createIds({ db: getDb, save, now = () => Date.now(), tz = 'Asia/Kolkata' }) {
  const R = () => { const db = getDb(); return (db.idReg = db.idReg || { players: {}, matches: {}, ext: [], seq: {}, keys: { player: {}, match: {} }, pub: {}, audit: [] }); };
  const parts = ms => { const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms)); const o = {}; f.forEach(p => { o[p.type] = p.value; }); return o; };
  const audit = (a, id, extra) => { const r = R(); r.audit.push({ t: now(), a, id, ...(extra || {}) }); };
  const nextSeq = (type, period) => { const r = R(), k = type + ':' + period, n = (r.seq[k] || 0) + 1; if (n > 999999) throw new Error('Daily or monthly ID capacity reached'); r.seq[k] = n; return n; };
  const uuid = () => crypto.randomUUID();
  const clean = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

  /** Player key: the mobile number (or email) when known, so one person never gets a second ID in another team, club or academy. */
  const playerKey = ({ phone, email, ref, sport }) => {
    const d = String(phone || '').replace(/\D/g, '');
    if (d.length >= 10) return 'ph:' + d.slice(-10);
    const e = clean(email, 120).toLowerCase(); if (e.includes('@')) return 'em:' + e;
    const r = clean(ref, 80); if (!r) throw new Error('A player needs a mobile number, email or reference');
    return 'ref:' + clean(sport || 'cricket', 20).toLowerCase() + ':' + r;
  };

  function allocPlayer(i) {
    const r = R(), key = playerKey(i), t = now(), ex = r.keys.player[key];
    if (ex) { const p = r.players[ex]; let ch = false; const nm = clean(i.name, 80);
      if (nm && p.player_name !== nm) { p.player_name = nm; ch = true; }
      if (i.verified && p.verification_status !== 'verified') { p.verification_status = 'verified'; ch = true; audit('player_verified', p.public_player_id); }
      if (ch) { p.updated_at = t; save(); } return { ...p, existing: true }; }
    const d = parts(t), period = d.year + d.month, n = nextSeq('player', period), pub = `SH-P-${period}-${PAD(n)}`;
    if (r.pub[pub]) throw new Error('Duplicate public ID blocked');
    const iid = uuid(), p = { internal_player_id: iid, public_player_id: pub, player_name: clean(i.name, 80), registration_date: `${d.year}-${d.month}-${d.day}`, verification_status: i.verified ? 'verified' : 'pending', created_at: t, updated_at: t };
    r.players[iid] = p; r.keys.player[key] = iid; r.pub[pub] = iid; audit('player_issued', pub, { key: key.startsWith('ref:') ? key : key.slice(0, 5) + '***' });
    save(); return { ...p, existing: false };
  }

  function allocMatch(i) {
    const r = R(), sport = clean(i.sport || 'cricket', 20).toLowerCase(), ref = clean(i.ref, 80); if (!ref) throw new Error('A match needs a reference');
    const key = sport + ':' + ref, t = now(), ex = r.keys.match[key];
    if (ex) { const m = r.matches[ex]; let ch = false;
      for (const [k, f] of [['match_status', 'status'], ['scheduled_date', 'scheduled_date'], ['tournament_id', 'tournament_id'], ['season_id', 'season_id']]) { const v = clean(i[f], 60); if (v && m[k] !== v) { m[k] = v; ch = true; } }
      if (ch) { m.updated_at = t; save(); } return { ...m, existing: true }; }   // corrections, rescheduling and status changes never create a new ID
    let at = +i.created; if (!(at > t - 400 * 864e5 && at < t + 864e5)) at = t;
    const d = parts(at), period = d.year + d.month + d.day, n = nextSeq('match', period), pub = `SH-M-${period}-${PAD(n)}`;
    if (r.pub[pub]) throw new Error('Duplicate public ID blocked');
    const iid = uuid(), m = { internal_match_id: iid, public_match_id: pub, sport_id: sport, tournament_id: clean(i.tournament_id, 60), season_id: clean(i.season_id, 60), scheduled_date: clean(i.scheduled_date, 30), match_status: clean(i.status, 20) || 'scheduled', created_at: t, updated_at: t };
    r.matches[iid] = m; r.keys.match[key] = iid; r.pub[pub] = iid; audit('match_issued', pub);
    save(); return { ...m, existing: false };
  }

  /** Mark a match cancelled/abandoned/completed without ever freeing its ID. */
  const matchStatus = (sport, ref, status) => { const r = R(), iid = r.keys.match[clean(sport || 'cricket', 20).toLowerCase() + ':' + clean(ref, 80)]; if (!iid) return null; const m = r.matches[iid]; m.match_status = clean(status, 20) || m.match_status; m.updated_at = now(); audit('match_status', m.public_match_id, { s: m.match_status }); save(); return m; };

  function mapExternal({ entity_type, id, source_provider, external_source_id, external_source_url }) {
    const r = R(), type = entity_type === 'match' ? 'match' : 'player', iid = r.pub[id] || id;
    if (!(type === 'player' ? r.players[iid] : r.matches[iid])) throw new Error('Unknown ' + type + ' ID');
    const prov = clean(source_provider, 40), ext = clean(external_source_id, 120); if (!prov || !ext) throw new Error('Provider and external ID are required');
    const dup = r.ext.find(x => x.source_provider === prov && x.external_source_id === ext && x.entity_type === type);
    if (dup) { if (dup.internal_entity_id !== iid) throw new Error('That external ID already belongs to another ' + type); return dup; }
    const row = { internal_entity_id: iid, entity_type: type, source_provider: prov, external_source_id: ext, external_source_url: clean(external_source_url, 300) };
    r.ext.push(row); audit('external_mapped', type === 'player' ? r.players[iid].public_player_id : r.matches[iid].public_match_id, { p: prov }); save(); return row;
  }

  const lookup = id => { const r = R(), iid = r.pub[id]; if (!iid) return null; return PLAYER_RE.test(id) ? { type: 'player', ...r.players[iid], external: r.ext.filter(x => x.internal_entity_id === iid) } : { type: 'match', ...r.matches[iid], external: r.ext.filter(x => x.internal_entity_id === iid) }; };
  return { allocPlayer, allocMatch, matchStatus, mapExternal, lookup, parts };
}
