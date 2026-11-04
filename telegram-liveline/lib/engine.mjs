// SH Live Line - pure cricket logic: score diffs -> ball events, live card, scorecard, win model.
// No network, no state outside the objects passed in, so it can be unit tested.

export const balls = o => {
  if (o === null || o === undefined || o === '') return 0;
  const [a, b = '0'] = String(o).split('.');
  return (Number(a) || 0) * 6 + Math.min(5, Number(b) || 0);
};
export const overs = n => `${Math.floor(n / 6)}.${n % 6}`;
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Overs per innings by format (null = no limit, e.g. Test / first-class).
export function maxOvers(type, name = '') {
  const t = String(type || '').toLowerCase();
  if (/hundred/i.test(name)) return null;           // 100-ball format: balls, not overs - no projection
  if (t === 't20' || t === 't20i') return 20;
  if (t === 'odi' || t === 'list a') return 50;
  if (t === 't10') return 10;
  return null;
}

export const teamShort = (m, full) => {
  const ti = (m.teamInfo || []).find(t => t.name && full && full.toLowerCase().startsWith(t.name.toLowerCase()));
  return ti?.shortname || ti?.shortName || String(full || '').replace(/ Inning.*$/i, '').trim();
};
export const inningTeam = inning => String(inning || '').replace(/\s+Inning\s*\d*.*$/i, '').trim();
export const isWomen = m => /women|\bwmn\b|\(w\)/i.test(m.name || '') || (m.teams || []).some(t => /women/i.test(t));
export const isLive = m => m.matchStarted && !m.matchEnded;

// One "snapshot" of the batting side, taken from the provider's score[] list.
export function snap(m) {
  const s = Array.isArray(m.score) ? m.score : [];
  const last = s[s.length - 1];
  if (!last) return null;
  return { idx: s.length, inning: last.inning, r: Number(last.r) || 0, w: Number(last.w) || 0, b: balls(last.o) };
}

// Compare two snapshots of the same match and describe what happened in between.
// Returns a list of events; alert=true means "send a separate, loud message".
export function diff(prev, next) {
  if (!next) return [];
  if (!prev) return [];
  const ev = [];
  if (next.idx !== prev.idx || next.inning !== prev.inning) {
    ev.push({ kind: 'innings', alert: true, label: 'INN', prev, next });
    return ev;
  }
  const dr = next.r - prev.r, dw = next.w - prev.w, db = next.b - prev.b;
  if (dr === 0 && dw === 0 && db === 0) return ev;
  if (dr < 0 || dw < 0 || db < 0) { ev.push({ kind: 'correction', alert: false, label: '✎' }); return ev; }
  let label, alert = false;
  if (dw > 0) { label = dw > 1 ? `W×${dw}` : 'W'; alert = true; }
  else if (db === 0) label = dr === 1 ? 'Wd' : `+${dr}`;          // extra with no legal ball (wide / no-ball)
  else if (db === 1) { label = String(dr); alert = dr === 4 || dr === 6; }
  else label = `+${dr}`;                                          // several balls between two reads
  ev.push({ kind: 'ball', alert, label, runs: dr, wkts: dw, legal: db, boundary: db === 1 && (dr === 4 || dr === 6) });
  const po = Math.floor(prev.b / 6), no = Math.floor(next.b / 6);
  if (no > po) ev.push({ kind: 'over', alert: false, label: 'OVER', over: no });
  return ev;
}

// Batter milestones (50, 100, 150 ...) between two scorecards.
export function milestones(prevBat, nextBat) {
  const out = [];
  for (const [name, r] of Object.entries(nextBat || {})) {
    const before = prevBat?.[name];
    if (before === undefined) continue;
    for (const mark of [50, 100, 150, 200, 250, 300]) if (before < mark && r >= mark) out.push({ kind: 'milestone', alert: true, name, mark, runs: r });
  }
  return out;
}

export function lastInningCard(sc, inning) {
  const list = Array.isArray(sc) ? sc : [];
  return list.find(c => c.inning === inning) || list[list.length - 1] || null;
}
export function atCrease(card) {
  const bat = Array.isArray(card?.batting) ? card.batting : [];
  return bat.filter(b => /batting|not out/i.test(b['dismissal-text'] || b.dismissal || '')).slice(0, 2);
}
export function batterRuns(card) {
  const o = {};
  for (const b of Array.isArray(card?.batting) ? card.batting : []) if (b.batsman?.name) o[b.batsman.name] = Number(b.r) || 0;
  return o;
}
export function bowlerBalls(card) {
  const o = {};
  for (const b of Array.isArray(card?.bowling) ? card.bowling : []) if (b.bowler?.name) o[b.bowler.name] = balls(b.o);
  return o;
}

