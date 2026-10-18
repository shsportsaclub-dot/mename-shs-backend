// Live tracker: compares two scorecard snapshots of a running match and writes down only what the figures prove.
// When exactly one delivery separates two snapshots, the bowler, batter and runs are known, so a ball record is made.
// When several deliveries separate them, nothing is guessed: a plain note of the change is kept instead.

const balls = o => { const m = /^(\d+)(?:\.([0-5]))?$/.exec(String(o ?? '').trim()); return m ? +m[1] * 6 + +(m[2] || 0) : null; };
const n = v => (v == null || v === '' || !Number.isFinite(+v)) ? 0 : +v;
const nameOf = x => (x && typeof x === 'object') ? String(x.name || '') : String(x || '');
const sInn = s => String(s || '').replace(/\s+Inning.*$/i, '').trim();

// Latest innings of a CricketData-style scorecard -> compact snapshot (null when it cannot be read)
export function snapshotOf(sc) {
  const L = sc && Array.isArray(sc.scorecard) ? sc.scorecard : [];
  const idx = L.length - 1; if (idx < 0) return null;
  const inn = L[idx], headline=(sc.score||[]).findLast(s=>String(s.inning).toLowerCase()===String(inn.inning).toLowerCase()),t = {R:headline?.r,W:headline?.w,O:headline?.o,...inn.totals};
  const b = balls(t.O); if (b == null || t.R == null || t.W == null) return null;
  const bat = {}, bowl = {};
  for (const r of inn.batting || []) { const nm = nameOf(r.batsman); if (nm) bat[nm] = { r: n(r.r), b: n(r.b), f4: n(r['4s']), f6: n(r['6s']), t: String(r['dismissal-text'] ?? r.dismissal ?? '').trim() }; }
  for (const r of inn.bowling || []) { const nm = nameOf(r.bowler); if (nm) bowl[nm] = { b: balls(r.o) ?? 0, r: n(r.r), w: n(r.w), nb: n(r.nb), wd: n(r.wd) }; }
  return { idx, inning: String(inn.inning || ''), team: sInn(inn.inning), r: n(t.R), w: n(t.W), balls: b, o: String(t.O), bat, bowl };
}

const notOut = t => /^(|not out|batting|did not bat|yet to bat)$/i.test(String(t).trim());

// "c Madushanka b Fernando", "lbw b X", "b X", "st Y b X", "run out (Z)" -> { kind, fielder }
export function parseDismissal(text) {
  const s = String(text || '').trim(); let m;
  if ((m = /^c & b (.+)$/i.exec(s)) || (m = /^c and b (.+)$/i.exec(s))) return { kind: 'caught and bowled', fielder: m[1] };
  if ((m = /^c (.+?) b .+$/i.exec(s))) return { kind: 'caught', fielder: m[1] };
  if ((m = /^st (.+?) b .+$/i.exec(s))) return { kind: 'stumped', fielder: m[1] };
  if (/^lbw\b/i.test(s)) return { kind: 'lbw', fielder: '' };
  if ((m = /^run out(?:\s*\((.+)\))?/i.exec(s))) return { kind: 'run out', fielder: m[1] || '' };
  if (/^hit wicket/i.test(s)) return { kind: 'hit wicket', fielder: '' };
  if (/^b\s+.+$/i.test(s)) return { kind: 'bowled', fielder: '' };
  return { kind: s || 'out', fielder: '' };
}

const delta = (a, b, k) => n(b[k]) - n(a ? a[k] : 0);

