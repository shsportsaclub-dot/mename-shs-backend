// Sportmonks Cricket API v2 adapter. Turned on only when SPORTMONKS_TOKEN is set (CRIC_PROVIDER=sportmonks).
// It converts Sportmonks fixtures into the same shapes the app already reads from CricketData, and adds the extras
// CricketData does not send: umpires, referee, player of the match, playing XI, fall of wickets, ball by ball.
//
// What is verified from the Sportmonks docs: the fixture fields (first_umpire_id, second_umpire_id, tv_umpire_id, referee_id,
// man_of_match_id, toss_won_team_id, winner_team_id, elected, note, status, round, type, starting_at, venue_id), the include names
// (balls, runs, bowling, batting, lineup, venue, localteam, visitorteam, firstumpire, secondumpire, tvumpire, referee, manofmatch, tosswon),
// scoreboards S1..S4, batting rows (score, ball, four_x, six_x, player, team), bowling rows (runs, wickets, overs, player, team),
// runs rows (inning matches scoreboard) and the score resource (name, runs, four, six, bye, leg_bye, noball, is_wicket, out).
// Everything else is read defensively: if a field is missing the item is simply left out. Use the admin "Provider probe" to see real field names.
const BASE = 'https://cricket.sportmonks.com/api/v2.0';

