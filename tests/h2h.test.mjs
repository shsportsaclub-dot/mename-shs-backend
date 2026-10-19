import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { createHistory } from '../history.mjs';

test('head to head counts only meetings of the two teams, same format', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2h-'));
  const row = (id, d, tm, w, t = 'odi') => ({ id, d, tm, w, t, y: +d.slice(0, 4), g: 'male', v: 'Ground', c: 'City', res: w ? '5 wickets' : '', sc: [{ t: tm[0], r: 200, w: 5, b: 300 }, { t: tm[1], r: 150, w: 10, b: 250 }] });
  const rows = [row('1', '2026-01-01', ['Nepal', 'Oman'], 'Nepal'), row('2', '2025-01-01', ['Oman', 'Nepal'], 'Oman'), row('3', '2024-01-01', ['Nepal', 'Oman'], ''), row('4', '2024-02-01', ['Nepal', 'Oman'], 'Nepal', 't20'), row('5', '2024-03-01', ['Nepal', 'UAE'], 'Nepal')];
  fs.writeFileSync(path.join(dir, 'matches.ndjson'), rows.map(r => JSON.stringify(r)).join('\n'));
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ built: 1, matches: rows.length }));
  fs.writeFileSync(path.join(dir, 'players.json'), '[]');
  const h = createHistory({ dir, log() {} }); h.load();
  const x = h.h2h('Nepal', 'Oman', 'odi');
  assert.equal(x.n, 3); assert.equal(x.a.wins, 1); assert.equal(x.b.wins, 1); assert.equal(x.nr, 1);
  assert.equal(x.recent[0].d, '2026-01-01'); assert.equal(x.from, '2024-01-01');
  assert.equal(h.h2h('Nepal', 'Oman', 't20').n, 1); assert.equal(h.h2h('Nepal', 'Oman').n, 4);
  assert.equal(h.h2h('Nepal', 'Japan', 'odi').n, 0); assert.equal(h.h2h('', 'Oman').n, 0);
});
