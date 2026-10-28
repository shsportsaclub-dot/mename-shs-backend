// Sportmonks Football API v3 adapter (live scores, fixtures, events, line-ups, statistics).
// Uses its OWN token (FOOTBALL_TOKEN or the admin box) so the cricket provider setting is never touched.
// Field names follow the Sportmonks v3 docs (fixtures, participants[meta.location], scores[description=CURRENT], state, periods, events.type,
// lineups.player, statistics.type). Anything missing is skipped, never invented.
const BASE = 'https://api.sportmonks.com/v3/football';
const STATE = { 1: 'NS', 2: '1H', 3: 'HT', 4: 'BREAK', 5: 'FT', 6: 'ET', 7: 'AET', 8: 'PEN', 9: 'PEN', 10: 'POSTP', 11: 'SUSP', 12: 'CANC', 13: 'TBA', 14: 'WO', 15: 'ABAN', 16: 'DELAY', 17: 'AWARD', 18: 'INT', 21: 'ETBRK', 22: '2H', 23: 'ET2', 25: 'PENBRK' };
const LIVE = new Set(['1H', '2H', 'HT', 'ET', 'ET2', 'ETBRK', 'BREAK', 'PEN', 'PENBRK', 'INT']);
const ENDED = new Set(['FT', 'AET', 'FT_PEN', 'WO', 'AWARD', 'CANC', 'ABAN', 'POSTP']);
const arr = v => Array.isArray(v) ? v : (v && Array.isArray(v.data) ? v.data : []);
const obj = v => (v && v.data && !Array.isArray(v.data) ? v.data : v) || null;
const iso = s => { const t = String(s || '').trim(); if (!t) return ''; const d = new Date(/Z|[+-]\d\d:?\d\d$/.test(t) ? t : t.replace(' ', 'T') + 'Z'); return isNaN(d) ? '' : d.toISOString(); };

