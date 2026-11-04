import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../lib/engine.mjs';
import { tr } from '../lib/i18n.mjs';

const S = (r, w, o, inning = 'India Inning 1', idx = 1) => ({ idx, inning, r, w, b: E.balls(o) });

test('overs <-> balls', () => {
  assert.equal(E.balls('16.2'), 98); assert.equal(E.balls(20), 120); assert.equal(E.overs(98), '16.2'); assert.equal(E.balls(''), 0);
});

test('diff labels every kind of ball', () => {
  const lab = (a, b) => E.diff(a, b).find(e => e.kind === 'ball')?.label;
  assert.equal(lab(S(100, 2, '10.1'), S(100, 2, '10.2')), '0');
  assert.equal(lab(S(100, 2, '10.1'), S(104, 2, '10.2')), '4');
  assert.equal(lab(S(100, 2, '10.1'), S(106, 2, '10.2')), '6');
  assert.equal(lab(S(100, 2, '10.1'), S(100, 3, '10.2')), 'W');
  assert.equal(lab(S(100, 2, '10.1'), S(101, 2, '10.1')), 'Wd');
  assert.equal(lab(S(100, 2, '10.1'), S(105, 2, '10.1')), '+5');
  assert.equal(lab(S(100, 2, '10.1'), S(103, 2, '10.4')), '+3');
  assert.equal(E.diff(S(100, 2, '10.1'), S(100, 2, '10.1')).length, 0);
  assert.equal(E.diff(S(100, 2, '10.2'), S(99, 2, '10.1'))[0].kind, 'correction');
});

test('boundaries and wickets are alerts, dots are not', () => {
  assert.equal(E.diff(S(1, 0, '0.1'), S(5, 0, '0.2'))[0].alert, true);
  assert.equal(E.diff(S(1, 0, '0.1'), S(1, 1, '0.2'))[0].alert, true);
  assert.equal(E.diff(S(1, 0, '0.1'), S(1, 0, '0.2'))[0].alert, false);
});

test('over end and innings change are detected', () => {
  const ev = E.diff(S(50, 1, '5.5'), S(51, 1, '6'));
  assert.deepEqual(ev.map(e => e.kind), ['ball', 'over']); assert.equal(ev[1].over, 6);
  const inn = E.diff(S(180, 6, '20'), S(4, 0, '0.1', 'Australia Inning 1', 2));
  assert.equal(inn[0].kind, 'innings');
});

test('milestones fire once when crossing 50 / 100', () => {
  assert.deepEqual(E.milestones({ Kohli: 48 }, { Kohli: 52 }).map(x => x.mark), [50]);
  assert.deepEqual(E.milestones({ Kohli: 96 }, { Kohli: 102 }).map(x => x.mark), [100]);
  assert.equal(E.milestones({ Kohli: 52 }, { Kohli: 56 }).length, 0);
  assert.equal(E.milestones({}, { New: 60 }).length, 0);
});

test('chase model is sane and bounded', () => {
  assert.equal(E.chaseWinPct({ need: 0, ballsLeft: 10, wktsLeft: 5, format: 20 }), 100);
  assert.equal(E.chaseWinPct({ need: 5, ballsLeft: 0, wktsLeft: 5, format: 20 }), 0);
  const easy = E.chaseWinPct({ need: 10, ballsLeft: 60, wktsLeft: 8, format: 20 });
  const hard = E.chaseWinPct({ need: 120, ballsLeft: 60, wktsLeft: 3, format: 20 });
  const even = E.chaseWinPct({ need: 80, ballsLeft: 60, wktsLeft: 7, format: 20 });
  assert.ok(easy > 90, 'easy ' + easy); assert.ok(hard < 10, 'hard ' + hard); assert.ok(even > 30 && even < 70, 'even ' + even);
  assert.ok(E.chaseWinPct({ need: 30, ballsLeft: 30, wktsLeft: 9, format: 20 }) > E.chaseWinPct({ need: 30, ballsLeft: 30, wktsLeft: 2, format: 20 }));
});

