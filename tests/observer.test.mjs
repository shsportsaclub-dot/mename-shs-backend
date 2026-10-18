import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotOf, diffSnapshots, parseDismissal } from '../observer.mjs';

const bat = (name, r, b, t = 'batting', f4 = 0, f6 = 0) => ({ batsman: { name }, r, b, '4s': f4, '6s': f6, 'dismissal-text': t });
const bow = (name, o, r, w, nb = 0, wd = 0) => ({ bowler: { name }, o, m: 0, r, w, nb, wd });
const sc = (R, W, O, batting, bowling) => ({ scorecard: [{ inning: 'Pakistan Inning 1', totals: { R, W, O }, batting, bowling }] });
const S = (...a) => snapshotOf(sc(...a));

const B0 = () => [bat('Hasan', 19, 31), bat('Salman', 30, 32)], W0 = () => [bow('Madushanka', 7, 38, 2), bow('Fernando', '5.5', 31, 0)];

test('snapshot reads totals, batters and bowlers', () => {
  const s = S(166, 4, '30.5', B0(), W0());
  assert.equal(s.balls, 185); assert.equal(s.team, 'Pakistan'); assert.equal(s.bat.Hasan.b, 31); assert.equal(s.bowl.Fernando.b, 35);
  assert.equal(snapshotOf({ scorecard: [] }), null);
});

test('one legal ball with runs: bowler, batter and runs are proven', () => {
  const a = S(166, 4, '30.5', B0(), W0());
  const b = S(170, 4, '31', [bat('Hasan', 23, 32, 'batting', 0, 0), bat('Salman', 30, 32)], [bow('Madushanka', 7, 38, 2), bow('Fernando', '6', 35, 0)]);
  const d = diffSnapshots(a, b);
  assert.equal(d.rows.length, 1);
  assert.deepEqual([d.rows[0].over, d.rows[0].ball, d.rows[0].runs, d.rows[0].bruns, d.rows[0].batsman, d.rows[0].bowler, d.rows[0].wicket], [30, 6, 4, 4, 'Hasan', 'Fernando', false]);
  assert.equal(d.rows[0].inning, 1);
});

test('one wicket ball: dismissed batter, kind and fielder from the scorecard text', () => {
  const a = S(166, 4, '30.5', B0(), W0());
  const b = S(166, 5, '31', [bat('Hasan', 19, 32, 'c Mendis b Fernando'), bat('Salman', 30, 32), bat('Shadab', 0, 0)], [bow('Madushanka', 7, 38, 2), bow('Fernando', '6', 31, 1)]);
  const r = diffSnapshots(a, b).rows[0];
  assert.deepEqual([r.wicket, r.out, r.kind, r.fielder, r.runs], [true, 'Hasan', 'caught', 'Mendis', 0]);
});

test('a wide is recorded without inventing the batter', () => {
  const a = S(166, 4, '30.5', B0(), W0());
  const b = S(167, 4, '30.5', B0(), [bow('Madushanka', 7, 38, 2), bow('Fernando', '5.5', 32, 0, 0, 1)]);
  const r = diffSnapshots(a, b).rows[0];
  assert.deepEqual([r.wide, r.runs, r.batsman, r.bowler], [true, 1, '', 'Fernando']);
});

test('several balls between checks: a note, never ball records', () => {
  const a = S(166, 4, '30.5', B0(), W0());
  const b = S(171, 4, '31.3', [bat('Hasan', 22, 34), bat('Salman', 32, 35)], [bow('Madushanka', '7.2', 41, 2), bow('Fernando', '6', 33, 0)]);
  const d = diffSnapshots(a, b);
  assert.equal(d.rows.length, 0); assert.match(d.note.text, /5 runs from 4 legal balls/);
});

test('corrections, first look, new innings and no change', () => {
  const a = S(166, 4, '30.5', B0(), W0());
  assert.match(diffSnapshots(null, a).note.text, /Tracking started/);
  assert.equal(diffSnapshots(a, a).note, null);
  assert.equal(diffSnapshots(a, S(160, 4, '30.5', B0(), W0())).correction, true);
  const two = { scorecard: [...sc(250, 8, '50', [], []).scorecard, { inning: 'Sri Lanka Inning 1', totals: { R: 4, W: 0, O: '1.0' }, batting: [], bowling: [] }] };
  assert.match(diffSnapshots(a, snapshotOf(two)).note.text, /New innings/);
});

test('dismissal text parsing', () => {
  assert.deepEqual(parseDismissal('lbw b X'), { kind: 'lbw', fielder: '' });
  assert.deepEqual(parseDismissal('c & b Y'), { kind: 'caught and bowled', fielder: 'Y' });
  assert.deepEqual(parseDismissal('st Rizwan b Z'), { kind: 'stumped', fielder: 'Rizwan' });
  assert.deepEqual(parseDismissal('run out (Mendis)'), { kind: 'run out', fielder: 'Mendis' });
  assert.deepEqual(parseDismissal('b Fernando'), { kind: 'bowled', fielder: '' });
});
