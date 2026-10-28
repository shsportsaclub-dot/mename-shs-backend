import test from 'node:test'; import assert from 'node:assert/strict';
import { row, createLiveTennis } from '../livetennis.mjs';
test('tennis row: sets won as score, games per set as chips, points in the state', () => {
  const r = row({ id: 7, tournament: 'ATP Paris', players: { p1: { name: 'Carlos Alcaraz' }, p2: { name: 'Jannik Sinner' } }, score: { sets: [1, 1], games: [[6, 3, 2], [4, 6, 1]], points: '40-30', server: 1, is_tiebreak: false } });
  assert.equal(r.id, 'hltennis:7'); assert.equal(r.home.score, 1); assert.deepEqual(r.periods, [[6, 4], [3, 6], [2, 1]]); assert.equal(r.state, 'Live 40-30'); assert.equal(r.home.short, 'Alcaraz'); assert.equal(r.live, true);
});
test('tennis list sends the bearer key and reads the data envelope; missing fields stay empty', async () => {
  const t = createLiveTennis({ key: 'k', fetchImpl: async (u, o) => { assert.match(u, /\/matches\?status=live/); assert.equal(o.headers.Authorization, 'Bearer k'); return { ok: true, json: async () => ({ data: [{ id: 1, players: { p1: { name: 'A B' }, p2: { name: 'C D' } } }] }) } } });
  const L = await t.list(); assert.equal(L.length, 1); assert.equal(L[0].home.score, null); assert.deepEqual(L[0].periods, []);
  const bad = createLiveTennis({ key: 'k', fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: 'upgrade_required' }) }) }); await assert.rejects(() => bad.list(), /upgrade_required/);
});