// prev, cur: snapshots of the same match. Returns { rows, note, correction }
export function diffSnapshots(prev, cur) {
  if (!cur) return { rows: [], note: null };
  if (!prev) return { rows: [], note: { text: `Tracking started: ${cur.team} ${cur.r}/${cur.w} (${cur.o} ov).` } };
  if (prev.idx !== cur.idx) return { rows: [], note: { text: `New innings: ${cur.team} ${cur.r}/${cur.w} (${cur.o} ov).` } };
  const dR = cur.r - prev.r, dW = cur.w - prev.w, dB = cur.balls - prev.balls;
  if (dR < 0 || dW < 0 || dB < 0) return { rows: [], note: { text: `Score correction: ${prev.team} ${prev.r}/${prev.w} (${prev.o} ov) to ${cur.r}/${cur.w} (${cur.o} ov).` }, correction: true };
  if (!dR && !dW && !dB) return { rows: [], note: null };

  const batChg = Object.keys(cur.bat).map(k => ({ k, dr: delta(prev.bat[k], cur.bat[k], 'r'), db: delta(prev.bat[k], cur.bat[k], 'b'), d4: delta(prev.bat[k], cur.bat[k], 'f4'), d6: delta(prev.bat[k], cur.bat[k], 'f6'), was: prev.bat[k], now: cur.bat[k] }));
  const bowlChg = Object.keys(cur.bowl).map(k => ({ k, db: delta(prev.bowl[k], cur.bowl[k], 'b'), dr: delta(prev.bowl[k], cur.bowl[k], 'r'), dw: delta(prev.bowl[k], cur.bowl[k], 'w'), dnb: delta(prev.bowl[k], cur.bowl[k], 'nb'), dwd: delta(prev.bowl[k], cur.bowl[k], 'wd') }));
  const faced = batChg.filter(x => x.db !== 0), bowled = bowlChg.filter(x => x.db !== 0), wd = bowlChg.filter(x => x.dwd !== 0), nb = bowlChg.filter(x => x.dnb !== 0);
  const dismissed = batChg.filter(x => x.now && !notOut(x.now.t) && (!x.was || notOut(x.was.t)));
  const sumBatRuns = batChg.reduce((a, x) => a + x.dr, 0);
  const over = b => Math.floor((b - 1) / 6), ball = b => ((b - 1) % 6) + 1;
  const base = { inning: cur.idx + 1, team: cur.team, derived: true, provenance: 'scorecard delta' };
  const single = (row) => ({ rows: [{ ...base, ...row }], note: null });

  // one legal delivery
  if (dB === 1 && !wd.length && !nb.length && bowled.length === 1 && bowled[0].db === 1 && faced.length === 1 && faced[0].db === 1 && dW === dismissed.length && dW <= 1 && sumBatRuns === faced[0].dr && faced[0].dr === dR) {
    const bt = faced[0], bw = bowled[0];
    const row = { over: over(cur.balls), ball: ball(cur.balls), runs: dR, total_runs: dR, bruns: bt.dr, wicket: dW === 1, wide: false, noball: false, xtype: '', batsman: bt.k, bowler: bw.k };
    if (dW === 1) { const o = dismissed[0], d = parseDismissal(o.now.t); Object.assign(row, { out: o.k, kind: d.kind, fielder: d.fielder }); }
    return single(row);
  }
  // one wide: no ball is bowled in the over count, the bowler's wide column goes up by one
  if (dB === 0 && dW === 0 && wd.length === 1 && wd[0].dwd === 1 && !nb.length && dR >= 1 && sumBatRuns === 0 && !faced.length && wd[0].dr === dR) {
    const ob = Math.max(cur.balls, 0);
    return single({ over: Math.floor(ob / 6), ball: ob % 6 + 1, runs: dR, total_runs: dR, bruns: 0, wicket: false, wide: true, noball: false, xtype: '', batsman: '', bowler: wd[0].k });
  }
  // one no ball: the bowler's no-ball column goes up by one; the batter faced it
  if (dB === 0 && dW === 0 && nb.length === 1 && nb[0].dnb === 1 && !wd.length && faced.length === 1 && faced[0].db === 1 && sumBatRuns === faced[0].dr && faced[0].dr + 1 === dR) {
    const ob = Math.max(cur.balls, 0);
    return single({ over: Math.floor(ob / 6), ball: ob % 6 + 1, runs: dR, total_runs: dR, bruns: faced[0].dr, wicket: false, wide: false, noball: true, xtype: '', batsman: faced[0].k, bowler: nb[0].k });
  }
  // several deliveries (or something the figures cannot settle): keep a plain note, never a ball record
  const parts = [`${cur.team} ${prev.r}/${prev.w} (${prev.o} ov) to ${cur.r}/${cur.w} (${cur.o} ov): ${dR} run${dR === 1 ? '' : 's'}${dB > 0 ? ' from ' + dB + ' legal ball' + (dB === 1 ? '' : 's') : ''}${dW ? ', ' + dW + ' wicket' + (dW === 1 ? '' : 's') : ''}.`];
  for (const x of batChg) if (x.dr > 0 || (x.now && !x.was)) parts.push(!x.was ? `${x.k} comes in.` : `${x.k} ${x.was.r} to ${x.now.r} (${x.was.b} to ${x.now.b} balls).`);
  for (const x of dismissed) parts.push(`${x.k} out: ${x.now.t}.`);
  return { rows: [], note: { text: parts.join(' ') } };
}

