// Scoring Heroes history store: imports Cricsheet-format ball-by-ball JSON (a zip) and keeps
//  - a compact match index (matches.ndjson)
//  - career totals for every player (players.json), per format and overall
// Zero dependencies. Source and licence: see HISTORY_SOURCE / HISTORY_LICENCE below.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const HISTORY_SOURCE = 'Cricsheet (cricsheet.org) ball-by-ball JSON';
export const HISTORY_LICENCE = 'Cricsheet data is published with attribution requirements. VERIFY the current licence text on cricsheet.org before public release.';

// ---------- minimal zip reader (central directory, stored or deflate) ----------
export function zipEntries(fd) {
  const size = fs.fstatSync(fd).size;
  const tailLen = Math.min(size, 65557), tail = Buffer.alloc(tailLen);
  fs.readSync(fd, tail, 0, tailLen, size - tailLen);
  let e = -1;
  for (let i = tailLen - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('Not a zip file');
  const total = tail.readUInt16LE(e + 10), cdSize = tail.readUInt32LE(e + 12), cdOff = tail.readUInt32LE(e + 16);
  if (total === 0xffff || cdOff === 0xffffffff || cdSize === 0xffffffff) throw new Error('Zip64 archives are not supported');
  const cd = Buffer.alloc(cdSize);
  fs.readSync(fd, cd, 0, cdSize, cdOff);
  const out = [];
  for (let p = 0, n = 0; n < total && p + 46 <= cd.length; n++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt zip directory');
    const method = cd.readUInt16LE(p + 10), csize = cd.readUInt32LE(p + 20), usize = cd.readUInt32LE(p + 24);
    const nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32), off = cd.readUInt32LE(p + 42);
    out.push({ name: cd.toString('utf8', p + 46, p + 46 + nl), method, csize, usize, off });
    p += 46 + nl + xl + cl;
  }
  return out;
}
export function zipRead(fd, ent) {
  const h = Buffer.alloc(30);
  fs.readSync(fd, h, 0, 30, ent.off);
  if (h.readUInt32LE(0) !== 0x04034b50) throw new Error('Corrupt zip entry');
  const start = ent.off + 30 + h.readUInt16LE(26) + h.readUInt16LE(28);
  const buf = Buffer.alloc(ent.csize);
  fs.readSync(fd, buf, 0, ent.csize, start);
  return ent.method === 0 ? buf : zlib.inflateRawSync(buf);
}

// ---------- per-match processing ----------
const WK_BOWLER = new Set(['bowled', 'caught', 'lbw', 'stumped', 'caught and bowled', 'hit wicket']);
const FMT = t => String(t || 'Other');
const blank = () => ({ m: 0, bi: 0, r: 0, b: 0, f4: 0, f6: 0, no: 0, hs: 0, hsn: 0, n50: 0, n100: 0, bo: 0, bb: 0, br: 0, w: 0, w5: 0, bw: '', ct: 0, st: 0, ro: 0 });
const newPlayer = (id, name) => ({ id, n: name, all: blank(), f: {}, y0: 9999, y1: 0, teams: {} });
const slot = (p, fmt) => p.f[fmt] || (p.f[fmt] = blank());

function bestBetter(w, r, cur) { // cur like "5/23"; higher wickets then fewer runs
  if (!cur) return true;
  const [cw, cr] = cur.split('/').map(Number);
  return w > cw || (w === cw && r < cr);
}