const match = {
  id: 'm1', name: 'India vs Australia, 1st T20I', matchType: 't20', venue: 'Wankhede, Mumbai', status: 'Australia need 38 runs in 22 balls',
  teamInfo: [{ name: 'India', shortname: 'IND' }, { name: 'Australia', shortname: 'AUS' }],
  score: [{ inning: 'India Inning 1', r: 189, w: 5, o: 20 }, { inning: 'Australia Inning 1', r: 152, w: 3, o: 16.2 }],
  scorecard: [{ inning: 'Australia Inning 1', batting: [{ batsman: { name: 'Travis Head' }, r: 62, b: 41, '4s': 6, '6s': 2, 'dismissal-text': 'batting' }, { batsman: { name: 'Mitchell Marsh' }, r: 18, b: 11, '4s': 1, '6s': 1, 'dismissal-text': 'not out' }, { batsman: { name: 'David Warner' }, r: 30, b: 20, 'dismissal-text': 'c Kohli b Bumrah' }], bowling: [{ bowler: { name: 'Jasprit Bumrah' }, o: 3.2, m: 0, r: 22, w: 2, eco: 6.6 }] }],
};

test('live card shows the chase, win %, batters, bowler and last balls', () => {
  const card = E.liveCard(match, { lastLabel: '4', last6: ['1', '4', '0', 'W', '1', '4'], thisOver: ['W', '1', '4'], bowler: 'Jasprit Bumrah', partnerFrom: { idx: 2, r: 107, b: 72 } }, tr('en'), new Date('2026-11-04T10:00:00Z'));
  for (const s of ['IND 189/5', '<b>AUS 152/3</b>', '16.2/20', 'RRR 10.36', 'Need 38 runs from 22 balls', 'Win % (model)', 'Travis Head', 'Mitchell Marsh', 'Jasprit Bumrah', '[W]', '4  FOUR!', 'Partnership: 45 (26)', '3:30:00 pm IST']) assert.ok(card.includes(s), 'missing ' + s + '\n' + card);
  assert.ok(!card.includes('David Warner'), 'dismissed batter must not be at the crease');
  assert.ok(card.length < 4096);
});

test('first innings card shows projected scores, not win %', () => {
  const m = { ...match, score: [{ inning: 'India Inning 1', r: 90, w: 2, o: 10 }], scorecard: [] };
  const card = E.liveCard(m, {}, tr('en'));
  assert.ok(card.includes('Projected (CRR / +1 / +2): 180 · 190 · 200'), card);
  assert.ok(!card.includes('Win %'));
});

test('card is HTML-safe and in the chosen language', () => {
  const card = E.liveCard({ ...match, name: 'A <b> & B' }, {}, tr('te'));
  assert.ok(card.includes('A &lt;b&gt; &amp; B'));
  assert.ok(card.includes('గెలుపు %'));
});

test('scorecard table lists both batting and bowling', () => {
  const t = E.scorecardText(match, tr('en'));
  assert.ok(t.includes('<pre>') && t.includes('Travis Head*') && t.includes('David Warner') && t.includes('Jasprit Bumrah'));
});

test('ball-by-ball replay splits a 4-ball jump exactly, or refuses to guess', async () => {
  const rows = E.bbbRows({ bbb: [
    { n: 1, inning: 0, over: 48, ball: 6, runs: 1, batsman: { name: 'A' }, bowler: { name: 'X' } },
    { n: 2, inning: 0, over: 49, ball: 1, runs: 4, batsman: { name: 'A' }, bowler: { name: 'Y' } },
    { n: 3, inning: 0, over: 49, ball: 2, runs: 1, extras: 1, extras_type: 'wd', batsman: { name: 'A' }, bowler: { name: 'Y' } },
    { n: 4, inning: 0, over: 49, ball: 2, runs: 0, dismissal: 'b Y', batsman: { name: 'A' }, bowler: { name: 'Y' } },
    { n: 5, inning: 0, over: 49, ball: 3, runs: 6, batsman: { name: 'B' }, bowler: { name: 'Y' } },
    { n: 6, inning: 0, over: 49, ball: 4, runs: 0, batsman: { name: 'B' }, bowler: { name: 'Y' } },
  ] });
  const prev = { idx: 1, inning: 'UAE Inning 1', r: 100, w: 2, b: 1 }, next = { idx: 1, inning: 'UAE Inning 1', r: 111, w: 3, b: 5 };
  const st = E.ballSteps(rows, prev, next);
  assert.ok(st, 'replay found');
  assert.deepEqual(st.map(x => x.label), ['4', 'Wd', 'W', '6', '0']);
  assert.deepEqual(st.map(x => `${x.r}/${x.w} ${E.overs(x.b)}`), ['104/2 0.2', '105/2 0.2', '105/3 0.3', '111/3 0.4', '111/3 0.5']);
  assert.equal(E.ballSteps(rows, prev, { ...next, r: 115 }), null, 'does not add up -> no guessing');
});