// Wides / no-balls conceded so far in this innings (CricketData bowling rows carry wd / nb).
export function extras(card) {
  let wd = 0, nb = 0;
  for (const b of Array.isArray(card?.bowling) ? card.bowling : []) { wd += Number(b.wd ?? b.wides) || 0; nb += Number(b.nb ?? b.noballs) || 0; }
  return { wd, nb };
}
export const REVIEW_RE = /\b(review|drs|third umpire|tv umpire|upstairs)\b/i;

// Transparent chase model (clearly labelled "model" in the card, never shown as odds).
// Resources left = balls left x wicket factor; compares with runs needed.
const WF = [0, 0.18, 0.32, 0.45, 0.56, 0.66, 0.75, 0.83, 0.9, 0.96, 1];
export function chaseWinPct({ need, ballsLeft, wktsLeft, format }) {
  if (need <= 0) return 100;
  if (ballsLeft <= 0 || wktsLeft <= 0) return 0;
  const base = format === 20 || format === 10 ? 8.4 : 5.9;       // par scoring rate per over
  const par = (ballsLeft / 6) * base * WF[Math.max(0, Math.min(10, wktsLeft))];
  const sd = Math.max(5, Math.sqrt(ballsLeft) * 1.9);
  const p = 1 / (1 + Math.exp(-(par - need) / sd));
  return Math.round(Math.max(1, Math.min(99, p * 100)));
}

// Everything the live card needs, computed from the provider data + bot memory.
export function state(m, mem = {}) {
  const s = snap(m);
  const fmt = maxOvers(m.matchType, m.name);
  const card = s ? lastInningCard(m.scorecard, s.inning) : null;
  const out = { s, fmt, card };
  if (!s) return out;
  out.crr = s.b ? (s.r * 6) / s.b : 0;
  const score = m.score || [];
  // Limited-overs chase: second innings with a first-innings total to beat.
  if (fmt && score.length === 2) {
    const target = (Number(score[0].r) || 0) + 1;
    const ballsLeft = fmt * 6 - s.b, need = target - s.r;
    out.chase = { target, need, ballsLeft, rrr: ballsLeft > 0 ? (need * 6) / ballsLeft : 0 };
    const batPct = chaseWinPct({ need, ballsLeft, wktsLeft: 10 - s.w, format: fmt });
    out.win = { bat: inningTeam(s.inning), batPct, bowl: inningTeam(score[0].inning), bowlPct: 100 - batPct };
  } else if (fmt && score.length === 1) {
    const left = fmt * 6 - s.b;
    out.projected = [0, 1, 2].map(k => Math.round(s.r + (left / 6) * (out.crr + k)));
  }
  if (mem.partnerFrom && mem.partnerFrom.idx === s.idx) out.partnership = { r: s.r - mem.partnerFrom.r, b: s.b - mem.partnerFrom.b };
  return out;
}

const winDot = p => (p >= 60 ? '🟢' : p >= 40 ? '🟡' : '🔴');
const BIG = { Nb: 'NO BALL', '0': '•  DOT BALL', '1': '1 RUN', '2': '2 RUNS', '3': '3 RUNS', '4': '4  FOUR!', '5': '5 RUNS', '6': '6  SIX!', W: 'W  WICKET!', Wd: 'WIDE' };
export const bigLabel = l => BIG[l] || (String(l).startsWith('W') ? `${l}  WICKETS!` : String(l).startsWith('+') ? `${l} runs` : String(l));