export function createSportmonks({ token, base = BASE, fetchImpl = fetch }) {
  const q = o => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&').replace(/%2C/g, ',').replace(/%5B/g, '[').replace(/%5D/g, ']');
  async function get(path, params = {}) {
    const url = `${base}/${path}?${q({ ...params, api_token: token })}`;
    const r = await fetchImpl(url), j = await r.json().catch(() => ({}));
    if (!r.ok || j.error || j.message && !j.data) throw new Error((j.error && (j.error.message || j.error)) || j.message || 'Sportmonks error ' + r.status);
    return j.data;
  }
  const arr = v => Array.isArray(v) ? v : (v && Array.isArray(v.data) ? v.data : (v ? [v] : []));
  const obj = v => (v && v.data && !Array.isArray(v.data) ? v.data : v) || null;
  const nm = o => { o = obj(o); return o ? String(o.fullname || o.name || [o.firstname, o.lastname].filter(Boolean).join(' ') || '') : ''; };
  const ENDED = /^(finished|aban|cancl|no result|completed)/i, NOT_STARTED = /^(ns|postp|cancl|delayed)/i;
  const lc = s => String(s || '').toLowerCase();
  const teamOf = (f, id) => [obj(f.localteam), obj(f.visitorteam)].find(t => t && +t.id === +id) || null;
  const tinfo = t => t ? { name: t.name || '', short: t.code || String(t.name || '').slice(0, 3).toUpperCase(), img: t.image_path || '' } : { name: '', short: '', img: '' };
  const venueText = f => { const v = obj(f.venue); return v ? [v.name, v.city].filter(Boolean).join(', ') : ''; };

  function scoreRows(f) {
    const n = new Map();
    return arr(f.runs).map(r => {
      const t = obj(r.team) || teamOf(f, r.team_id), c = (n.get(r.team_id) || 0) + 1; n.set(r.team_id, c);
      return { inning: `${(t && t.name) || 'Team'} Inning ${c}`, r: +r.score, w: +r.wickets, o: +r.overs };
    }).filter(x => isFinite(x.r));
  }
  function matchRow(f) {
    const L = obj(f.localteam), V = obj(f.visitorteam), st = String(f.status || ''), type = lc(f.type);
    return {
      id: 'sm' + f.id, name: `${(L && L.name) || 'Home'} vs ${(V && V.name) || 'Away'}${f.round ? ', ' + f.round : ''}`, type,
      status: f.note || st, venue: venueText(f), date: String(f.starting_at || '').slice(0, 10), time: String(f.starting_at || '').slice(0, 19),
      started: !!st && !NOT_STARTED.test(st), ended: ENDED.test(st), teams: [tinfo(L), tinfo(V)], score: scoreRows(f)
    };
  }
  async function liveMatches() {
    const d = new Date(), iso = x => new Date(x).toISOString().slice(0, 10), from = iso(d - 4 * 864e5), to = iso(+d + 10 * 864e5);
    const rows = [];
    for (let page = 1; page <= 3; page++) {
      const j = await get('fixtures', { 'filter[starts_between]': from + ',' + to, include: 'localteam,visitorteam,runs,venue', sort: '-starting_at', page });
      rows.push(...arr(j));
      if (arr(j).length < 50) break;
    }
    return rows.map(matchRow);
  }
  async function matchInfo(id) {
    const f = await get('fixtures/' + id, { include: 'localteam,visitorteam,venue,firstumpire,secondumpire,tvumpire,referee,manofmatch,tosswon' });
    const win = f.winner_team_id ? teamOf(f, f.winner_team_id) : null, tw = obj(f.tosswon) || (f.toss_won_team_id ? teamOf(f, f.toss_won_team_id) : null);
    return {
      id: 'sm' + f.id, name: matchRow(f).name, matchType: lc(f.type), status: f.note || f.status, venue: venueText(f), dateTimeGMT: String(f.starting_at || '').slice(0, 19),
      tossWinner: tw ? tw.name : '', tossChoice: f.elected || '', matchWinner: win ? win.name : '', note: f.note || '',
      umpires: [nm(f.firstumpire), nm(f.secondumpire)].filter(Boolean), thirdUmpire: nm(f.tvumpire), referee: nm(f.referee),
      playerOfTheMatch: nm(f.manofmatch), round: f.round || '', superOver: !!f.super_over, followOn: !!f.follow_on
    };
  }
  const oversToBalls = o => { const [a, b] = String(o).split('.'); return (+a || 0) * 6 + (+b || 0); };
  async function scorecard(id) {
    const f = await get('fixtures/' + id, { include: 'localteam,visitorteam,runs,batting.batsman,bowling.bowler,lineup' });
    const bats = arr(f.batting), bowls = arr(f.bowling), runs = arr(f.runs), by = {};
    const key = x => String(x.scoreboard || 'S1');
    bats.forEach(b => (by[key(b)] = by[key(b)] || { bat: [], bowl: [] }).bat.push(b));
    bowls.forEach(b => (by[key(b)] = by[key(b)] || { bat: [], bowl: [] }).bowl.push(b));
    const keys = Object.keys(by).sort();
    const out = keys.map((k, i) => {
      const g = by[k], team = teamOf(f, (g.bat[0] || {}).team_id) || teamOf(f, (runs[i] || {}).team_id), tname = (team && team.name) || 'Team';
      const sorted = g.bat.slice().sort((a, b) => (+a.sort || 0) - (+b.sort || 0));
      const batting = sorted.map(b => {
        const p = obj(b.batsman) || {}, res = obj(b.result), out = b.active ? 'batting' : (b.fow_score != null || res || b.batsmanout_id || b.bowling_player_id ? (res && res.name) || 'out' : 'not out');
        return { batsman: { id: String(b.player_id || p.id || ''), name: nm(p) || 'Player ' + (b.player_id || '') }, r: +b.score || 0, b: +b.ball || 0, '4s': +b.four_x || 0, '6s': +b.six_x || 0, sr: b.rate != null ? +b.rate : (+b.ball ? +((+b.score || 0) * 100 / b.ball).toFixed(2) : 0), 'dismissal-text': out };
      });
      const bowling = g.bowl.map(b => { const p = obj(b.bowler) || {}; return { bowler: { id: String(b.player_id || p.id || ''), name: nm(p) || 'Player ' + (b.player_id || '') }, o: +b.overs || 0, m: +b.medians || 0, r: +b.runs || 0, w: +b.wickets || 0, nb: +b.noball || 0, wd: +b.wide || 0, eco: b.rate != null ? +b.rate : (oversToBalls(b.overs) ? +((+b.runs || 0) * 6 / oversToBalls(b.overs)).toFixed(2) : 0) }; });
      const fow = g.bat.filter(b => b.fow_score != null).sort((a, b) => +a.fow_score - +b.fow_score).map((b, n) => { const p = obj(b.batsman) || {}; return { r: +b.fow_score, w: n + 1, player: nm(p), over: b.fow_balls != null ? String(b.fow_balls) : '' }; });
      const inn = { inning: `${tname} Inning 1`, batting, bowling };
      if (fow.length) inn.fow = fow;
      return inn;
    });
    return { scorecard: out };
  }
  async function squad(id) {
    const f = await get('fixtures/' + id, { include: 'localteam,visitorteam,lineup.player' });
    const L = arr(f.lineup), teams = [obj(f.localteam), obj(f.visitorteam)].filter(Boolean);
    return teams.map(t => ({ teamName: t.name, shortname: t.code || String(t.name).slice(0, 3).toUpperCase(), img: t.image_path || '',
      players: L.filter(x => +x.team_id === +t.id || (x.lineup && +x.lineup.team_id === +t.id)).map(x => { const p = obj(x.player) || x; const l = x.lineup || {};
        return { id: String(x.id || p.id || ''), name: nm(p) || 'Player', role: ((p.position && p.position.name) || '') + (l.captain ? ' (c)' : '') + (l.wicketkeeper ? ' (wk)' : ''), playerImg: p.image_path || '', playing: !(l.substitution === true), isPlaying: !(l.substitution === true) }; }) }));
  }
  async function bbb(id) {
    const attempts = ['balls.score,balls.batsman,balls.bowler', 'balls.score', 'balls'];
    let f = null, last = null;
    for (const inc of attempts) { try { f = await get('fixtures/' + id, { include: inc }); break; } catch (e) { last = e; } }
    if (!f) throw last || new Error('No ball by ball');
    return arr(f.balls).map(b => { const s = obj(b.score) || {}, runs = s.runs != null ? s.runs : b.runs;
      return { over: b.over != null ? b.over : (b.ball != null ? Math.floor(+b.ball) : undefined), ball: b.ball != null ? Math.round((+b.ball % 1) * 10) : undefined, runs: runs != null ? runs + (+s.bye || 0) + (+s.leg_bye || 0) + (+s.noball_runs || 0) : undefined, wicket: !!(s.is_wicket || s.out), commentary: [s.name, nm(b.bowler) && nm(b.batsman) ? nm(b.bowler) + ' to ' + nm(b.batsman) : ''].filter(Boolean).join(': '), batsman: nm(b.batsman), bowler: nm(b.bowler) }; });
  }
  async function player(id) {
    const p = await get('players/' + id, { include: 'country' });
    const c = obj(p.country);
    return { id: String(p.id), name: nm(p), country: c ? c.name : '', dateOfBirth: p.dateofbirth || '', placeOfBirth: '', role: (p.position && p.position.name) || '', battingStyle: p.battingstyle || '', bowlingStyle: p.bowlingstyle || '', playerImg: p.image_path || '', stats: [] };
  }
  async function probe(id) {
    const f = await get('fixtures/' + id, { include: 'localteam,visitorteam,runs,venue,firstumpire,referee,manofmatch,tosswon,batting.batsman,bowling.bowler,lineup.player,balls' });
    const shape = (v, d = 0) => v == null ? 'null' : Array.isArray(v) ? (v.length ? `[${v.length}] ` + (d < 3 ? shape(v[0], d + 1) : '') : '[]') : typeof v === 'object' ? (d > 3 ? '{…}' : '{' + Object.entries(v).slice(0, 40).map(([k, x]) => k + ':' + shape(x, d + 1)).join(', ') + '}') : typeof v;
    return { fixture: shape(f) };
  }
  return { liveMatches, matchInfo, scorecard, squad, bbb, player, probe, matchRow, get };
}
