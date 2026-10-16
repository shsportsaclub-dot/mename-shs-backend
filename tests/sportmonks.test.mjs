import test from 'node:test';
import assert from 'node:assert/strict';
import { createSportmonks } from '../sportmonks.mjs';

// The fixture fields below are the ones in the Sportmonks docs (GET Fixture by ID). The nested include shapes
// (batting / bowling / lineup / balls rows) follow the documented field names where the docs give them.
import { fixture } from './sportmonks-fixture.mjs';
const stub = async url => ({ ok: true, status: 200, json: async () => ({ data: /fixtures\?/.test(url) ? [fixture] : fixture }) });
const sm = createSportmonks({ token: 't', fetchImpl: stub });

test('live list is converted to the app shape', async () => {
  const [m] = await sm.liveMatches();
  assert.equal(m.id, 'sm3'); assert.equal(m.type, 't20i'); assert.equal(m.ended, true); assert.equal(m.started, true);
  assert.equal(m.venue, 'Eden Park, Auckland'); assert.deepEqual(m.teams.map(t => t.short), ['SA', 'AUS']);
  assert.deepEqual(m.score, [{ inning: 'Australia Inning 1', r: 150, w: 5, o: 20 }, { inning: 'South Africa Inning 1', r: 151, w: 4, o: 16.4 }]);
});
test('match info carries officials, toss, winner and player of the match', async () => {
  const i = await sm.matchInfo(3);
  assert.deepEqual(i.umpires, ['Umpire One', 'Umpire Two']); assert.equal(i.thirdUmpire, 'Umpire TV'); assert.equal(i.referee, 'Ref Eree');
  assert.equal(i.playerOfTheMatch, 'Star Player'); assert.equal(i.tossWinner, 'Australia'); assert.equal(i.tossChoice, 'batting'); assert.equal(i.matchWinner, 'South Africa');
});
test('scorecard has batting, bowling and fall of wickets in order', async () => {
  const { scorecard } = await sm.scorecard(3);
  assert.equal(scorecard.length, 2);
  const a = scorecard[0];
  assert.equal(a.inning, 'Australia Inning 1'); assert.equal(a.batting[0].batsman.name, 'Aaron Finch'); assert.equal(a.batting[0]['4s'], 5);
  assert.deepEqual(a.fow.map(f => [f.r, f.w, f.player]), [[40, 1, 'D Short'], [90, 2, 'Aaron Finch']]);
  assert.equal(scorecard[1].batting[0]['dismissal-text'], 'batting');
  assert.equal(a.bowling[0].w, 2);
});
test('lineup gives the playing XI and leaves substitutes out of it', async () => {
  const sq = await sm.squad(3);
  assert.equal(sq[1].shortname, 'AUS'); assert.deepEqual(sq[1].players.map(p => [p.name, p.playing]), [['Aaron Finch', true], ['Bench Guy', false]]);
});
test('ball by ball maps runs, fours and wickets', async () => {
  const b = await sm.bbb(3);
  assert.equal(b.length, 2); assert.equal(b[0].runs, 4); assert.equal(b[1].wicket, true);
});