export function liveCard(m, mem, T, now = new Date()) {
  const st = state(m, mem);
  const L = [];
  const type = String(m.matchType || '').toUpperCase();
  L.push(`🔴 <b>${esc(m.name || 'Live match')}</b>`);
  L.push(`<i>${esc([type, m.venue].filter(Boolean).join(' · '))}</i>`);
  L.push('━━━━━━━━━━━━━━');
  if (mem.lastLabel) L.push(`        <b>【 ${esc(bigLabel(mem.lastLabel))} 】</b>`);
  else L.push(`        <b>【 ${esc(T('live'))} 】</b>`);
  L.push('━━━━━━━━━━━━━━');
  const prevInns = (m.score || []).slice(0, -1);
  for (const p of prevInns) L.push(`${esc(teamShort(m, p.inning))} ${p.r}/${p.w} (${esc(p.o)})`);
  if (st.s) {
    L.push(`<b>${esc(teamShort(m, st.s.inning))} ${st.s.r}/${st.s.w}</b>  (${overs(st.s.b)}${st.fmt ? '/' + st.fmt : ''} ov)`);
    const rates = [`CRR ${st.crr.toFixed(2)}`];
    if (st.chase) {
      rates.push(`RRR ${st.chase.rrr.toFixed(2)}`);
      L.push(rates.join(' · '));
      if (st.chase.need > 0) L.push(`🎯 ${esc(T('need', { r: st.chase.need, b: st.chase.ballsLeft }))}`);
    } else L.push(rates.join(' · '));
    if (st.win) L.push(`${winDot(st.win.batPct)} ${esc(T('win'))}: ${esc(teamShort(m, st.win.bat))} ${st.win.batPct}% · ${esc(teamShort(m, st.win.bowl))} ${st.win.bowlPct}%`);
    if (st.projected) L.push(`📈 ${esc(T('projected'))}: ${st.projected.join(' · ')}`);
  } else L.push(esc(T('noScore')));
  const crease = atCrease(st.card);
  if (crease.length || mem.bowler) L.push('━━━━━━━━━━━━━━');
  for (const b of crease) L.push(`🏏 ${esc(b.batsman?.name)}  <b>${b.r ?? 0}</b> (${b.b ?? 0})  4s:${b['4s'] ?? 0} 6s:${b['6s'] ?? 0}`);
  if (mem.bowler) {
    const bw = (st.card?.bowling || []).find(x => x.bowler?.name === mem.bowler);
    if (bw) L.push(`🎳 ${esc(bw.bowler.name)}  ${esc(bw.o)}-${bw.m ?? 0}-${bw.r ?? 0}-${bw.w ?? 0}  Eco ${esc(bw.eco ?? '')}`.trim());
  }
  if (st.partnership && st.partnership.b > 0) L.push(`🤝 ${esc(T('partnership'))}: ${st.partnership.r} (${st.partnership.b})`);
  if (mem.freeHit) L.push('🟢 <b>FREE HIT</b> — next ball');
  if (mem.last6?.length) L.push(`${esc(T('last6'))}: ${mem.last6.map(x => `[${esc(x)}]`).join(' ')}`);
  if (mem.thisOver?.length) L.push(`${esc(T('thisOver'))}: ${mem.thisOver.map(esc).join(' ')}`);
  if (mem.prevOver) L.push(`↩️ ${esc(T('overDone', { n: mem.prevOver.n, r: mem.prevOver.r }))}${mem.prevOver.balls?.length ? ' — ' + mem.prevOver.balls.map(esc).join(' ') : ''}`);
  L.push('━━━━━━━━━━━━━━');
  if (m.status) L.push(`📢 ${esc(m.status)}`);
  L.push(`<i>⏱ ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} IST · SH Sports Live Line</i>`);
  return L.join('\n');
}

const pad = (s, n) => { s = String(s ?? ''); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); };
const lpad = (s, n) => { s = String(s ?? ''); return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s; };
export function scorecardText(m, T) {
  const L = [`📋 <b>${esc(m.name)}</b>`];
  const list = Array.isArray(m.scorecard) ? m.scorecard : [];
  if (!list.length) return L.concat(esc(T('noCard'))).join('\n');
  for (const c of list) {
    const sc = (m.score || []).find(x => x.inning === c.inning);
    L.push('', `<b>${esc(c.inning)}</b>${sc ? `  ${sc.r}/${sc.w} (${esc(sc.o)})` : ''}`);
    const rows = [pad('Batter', 16) + lpad('R', 4) + lpad('B', 4) + lpad('4s', 3) + lpad('6s', 3)];
    for (const b of c.batting || []) {
      const out = /batting|not out/i.test(b['dismissal-text'] || '') ? '*' : '';
      rows.push(pad((b.batsman?.name || '') + out, 16) + lpad(b.r ?? 0, 4) + lpad(b.b ?? 0, 4) + lpad(b['4s'] ?? 0, 3) + lpad(b['6s'] ?? 0, 3));
    }
    rows.push('', pad('Bowler', 16) + lpad('O', 5) + lpad('R', 4) + lpad('W', 3));
    for (const b of c.bowling || []) rows.push(pad(b.bowler?.name || '', 16) + lpad(b.o ?? 0, 5) + lpad(b.r ?? 0, 4) + lpad(b.w ?? 0, 3));
    L.push(`<pre>${esc(rows.join('\n'))}</pre>`);
  }
  return L.join('\n').slice(0, 4000);
}

