// Recently finished matches from Cricsheet (open data, Open Data Commons Attribution).
// The live provider often has no ball by ball, officials, fall of wickets or partnerships for a finished match.
// Cricsheet publishes ball by ball for finished matches; this keeps the last weeks of them so the match page can fill the gaps.
// Nothing is guessed: a match is used only when both teams and the date identify exactly one record.
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { zipEntries, zipRead, factsOf, sameTeamName, dayShift } from './history.mjs';

export const RECENT_SOURCE = 'Cricsheet (open data, ODC-By)';
export const RECENT_URL = 'https://cricsheet.org/downloads/recently_added_7_json.zip';
export const RECENT_URL_30 = 'https://cricsheet.org/downloads/recently_added_30_json.zip';

const isLegal = d => !(d.extras && (d.extras.wides > 0 || d.extras.noballs > 0));

// Ball by ball in the shape the match page reads: inning (1-based, in batting order), over (0-based), ball (1..6), runs, wicket, wide, noball, names, text
export function buildBbb(raw) {
  const out = [];
  (raw.innings || []).forEach((inn, ii) => {
    if (inn.super_over) return;
    for (const ov of inn.overs || []) {
      let legal = 0;
      for (const d of ov.deliveries || []) {
        const ex = d.extras || {}, rr = d.runs || {}, lg = isLegal(d);
        const ball = Math.min(6, lg ? legal + 1 : Math.max(1, legal));
        if (lg) legal++;
        const w = (d.wickets || [])[0];
        out.push({ inning: ii + 1, team: inn.team, over: ov.over, ball, runs: rr.total || 0, total_runs: rr.total || 0, bruns: rr.batter || 0, wicket: !!w, wide: ex.wides > 0, noball: ex.noballs > 0, xtype: ex.byes > 0 ? 'b' : ex.legbyes > 0 ? 'lb' : '', batsman: d.batter, bowler: d.bowler,
          ...(w ? { out: w.player_out, kind: w.kind, fielder: (w.fielders || []).map(x => x.name).filter(Boolean).join(', ') } : {}) });   // the match page's own commentary engine writes the text from these facts
      }
    }
  });
  return out;
}

// Fall of wickets per innings: { w, r (team score when it fell), player, over ("o.b") }
export function buildFow(raw) {
  return (raw.innings || []).map(inn => {
    const fow = []; let runs = 0, wk = 0;
    for (const ov of inn.overs || []) {
      let legal = 0;
      for (const d of ov.deliveries || []) {
        runs += (d.runs && d.runs.total) || 0;
        const lg = isLegal(d); if (lg) legal++;
        for (const w of d.wickets || []) { wk++; fow.push({ w: wk, r: runs, player: w.player_out, over: ov.over + '.' + Math.max(1, legal) }); }
      }
    }
    return { team: inn.team, super_over: !!inn.super_over, fow };
  });
}

// Partnerships: the runs and balls between one wicket and the next, with the batters seen at the crease
export function buildPartnerships(raw) {
  return (raw.innings || []).map(inn => {
    const P = []; let cur = null;
    const open = () => (cur = { batsmen: [], runs: 0, balls: 0 });
    open();
    for (const ov of inn.overs || []) for (const d of ov.deliveries || []) {
      for (const b of [d.batter, d.non_striker]) if (b && !cur.batsmen.includes(b)) cur.batsmen.push(b);
      cur.runs += (d.runs && d.runs.total) || 0;
      if (!(d.extras && d.extras.wides > 0)) cur.balls++;
      if (d.wickets && d.wickets.length) { P.push(cur); open(); }
    }
    if (cur.balls > 0) P.push({ ...cur, open: true });
    return { team: inn.team, super_over: !!inn.super_over, partnerships: P.map(x => ({ batsmen: x.batsmen.slice(0, 3), runs: x.runs, balls: x.balls, notOut: !!x.open })) };
  });
}

// total runs and wickets of each innings, to check a Cricsheet innings really is the one on the provider's scorecard
export function inningsTotals(raw) {
  return (raw.innings || []).map(inn => { let r = 0, w = 0; for (const ov of inn.overs || []) for (const d of ov.deliveries || []) { r += (d.runs && d.runs.total) || 0; w += (d.wickets || []).length; } return { team: inn.team, super_over: !!inn.super_over, r, w }; });
}

export function createRecent({ dir, log = console.log, keepDays = 45 }) {
  fs.mkdirSync(dir, { recursive: true });
  const FILE = path.join(dir, 'recent.json');
  let rows = [];                                        // [{ id, d, tm, raw }]
  const st = { last: 0, ok: null, note: 'not run yet', matches: 0 };
  try { rows = JSON.parse(fs.readFileSync(FILE, 'utf8')); st.matches = rows.length; st.note = 'loaded from disk'; } catch { rows = []; }

  const find = (a, b, date) => {
    if (!a || !b || !/^\d{4}-\d\d-\d\d$/.test(String(date || ''))) return null;
    const ds = [dayShift(date, -1), date, dayShift(date, 1)];
    const L = rows.filter(r => ds.includes(String(r.d)) && r.tm.length >= 2 && ((sameTeamName(r.tm[0], a) && sameTeamName(r.tm[1], b)) || (sameTeamName(r.tm[0], b) && sameTeamName(r.tm[1], a))));
    return L.length === 1 ? L[0] : null;
  };
  const facts = r => {
    const i = r.raw.info || {}, f = factsOf(i, 9999);
    return { ...f, pom: i.player_of_match || [], teams: i.teams || [] };
  };

  async function refresh({ url = RECENT_URL, file } = {}) {
    st.last = Date.now(); let tmp = '', fd = -1;
    try {
      let zp = file;
      if (!zp) {
        tmp = path.join(dir, 'recent.tmp.zip');
        const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
        if (!r.ok || !r.body) throw new Error('Download failed: HTTP ' + r.status);
        await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp)); zp = tmp;
      }
      fd = fs.openSync(zp, 'r');
      const map = new Map(rows.map(r => [r.id, r]));
      let added = 0;
      for (const e of zipEntries(fd).filter(e => /\.json$/i.test(e.name) && !/readme/i.test(e.name))) {
        try {
          const j = JSON.parse(zipRead(fd, e).toString('utf8')), i = j.info;
          if (!i || !Array.isArray(i.teams) || !Array.isArray(j.innings) || !i.dates || !i.dates[0]) continue;
          const id = path.basename(e.name, '.json');
          if (!map.has(id)) added++;
          map.set(id, { id, d: i.dates[0], tm: i.teams.slice(0, 2), raw: { info: i, innings: j.innings } });
        } catch { /* skip unreadable file */ }
      }
      const cut = dayShift(new Date().toISOString().slice(0, 10), -keepDays);
      rows = [...map.values()].filter(r => String(r.d) >= cut).sort((a, b) => String(b.d).localeCompare(String(a.d)));
      fs.writeFileSync(FILE + '.tmp', JSON.stringify(rows)); fs.renameSync(FILE + '.tmp', FILE);
      Object.assign(st, { ok: true, note: 'added ' + added + ', keeping ' + rows.length, matches: rows.length });
    } catch (e) { Object.assign(st, { ok: false, note: String(e.message).slice(0, 200) }); log('recent open data failed: ' + e.message); }
    finally { if (fd >= 0) try { fs.closeSync(fd); } catch {} if (tmp) try { fs.unlinkSync(tmp); } catch {} }
    return st;
  }
  return { find, facts, refresh, status: () => ({ ...st }), size: () => rows.length };
}
