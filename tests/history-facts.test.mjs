import test from 'node:test';
import assert from 'node:assert/strict';
import { processMatch, factsOf } from '../history.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { createHistory } from '../history.mjs';

const J = (over = {}) => ({ info: { teams: ['Brisbane Heat', 'Sydney Sixers'], dates: ['2026-10-16'], match_type: 'T20', gender: 'female', venue: 'Raby Oval No. 1', city: 'Sydney',
  officials: { umpires: ['SD Fry', 'SJ Nogajski'], tv_umpires: ['P Wilson'], match_referees: ['JJ Crowe'] },
  toss: { winner: 'Brisbane Heat', decision: 'bat' }, player_of_match: ['G Wareham'],
  players: { 'Brisbane Heat': ['A', 'B'], 'Sydney Sixers': ['C', 'D'] }, outcome: { winner: 'Brisbane Heat', by: { wickets: 5 } }, ...over }, innings: [] });

test('processMatch keeps officials, toss and XI (recent years)', () => {
  const m = processMatch(J(), 'x1', new Map());
  assert.deepEqual(m.of, { u: ['SD Fry', 'SJ Nogajski'], tv: ['P Wilson'], rf: ['JJ Crowe'] });
  assert.deepEqual(m.toss, { w: 'Brisbane Heat', d: 'bat' });
  assert.ok(m.xi['Sydney Sixers']);
  assert.equal(factsOf({ players: { A: ['x'] } }, 2019).xi, undefined);
});

test('matchFacts: exact one match within one day, women/men suffix ignored, ambiguity refused', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-'));
  const a = processMatch(J(), 'x1', new Map());
  const b = { ...a, id: 'x2', d: '2026-10-17' };
  fs.writeFileSync(path.join(dir, 'meta.json'), '{}'); fs.writeFileSync(path.join(dir, 'players.json'), '[]');
  fs.writeFileSync(path.join(dir, 'matches.ndjson'), JSON.stringify(a));
  let h = createHistory({ dir, log() {} });
  assert.equal(h.matchFacts('Sydney Sixers Women', 'Brisbane Heat Women', '2026-10-17').id, 'x1');
  assert.equal(h.matchFacts('Sydney Sixers', 'Perth Scorchers', '2026-10-16'), null);
  assert.equal(h.matchFacts('Sydney Sixers', 'Brisbane Heat', '2026-10-25'), null);
  fs.writeFileSync(path.join(dir, 'matches.ndjson'), [a, b].map(x => JSON.stringify(x)).join('\n'));
  h = createHistory({ dir, log() {} });
  assert.equal(h.matchFacts('Sydney Sixers', 'Brisbane Heat', '2026-10-16'), null);   // two candidates: no guess
});