export function matchButtonText(m) {
  const s = snap(m);
  const t = (m.teamInfo || []).map(x => x.shortname).filter(Boolean).join(' v ') || m.name || 'Match';
  return s ? `${t} · ${teamShort(m, s.inning)} ${s.r}/${s.w} (${overs(s.b)})` : t;
}

// ---------- ball-by-ball replay ----------
// CricketData sometimes sends several balls in one update. Its match_bbb list has every delivery,
// so we can play them back one by one. Field names vary, so the parser is defensive, and the
// result is only used when it adds up exactly to the score change (otherwise: no guessing).
const num = x => (x === null || x === undefined || x === '' || isNaN(Number(x)) ? 0 : Number(x));
const nm = x => (typeof x === 'string' ? x : x?.name || '');
export function bbbRows(data) {
  const arr = Array.isArray(data) ? data : Array.isArray(data?.bbb) ? data.bbb : [];
  return arr.map((r, i) => {
    const xt = String(r.extras_type ?? r.extrasType ?? r.extra_type ?? r.xtype ?? r.extra ?? '').toLowerCase();
    const wide = r.wide === true || r.wide === 1 || /\bwd\b|wide/.test(xt) || num(r.wides) > 0;
    const noball = r.noball === true || r.noball === 1 || /\bnb\b|no.?ball/.test(xt) || num(r.noballs) > 0;
    const total = r.total_runs ?? r.totalRuns ?? r.runs_total;
    const runsA = total !== undefined ? num(total) : num(r.runs);
    const runsB = total !== undefined ? num(total) : num(r.runs) + num(r.extras) + num(r.penalty);
    const wicket = r.wicket === true || r.wicket === 1 || !!r.dismissal || !!r.dismissal_type || !!r.player_out || r.out === true;
    return { i, n: num(r.n ?? i), inning: num(r.inning ?? r.innings), over: num(r.over), ball: num(r.ball), runsA, runsB, wide, noball, legal: !wide && !noball, wicket, batsman: nm(r.batsman ?? r.batter), bowler: nm(r.bowler), dismissal: typeof r.dismissal === 'string' ? r.dismissal : nm(r.dismissal) };
  }).sort((a, b) => a.inning - b.inning || a.over - b.over || a.ball - b.ball || a.n - b.n || a.i - b.i);
}
export function ballLabel(st) {
  if (st.wicket) return 'W';
  if (st.wide) return st.runs > 1 ? `Wd+${st.runs - 1}` : 'Wd';
  if (st.noball) return st.runs > 1 ? `Nb+${st.runs - 1}` : 'Nb';
  return String(st.runs);
}
// Steps between two snapshots of the same innings, each with the running score after that ball.
export function ballSteps(rows, prev, next) {
  if (!rows?.length || !prev || !next || prev.idx !== next.idx || next.b - prev.b < 1) return null;
  const inn = Math.max(...rows.map(r => r.inning));
  const list = rows.filter(r => r.inning === inn);
  let pos = 0;
  const withPos = list.map(r => { if (r.legal) pos++; return { ...r, pos }; });
  if (pos < next.b) return null;                                   // provider list is behind the score
  let i0 = -1;
  for (let k = 0; k < withPos.length; k++) if (withPos[k].legal && withPos[k].pos === prev.b) i0 = k;
  if (prev.b > 0 && i0 < 0) return null;
  let cand = withPos.slice(i0 + 1).filter(r => r.pos <= next.b);
  const dr = next.r - prev.r, dw = next.w - prev.w;
  for (let trim = 0; trim <= 3 && cand.length; trim++) {
    for (const key of ['runsA', 'runsB']) {
      const legal = cand.filter(r => r.legal).length, runs = cand.reduce((a, r) => a + r[key], 0), wk = cand.filter(r => r.wicket).length;
      if (legal === next.b - prev.b && runs === dr && wk === dw) {
        let r = prev.r, w = prev.w, b = prev.b;
        return cand.map(x => {
          r += x[key]; if (x.wicket) w++; const pb = b; if (x.legal) b++;
          const st = { runs: x[key], wicket: x.wicket, wide: x.wide, noball: x.noball, legal: x.legal ? 1 : 0, batsman: x.batsman, bowler: x.bowler, dismissal: x.dismissal, r, w, b, prevB: pb, idx: next.idx, inning: next.inning };
          st.label = ballLabel(st); return st;
        });
      }
    }
    if (cand.at(-1).legal) break;                                   // only trailing extras may be trimmed
    cand = cand.slice(0, -1);
  }
  return null;
}
