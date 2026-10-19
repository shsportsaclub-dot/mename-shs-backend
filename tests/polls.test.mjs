import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('polls: one vote per voter, results only after voting, options fixed', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-')), port = 8251;
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: path.join(dir, 'd.json'), SESSION_SECRET: 'x', TRACKER: '0' }, stdio: 'ignore' });
  const U = p => `http://127.0.0.1:${port}/api/polls${p}`;
  const post = (b) => fetch(U('/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(async r => [r.status, await r.json()]);
  try {
    await new Promise(r => setTimeout(r, 1500));
    const A = { match: 'm1', poll: 'winner', opts: ['India', 'Pakistan'], guest: 'guest-aaaaaaaaaaaa' };
    let [st, j] = await post({ ...A, opt: 'India' }); assert.equal(st, 200); assert.equal(j.polls.winner.total, 1); assert.equal(j.polls.winner.counts.India, 1);
    [st, j] = await post({ ...A, opt: 'Pakistan' }); assert.equal(st, 409);                       // no second vote
    [st, j] = await post({ ...A, guest: 'guest-bbbbbbbbbbbb', opt: 'Pakistan', opts: ['x', 'y'] }); assert.equal(st, 200); assert.equal(j.polls.winner.total, 2);
    [st, j] = await post({ ...A, guest: 'guest-cccccccccccc', opt: 'Nobody' }); assert.equal(st, 400); // option must exist
    const nov = await (await fetch(U('?match=m1&guest=guest-dddddddddddd'))).json();               // not voted: no results
    assert.equal(nov.polls.winner.counts, null); assert.equal(nov.polls.winner.mine, null);
    const me = await (await fetch(U('?match=m1&guest=guest-aaaaaaaaaaaa'))).json(); assert.equal(me.polls.winner.mine, 'India');
    [st] = await post({ match: 'm1', poll: 'x', opt: 'a', opts: ['a', 'b'] }); assert.equal(st, 400); // no voter id
  } finally { srv.kill(); }
});
