import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHistory } from '../history.mjs';

test('venueStats summarises real stored matches per ground and format', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hv-'));
  const M = (d, t, w, a, b) => ({ id: d, d, t, v: 'Al Amerat Cricket Stadium', c: 'Muscat', tm: ['Oman', 'Canada'], w, res: '5 wickets', sc: [{ t: 'Oman', r: a, w: 5, b: 120 }, { t: 'Canada', r: b, w: 8, b: 120 }], y: +d.slice(0, 4) });
  fs.writeFileSync(path.join(dir, 'meta.json'), '{}');
  fs.writeFileSync(path.join(dir, 'players.json'), '[]');
  fs.writeFileSync(path.join(dir, 'matches.ndjson'), [M('2024-01-01', 't20', 'Oman', 150, 120), M('2025-01-01', 't20', 'Canada', 130, 131), M('2025-06-01', 'odi', '', 200, 100)].map(x => JSON.stringify(x)).join('\n'));
  const h = createHistory({ dir, log() {} });
  const v = h.venueStats('Al Amerat Cricket Stadium, Muscat, Oman');
  assert.equal(v.n, 3);
  const t20 = v.rows.find(r => r.t === 't20');
  assert.deepEqual([t20.n, t20.avgFirst, t20.hi, t20.batFirst, t20.chase], [2, 140, 150, 1, 1]);
  assert.equal(v.rows.find(r => r.t === 'odi').nr, 1);
  assert.equal(h.venueStats('Nowhere Park').n, 0);
  assert.equal(h.venueStats('ab').n, 0);
});
