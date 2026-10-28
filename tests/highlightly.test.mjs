import test from 'node:test'; import assert from 'node:assert/strict';
import { row, scoreOf, stateOf, createHighlightly } from '../highlightly.mjs';
test('scores: period arrays are summed, current strings parsed, numbers kept', () => {
  assert.deepEqual(scoreOf({ score: { homeTeam: [20, 25, 30], awayTeam: [22, 20] } }), { home: 75, away: 42 });
  assert.deepEqual(scoreOf({ score: { current: '2 - 1' } }), { home: 2, away: 1 });
  assert.deepEqual(scoreOf({ score: { homeTeam: 3, awayTeam: 0 } }), { home: 3, away: 0 });
  assert.deepEqual(scoreOf({}), { home: null, away: null });
});
test('states map to live / ended / upcoming', () => {
  assert.equal(stateOf({ description: 'In progress' }).live, true); assert.equal(stateOf({ description: 'Half time' }).live, true);
  assert.equal(stateOf({ description: 'Finished' }).ended, true); const s = stateOf({ description: 'Scheduled' }); assert.equal(s.live || s.ended, false);
});
test('row keeps only what was sent and paging stops on a short page', async () => {
  const m = { id: 5, league: 'NBA', date: '2026-10-28T01:00:00.000Z', homeTeam: { id: 3, displayName: 'Denver Nuggets', abbreviation: 'DEN', logo: 'x' }, awayTeam: { id: 4, name: 'Lakers' }, state: { description: 'In progress', period: 3, clock: 120, score: { homeTeam: [30, 28], awayTeam: [25] } } };
  const r = row('basketball', m); assert.equal(r.id, 'hlbasketball:5'); assert.equal(r.home.score, 58); assert.equal(r.live, true); assert.equal(r.away.name, 'Lakers');
  let calls = 0; const hl = createHighlightly({ key: 'k', fetchImpl: async (u, o) => { calls++; assert.equal(o.headers['x-rapidapi-key'], 'k'); return { ok: true, json: async () => ({ data: [m] }) } } });
  const L = await hl.list('basketball', '2026-10-28'); assert.equal(L.length, 1); assert.equal(calls, 1);
  await assert.rejects(() => hl.list('cricket', '2026-10-28'));
});
