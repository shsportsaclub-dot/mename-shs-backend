import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { buildBbb, buildFow, buildPartnerships, inningsTotals, createRecent } from '../recent.mjs';

const D = (batter, bowler, runs, extra = {}, wk = null, ns = 'N') => ({ batter, bowler, non_striker: ns, runs: { batter: runs, extras: 0, total: runs, ...(extra.runs || {}) }, ...(extra.extras ? { extras: extra.extras } : {}), ...(wk ? { wickets: [wk] } : {}) });
const RAW = () => ({
  info: { teams: ['Brisbane Heat Women', 'ACT Women'], dates: [new Date().toISOString().slice(0, 10)], match_type: 'T20', gender: 'female', officials: { umpires: ['SD Fry'] }, player_of_match: ['G Harris'], players: { 'Brisbane Heat Women': ['G Harris'], 'ACT Women': ['A Smith'] } },
  innings: [
    { team: 'ACT Women', overs: [
      { over: 0, deliveries: [D('A', 'B1', 0), D('A', 'B1', 4), D('A', 'B1', 1, { extras: { wides: 1 }, runs: { total: 2, extras: 2, batter: 0 } }), D('A', 'B1', 0, {}, { player_out: 'A', kind: 'bowled' }), D('C', 'B1', 6, {}, null, 'D'), D('C', 'B1', 1, {}, null, 'D'), D('D', 'B1', 2, {}, null, 'C')] },
      { over: 1, deliveries: [D('D', 'B2', 0, {}, { player_out: 'D', kind: 'caught', fielders: [{ name: 'F1' }] }, 'C')] } ] },
    { team: 'Brisbane Heat Women', overs: [{ over: 0, deliveries: [D('G', 'X', 4), D('G', 'X', 1)] }] }
  ]
});

test('bbb: innings numbered, overs 0-based, legal ball 1..6, wides keep the over, wickets described', () => {
  const b = buildBbb(RAW());
  assert.equal(b.length, 10);
  assert.deepEqual(b.slice(0, 7).map(x => x.ball), [1, 2, 2, 3, 4, 5, 6]);        // the wide is not a legal ball
  assert.ok(b[2].wide && b[2].runs === 2);
  assert.ok(b[3].wicket && b[3].out === 'A' && b[3].kind === 'bowled');
  assert.equal(b[1].bruns, 4); assert.equal(b[4].bruns, 6); assert.equal(b[2].bruns, 0);
  assert.equal(b[7].kind, 'caught'); assert.equal(b[7].fielder, 'F1');
  assert.equal(b[0].commentary, undefined);   // the page's own engine writes the words
  assert.equal(b[8].inning, 2); assert.equal(b[8].over, 0);
});
test('fall of wickets and partnerships follow the runs', () => {
  const f = buildFow(RAW())[0].fow;
  assert.deepEqual(f.map(x => [x.w, x.r, x.player]), [[1, 6, 'A'], [2, 15, 'D']]);
  const p = buildPartnerships(RAW())[0].partnerships;
  assert.deepEqual(p.map(x => x.runs), [6, 9, 0].slice(0, p.length));
  assert.equal(p[0].batsmen.includes('A'), true);
  assert.deepEqual(inningsTotals(RAW()).map(x => [x.r, x.w]), [[15, 2], [5, 0]]);
});
test('recent store: refresh from a zip, exact lookup only', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-')), zdir = fs.mkdtempSync(path.join(os.tmpdir(), 'rz-'));
  fs.writeFileSync(path.join(zdir, '111.json'), JSON.stringify(RAW()));
  const zip = path.join(zdir, 'r.zip');
  execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1],"w",zipfile.ZIP_DEFLATED);z.write(sys.argv[2],"111.json");z.close()', zip, path.join(zdir, '111.json')]);
  const r = createRecent({ dir, log() {} });
  const st = await r.refresh({ file: zip });
  assert.equal(st.ok, true); assert.equal(r.size(), 1);
  const d = RAW().info.dates[0];
  assert.ok(r.find('ACT Women', 'Brisbane Heat Women', d));
  assert.equal(r.find('ACT Women', 'Perth Scorchers', d), null);
  assert.equal(r.facts(r.find('ACT Women', 'Brisbane Heat Women', d)).pom[0], 'G Harris');
  assert.equal(createRecent({ dir, log() {} }).size(), 1);   // survives a restart
});