export function processMatch(j, id, players) {
  const info = j && j.info;
  if (!info || !Array.isArray(j.innings) || !info.teams) return null;
  const fmt = FMT(info.match_type), reg = (info.registry && info.registry.people) || {};
  const year = +String(info.dates && info.dates[0] || '').slice(0, 4) || 0;
  const pl = (name, team) => {
    const pid = reg[name] || 'n:' + name;
    let p = players.get(pid);
    if (!p) { p = newPlayer(pid, name); players.set(pid, p); }
    if (year) { p.y0 = Math.min(p.y0, year); p.y1 = Math.max(p.y1, year); }
    if (team) p.teams[team] = (p.teams[team] || 0) + 1;
    return p;
  };
  // matches played
  for (const [team, names] of Object.entries(info.players || {})) for (const nm of names) { const p = pl(nm, team); p.all.m++; slot(p, fmt).m++; }
  const sc = [];
  for (const inn of j.innings) {
    const bat = new Map(), bowl = new Map(); let runs = 0, wk = 0, legal = 0;
    const gb = n => { let x = bat.get(n); if (!x) { x = { r: 0, b: 0, f4: 0, f6: 0, out: false }; bat.set(n, x); } return x; };
    const gw = n => { let x = bowl.get(n); if (!x) { x = { b: 0, r: 0, w: 0 }; bowl.set(n, x); } return x; };
    for (const ov of inn.overs || []) for (const d of ov.deliveries || []) {
      const ex = d.extras || {}, rr = d.runs || {};
      const wide = ex.wides > 0, nb = ex.noballs > 0;
      runs += rr.total || 0;
      if (!wide && !nb) legal++;
      const b = gb(d.batter); gb(d.non_striker);
      if (!wide) { b.b++; }
      b.r += rr.batter || 0;
      if (rr.batter === 4 && !rr.non_boundary) b.f4++;
      if (rr.batter === 6) b.f6++;
      const w = gw(d.bowler);
      if (!wide && !nb) w.b++;
      w.r += (rr.total || 0) - (ex.byes || 0) - (ex.legbyes || 0) - (ex.penalty || 0);
      for (const k of d.wickets || []) {
        wk++;
        const o = gb(k.player_out); o.out = true;
        if (WK_BOWLER.has(k.kind)) w.w++;
        for (const f of k.fielders || []) {
          const fn = f.name; if (!fn) continue;
          const fp = pl(fn), s = slot(fp, fmt);
          if (k.kind === 'caught' || k.kind === 'caught and bowled') { fp.all.ct++; s.ct++; }
          else if (k.kind === 'stumped') { fp.all.st++; s.st++; }
          else if (k.kind === 'run out') { fp.all.ro++; s.ro++; }
        }
      }
    }
    if (inn.super_over) continue; // super overs are not part of career figures
    for (const [nm, x] of bat) {
      const p = pl(nm), a = p.all, s = slot(p, fmt);
      for (const t of [a, s]) {
        t.bi++; t.r += x.r; t.b += x.b; t.f4 += x.f4; t.f6 += x.f6; if (!x.out) t.no++;
        if (x.r >= 100) t.n100++; else if (x.r >= 50) t.n50++;
        if (x.r > t.hs || (x.r === t.hs && !x.out && !t.hsn)) { t.hs = x.r; t.hsn = x.out ? 0 : 1; }
      }
    }
    for (const [nm, x] of bowl) {
      if (!x.b && !x.r) continue;
      const p = pl(nm), a = p.all, s = slot(p, fmt);
      for (const t of [a, s]) {
        t.bo++; t.bb += x.b; t.br += x.r; t.w += x.w; if (x.w >= 5) t.w5++;
        if (bestBetter(x.w, x.r, t.bw)) t.bw = x.w + '/' + x.r;
      }
    }
    sc.push({ t: inn.team, r: runs, w: wk, b: legal });
  }
  const oc = info.outcome || {};
  const res = oc.winner ? (oc.by ? Object.entries(oc.by).map(([k, v]) => v + ' ' + k).join(' ') : 'won') : (oc.result || '');
  return {
    id, d: info.dates && info.dates[0], t: fmt, g: info.gender || '', tt: info.team_type || '',
    ev: (info.event && info.event.name) || '', v: info.venue || '', c: info.city || '', tm: info.teams.slice(0, 2),
    w: oc.winner || '', res, sc, pom: info.player_of_match || [], y: year
  };
}