export function createFootball({ token, base = BASE, fetchImpl = fetch }) {
  const q = o => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&').replace(/%3B/g, ';').replace(/%2C/g, ',');
  async function get(path, params = {}) {
    const r = await fetchImpl(`${base}/${path}?${q({ ...params, api_token: token })}`, { signal: AbortSignal.timeout(12000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || (j.message && !j.data)) throw new Error(String(j.message || 'Football provider error ' + r.status).slice(0, 200));
    return j.data;
  }
  const side = (f, loc) => arr(f.participants).find(p => p && p.meta && p.meta.location === loc) || null;
  const goalsOf = (f, loc, p) => {
    const rows = arr(f.scores).filter(s => s && String(s.description || '').toUpperCase() === 'CURRENT');
    const hit = rows.find(s => (s.score && s.score.participant === loc) || (p && +s.participant_id === +p.id));
    return hit && hit.score && isFinite(+hit.score.goals) ? +hit.score.goals : (rows.length || f.state_id === 1 ? null : null);
  };
  const stateOf = f => { const s = obj(f.state); const sh = (s && (s.short_name || s.developer_name)) || STATE[f.state_id] || ''; return String(sh).toUpperCase(); };
  const minuteOf = f => { const p = arr(f.periods).find(x => x && x.ticking); if (!p) return null; const m = +p.minutes; return isFinite(m) ? m : null; };
  const team = p => p ? { id: p.id, name: p.name || '', short: p.short_code || String(p.name || '').slice(0, 3).toUpperCase(), img: p.image_path || '' } : { id: 0, name: '', short: '', img: '' };
  function row(f) {
    const H = side(f, 'home'), A = side(f, 'away'), st = stateOf(f), lg = obj(f.league), ct = lg && obj(lg.country);
    return {
      id: 'fb' + f.id, name: f.name || `${(H && H.name) || 'Home'} vs ${(A && A.name) || 'Away'}`,
      league: lg ? lg.name || '' : '', leagueImg: lg ? lg.image_path || '' : '', country: ct ? ct.name || '' : '', round: obj(f.round) ? String(obj(f.round).name || '') : '',
      startsAt: iso(f.starting_at), state: st, live: LIVE.has(st), ended: ENDED.has(st), started: st !== 'NS' && st !== 'TBA' && st !== '',
      minute: minuteOf(f), home: { ...team(H), goals: goalsOf(f, 'home', H) }, away: { ...team(A), goals: goalsOf(f, 'away', A) }
    };
  }
  const kindOf = e => {
    const t = obj(e.type) || {}, n = String(t.developer_name || t.name || e.type_id || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (/OWNGOAL/.test(n)) return 'owngoal'; if (/PENALTYMISSED|MISSEDPENALTY/.test(n)) return 'penmiss'; if (/PENALTY/.test(n) && /GOAL/.test(n)) return 'pengoal';
    if (/GOAL/.test(n)) return 'goal'; if (/YELLOWRED|SECONDYELLOW/.test(n)) return 'yellowred'; if (/YELLOW/.test(n)) return 'yellow'; if (/RED/.test(n)) return 'red';
    if (/SUBST/.test(n)) return 'sub'; if (/VAR/.test(n)) return 'var'; return '';
  };
  function events(f) {
    return arr(f.events).map(e => ({ id: e.id, minute: isFinite(+e.minute) ? +e.minute : null, extra: isFinite(+e.extra_minute) ? +e.extra_minute : null, kind: kindOf(e), teamId: e.participant_id, player: e.player_name || '', related: e.related_player_name || '', result: e.result || '', info: e.info || e.addition || '' }))
      .filter(e => e.kind).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.extra ?? 0) - (b.extra ?? 0) || (a.id ?? 0) - (b.id ?? 0));
  }
  function lineups(f) {
    const by = {}; arr(f.lineups).forEach(l => {
      const pl = obj(l.player) || {}, rec = { id: l.player_id, name: l.player_name || pl.display_name || pl.name || '', number: l.jersey_number ?? null, pos: l.formation_position ?? null, field: l.formation_field || '', img: pl.image_path || '' };
      const k = +l.team_id; (by[k] = by[k] || { starters: [], bench: [] })[+l.type_id === 12 ? 'bench' : 'starters'].push(rec);
    });
    Object.values(by).forEach(t => t.starters.sort((a, b) => (a.pos ?? 99) - (b.pos ?? 99)));
    return by;
  }
  function stats(f) {
    const m = new Map(); arr(f.statistics).forEach(s => {
      const t = obj(s.type) || {}, name = t.name || t.developer_name; if (!name) return; const v = s.data && s.data.value; if (v == null) return;
      const r = m.get(name) || { name, home: null, away: null }; if (s.location === 'home') r.home = v; else if (s.location === 'away') r.away = v; m.set(name, r);
    });
    return [...m.values()].filter(r => r.home != null || r.away != null);
  }
  const INC_LIST = 'participants;scores;state;league.country;periods;round';
  const INC_ONE = 'participants;scores;state;league.country;periods;round;events.type;lineups.player;statistics.type;venue';
  async function list(date) {
    let live = [], day = [];
    try { live = arr(await get('livescores/inplay', { include: INC_LIST })); } catch (e) { if (/token|plan|subscription|authenticat/i.test(e.message)) throw e; }
    if (date) { day = arr(await get('fixtures/date/' + date, { include: INC_LIST })); }
    const seen = new Set(), out = [];
    [...live, ...day].forEach(f => { if (f && f.id && !seen.has(f.id)) { seen.add(f.id); out.push(row(f)); } });
    return out.sort((a, b) => (b.live - a.live) || String(a.startsAt).localeCompare(String(b.startsAt)));
  }
  async function match(id) {
    const n = String(id).replace(/^fb/, '');
    let f; try { f = await get('fixtures/' + n, { include: INC_ONE }); } catch (e) { f = await get('fixtures/' + n, { include: INC_LIST + ';events.type' }); }
    if (!f) throw new Error('Match not found');
    const v = obj(f.venue); return { ...row(f), venue: v ? [v.name, v.city_name].filter(Boolean).join(', ') : '', events: events(f), lineups: lineups(f), stats: stats(f) };
  }
  return { list, match, row };
}
