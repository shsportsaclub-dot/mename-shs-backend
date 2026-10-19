import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { answersFrom, board } from '../poll-score.mjs';

test('answers come only from the provider figures', () => {
  const m = { ended: true, status: 'Nepal won by 5 wickets', score: [{ r: 210, w: 4 }, { r: 211, w: 5 }] };
  const a = answersFrom(m, [{ batting: [{ r: 101 }, { r: 20 }] }, { batting: [{ r: 40 }] }], { winner: ['Nepal', 'Oman'] });
  assert.deepEqual(a, { winner: 'Nepal', big: 'Yes', century: 'Yes' });
  assert.deepEqual(answersFrom({ ...m, status: 'Match tied' }, null, { winner: ['Nepal', 'Oman'] }), { big: 'Yes' });   // a tie proves no winner
  assert.deepEqual(answersFrom({ ...m, ended: false }, null, { winner: ['Nepal', 'Oman'] }), {});                         // still running
  assert.equal(answersFrom({ ...m, score: [{ r: 150 }] }, null, {}).big, undefined);                                      // one innings cannot prove "no 200"
  assert.equal(answersFrom(m, [{ batting: [{ r: 99 }] }], {}).century, undefined);                                        // scorecard shorter than the innings: unproven
  assert.equal(answersFrom({ ended: true, status: 'Oman won by 3 runs', score: [] }, null, { winner: ['Nepal', 'Oman'] }).winner, 'Oman');
});
test('board counts only signed-in voters and scored polls', () => {
  const polls = { m1: { winner: { votes: { 'u:1': 'Nepal', 'u:2': 'Oman', 'g:abcdefghijkl': 'Nepal' } }, top: { votes: { 'u:1': 'X' } } } };
  const b = board(polls, { m1: { winner: 'Nepal', at: 1 } }, { 1: { nick: 'Asha' }, 2: { nick: 'Ravi' } });
  assert.deepEqual(b.top.map(x => [x.name, x.pts]), [['Asha', 10], ['Ravi', 0]]); assert.equal(b.rank('u:2'), 2);
});
test('leaderboard route reads saved results', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pls-')), port = 8263, f = path.join(dir, 'd.json');
  fs.writeFileSync(f, JSON.stringify({ users: { 9111: { nick: 'Asha', phone: '9111' } }, shared: {}, polls: { m1: { winner: { opts: ['Nepal', 'Oman'], votes: { 'u:9111': 'Nepal', 'g:abcdefghijkl': 'Oman' } } } }, pollRes: { m1: { winner: 'Nepal', at: 1 } } }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: f, SESSION_SECRET: 'x', TRACKER: '0', CRIC_API_KEY: '' }, stdio: 'ignore' });
  try {
    await new Promise(r => setTimeout(r, 1500));
    const j = await (await fetch(`http://127.0.0.1:${port}/api/polls/leaderboard?guest=guest-aaaaaaaaaaaa`)).json();
    assert.equal(j.ok, true); assert.deepEqual(j.top.map(x => [x.name, x.pts, x.ok, x.n]), [['Asha', 10, 1, 1]]);
    const v = await (await fetch(`http://127.0.0.1:${port}/api/polls?match=m1&guest=abcdefghijkl`)).json();
    assert.equal(v.polls.winner.answer, 'Nepal'); assert.equal(v.polls.winner.points, 0);
  } finally { srv.kill(); }
});