// ---------- store ----------
export function createHistory({ dir, log = console.log }) {
  fs.mkdirSync(dir, { recursive: true });
  const F = n => path.join(dir, n);
  let meta = null, matches = [], players = new Map(), byName = [];
  const job = { state: 'idle', done: 0, total: 0, skipped: 0, error: '', started: 0, ended: 0, step: '' };

  function load() {
    try {
      meta = JSON.parse(fs.readFileSync(F('meta.json'), 'utf8'));
      matches = fs.readFileSync(F('matches.ndjson'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
      const arr = JSON.parse(fs.readFileSync(F('players.json'), 'utf8'));
      players = new Map(arr.map(p => [p.id, p]));
      index();
      return true;
    } catch { meta = null; matches = []; players = new Map(); byName = []; return false; }
  }
  function index() { byName = [...players.values()].map(p => ({ p, k: p.n.toLowerCase() })); }

  async function importFrom({ url, file, sinceYear }) {
    if (job.state === 'running') throw new Error('An import is already running');
    Object.assign(job, { state: 'running', done: 0, total: 0, skipped: 0, error: '', started: Date.now(), ended: 0, step: 'starting' });
    let tmp = '', fd = -1;
    try {
      const since = sinceYear || (new Date().getUTCFullYear() - 30);
      let zipPath = file;
      if (!zipPath) {
        job.step = 'downloading'; tmp = F('download.tmp.zip');
        const r = await fetch(url);
        if (!r.ok || !r.body) throw new Error('Download failed: HTTP ' + r.status);
        await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp));
        zipPath = tmp;
      }
      job.step = 'reading'; fd = fs.openSync(zipPath, 'r');
      const ents = zipEntries(fd).filter(e => /\.json$/i.test(e.name) && !/(^|\/)(README|readme)/.test(e.name));
      job.total = ents.length; job.step = 'processing';
      const P = new Map(), M = [];
      for (const e of ents) {
        try {
          const j = JSON.parse(zipRead(fd, e).toString('utf8'));
          const y = +String(j.info && j.info.dates && j.info.dates[0] || '').slice(0, 4);
          if (y && y < since) { job.skipped++; job.done++; continue; }
          const row = processMatch(j, path.basename(e.name, '.json'), P);
          if (row) M.push(row); else job.skipped++;
        } catch { job.skipped++; }
        job.done++;
        if (job.done % 500 === 0) await new Promise(r => setImmediate(r));
      }
      if (!M.length) throw new Error('No matches found in the file (is it Cricsheet JSON?)');
      job.step = 'saving';
      M.sort((a, b) => String(b.d).localeCompare(String(a.d)));
      const arr = [...P.values()].map(p => { if (p.y0 === 9999) p.y0 = 0; return p; });
      const nm = {
        built: new Date().toISOString(), source: HISTORY_SOURCE, licence: HISTORY_LICENCE, since,
        matches: M.length, players: arr.length, from: M[M.length - 1].d, to: M[0].d,
        note: 'Ball-by-ball data exists only from the years Cricsheet covers; earlier years are not available from this source.'
      };
      const w = (n, s) => { fs.writeFileSync(F(n + '.tmp'), s); fs.renameSync(F(n + '.tmp'), F(n)); };
      w('matches.ndjson', M.map(m => JSON.stringify(m)).join('\n'));
      w('players.json', JSON.stringify(arr));
      w('meta.json', JSON.stringify(nm));
      load();
      job.state = 'done'; job.step = 'finished';
    } catch (e) {
      job.state = 'error'; job.error = e.message; job.step = 'failed'; log('history import failed: ' + e.message);
    } finally {
      if (fd >= 0) try { fs.closeSync(fd); } catch {}
      if (tmp) try { fs.unlinkSync(tmp); } catch {}
      job.ended = Date.now();
    }
  }

  const status = () => ({ ready: !!meta, meta, job: { ...job } });
  const searchPlayers = (q, limit = 20) => {
    q = String(q || '').trim().toLowerCase(); if (q.length < 2) return [];
    return byName.filter(x => x.k.includes(q)).sort((a, b) => b.p.all.m - a.p.all.m).slice(0, limit)
      .map(({ p }) => ({ id: p.id, n: p.n, m: p.all.m, r: p.all.r, w: p.all.w, y0: p.y0, y1: p.y1 }));
  };
  const player = id => players.get(String(id)) || null;
  const searchMatches = ({ q, type, year, team, gender, limit = 30, offset = 0 }) => {
    q = String(q || '').toLowerCase(); team = String(team || '').toLowerCase();
    const L = matches.filter(m => (!type || m.t === type) && (!year || m.y === +year) && (!gender || m.g === gender) &&
      (!team || m.tm.some(t => t.toLowerCase().includes(team))) &&
      (!q || (m.ev + ' ' + m.v + ' ' + m.c + ' ' + m.tm.join(' ')).toLowerCase().includes(q)));
    return { total: L.length, rows: L.slice(offset, offset + Math.min(100, limit)) };
  };
  const venueStats = (name, type) => {
    const k = String(name || '').split(',')[0].trim().toLowerCase();
    if (k.length < 4) return { n: 0 };
    const L = matches.filter(m => (m.v + ' ' + m.c).toLowerCase().includes(k) && m.sc && m.sc.length >= 1 && (!type || m.t === type));
    if (!L.length) return { n: 0 };
    const by = {};
    for (const m of L) {
      const f = by[m.t] || (by[m.t] = { t: m.t, n: 0, first: 0, hi: 0, batFirst: 0, chase: 0, nr: 0 });
      f.n++; const a = m.sc[0].r; f.first += a; f.hi = Math.max(f.hi, ...m.sc.map(x => x.r));
      if (m.w && m.w === m.sc[0].t) f.batFirst++; else if (m.w) f.chase++; else f.nr++;
    }
    const rows = Object.values(by).map(f => ({ t: f.t, n: f.n, avgFirst: Math.round(f.first / f.n), hi: f.hi, batFirst: f.batFirst, chase: f.chase, nr: f.nr })).sort((a, b) => b.n - a.n);
    const recent = L.slice().sort((a, b) => String(b.d).localeCompare(String(a.d))).slice(0, 5).map(m => ({ d: m.d, t: m.t, tm: m.tm, res: m.w ? m.w + ' won' + (m.res && m.res !== 'won' ? ' by ' + m.res : '') : (m.res || 'No result'), sc: m.sc.map(x => x.r + '/' + x.w) }));
    return { n: L.length, venue: L[0].v, city: L[0].c, rows, recent, from: L.reduce((a, m) => (!a || String(m.d) < a ? String(m.d) : a), ''), to: L.reduce((a, m) => (!a || String(m.d) > a ? String(m.d) : a), '') };
  };
  load();
  return { status, importFrom, searchPlayers, player, searchMatches, venueStats, load };
}
