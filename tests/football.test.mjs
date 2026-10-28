import test from 'node:test'; import assert from 'node:assert/strict';
import { createFootball } from '../sportmonks-football.mjs';
const part = (id, name, loc, short) => ({ id, name, short_code: short, image_path: 'https://cdn.sportmonks.com/x/' + id + '.png', meta: { location: loc } });
const fx = (extra = {}) => ({ id: 777, name: 'Home FC vs Away FC', starting_at: '2026-10-28 14:00:00', state_id: 2, state: { short_name: '2H' },
  participants: [part(1, 'Home FC', 'home', 'HOM'), part(2, 'Away FC', 'away', 'AWY')], league: { name: 'Premier League', image_path: 'l.png', country: { name: 'England' } },
  scores: [{ description: 'CURRENT', participant_id: 1, score: { goals: 2, participant: 'home' } }, { description: 'CURRENT', participant_id: 2, score: { goals: 1, participant: 'away' } }, { description: '1ST_HALF', participant_id: 1, score: { goals: 1, participant: 'home' } }],
  periods: [{ ticking: false, minutes: 45 }, { ticking: true, minutes: 67 }], ...extra });
const mk = (map) => async (url) => { const k = Object.keys(map).find(p => url.includes(p)); if (!k) return { ok: false, status: 404, json: async () => ({ message: 'nf' }) }; return { ok: true, status: 200, json: async () => ({ data: map[k] }) }; };
test('list merges live and day fixtures, reads goals, state and minute', async () => {
  const api = createFootball({ token: 't', fetchImpl: mk({ 'livescores/inplay': [fx()], 'fixtures/date/': [fx(), { ...fx({ id: 778, state_id: 1, state: { short_name: 'NS' }, scores: [], periods: [] }) }] }) });
  const r = await api.list('2026-10-28');
  assert.equal(r.length, 2); assert.equal(r[0].id, 'fb777'); assert.equal(r[0].live, true); assert.equal(r[0].minute, 67);
  assert.equal(r[0].home.goals, 2); assert.equal(r[0].away.goals, 1); assert.equal(r[0].league, 'Premier League'); assert.equal(r[1].started, false); assert.equal(r[1].home.goals, null);
});
test('match returns real events, line-ups with photos and statistics only', async () => {
  const f = fx({
    events: [{ id: 2, minute: 55, participant_id: 2, player_name: 'B Striker', type: { developer_name: 'GOAL' }, result: '1-1' }, { id: 1, minute: 12, participant_id: 1, player_name: 'A Forward', type: { developer_name: 'GOAL' }, result: '1-0' }, { id: 3, minute: 60, participant_id: 1, player_name: 'C Mid', type: { developer_name: 'YELLOWCARD' } }, { id: 4, minute: 70, participant_id: 1, player_name: 'New', related_player_name: 'Old', type: { developer_name: 'SUBSTITUTION' } }, { id: 5, minute: 71, type: { developer_name: 'SOMETHING_ELSE' } }],
    lineups: [{ team_id: 1, player_id: 9, player_name: 'A Forward', jersey_number: 9, formation_position: 11, type_id: 11, player: { image_path: 'p9.png' } }, { team_id: 1, player_id: 3, player_name: 'Keeper', jersey_number: 1, formation_position: 1, type_id: 11 }, { team_id: 1, player_id: 20, player_name: 'Sub', type_id: 12 }],
    statistics: [{ type: { name: 'Ball Possession %' }, location: 'home', data: { value: 55 } }, { type: { name: 'Ball Possession %' }, location: 'away', data: { value: 45 } }, { type: { name: 'Corners' }, location: 'home', data: { value: 4 } }], venue: { name: 'Home Park', city_name: 'Town' } });
  const api = createFootball({ token: 't', fetchImpl: mk({ 'fixtures/777': f }) });
  const m = await api.match('fb777');
  assert.deepEqual(m.events.map(e => e.kind), ['goal', 'goal', 'yellow', 'sub']); assert.equal(m.events[0].minute, 12);
  assert.equal(m.lineups[1].starters[0].name, 'Keeper'); assert.equal(m.lineups[1].starters[1].img, 'p9.png'); assert.equal(m.lineups[1].bench.length, 1);
  assert.deepEqual(m.stats.find(s => s.name === 'Corners'), { name: 'Corners', home: 4, away: null }); assert.equal(m.venue, 'Home Park, Town');
});
test('finished match from the real sample shape (state_id 5, empty scores) has no invented goals', async () => {
  const api = createFootball({ token: 't', fetchImpl: mk({ 'fixtures/date/': [{ id: 19722137, state_id: 5, name: 'Manchester City vs Ipswich Town', starting_at: '2026-10-17 14:00:00', participants: [part(116, 'Ipswich Town', 'away', 'IPS'), part(9, 'Manchester City', 'home', 'MCI')], scores: [], events: [], periods: [] }], 'livescores/inplay': [] }) });
  const r = (await api.list('2026-10-17'))[0];
  assert.equal(r.state, 'FT'); assert.equal(r.ended, true); assert.equal(r.home.name, 'Manchester City'); assert.equal(r.home.goals, null);
});
