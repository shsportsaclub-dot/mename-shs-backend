import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

test('editorial articles: types, drafts, publish, translations, correction history', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ed-')), port = 8275, file = path.join(dir, 'd.json'), SECRET = 'x';
  const sign = ph => { const b = Buffer.from(JSON.stringify({ p: ph, e: Date.now() + 1e9 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
  fs.writeFileSync(file, JSON.stringify({ users: { '+911': { nick: 'Ed', role: 'scorer' }, '+912': { nick: 'Fan', role: 'viewer' }, '+913': { nick: 'Adm', role: 'admin' }, '+914': { nick: 'Sc2', role: 'scorer' } }, shared: {} }));
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), DATA_FILE: file, SESSION_SECRET: SECRET, TRACKER: '0' }, stdio: ['ignore', 'inherit', 'inherit'] });
  const B = `http://127.0.0.1:${port}`, T = { e: sign('+911'), f: sign('+912'), a: sign('+913'), o: sign('+914') };
  const call = async (m, p, tk, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { authorization: 'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined }); return [r.status, await r.json().catch(() => ({}))]; };
  try {
    await new Promise(r => setTimeout(r, 1500));
    let st, j;
    [st] = await call('POST', '/api/editorial', T.f, { type: 'feature', h: 'A headline', body: 'Text' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/editorial', T.e, { type: 'nope', h: 'A headline', body: 'Text' }); assert.equal(st, 400);
    [st] = await call('POST', '/api/editorial', T.e, { type: 'feature', h: 'Hi', body: 'Text' }); assert.equal(st, 400);
    [st, j] = await call('POST', '/api/editorial', T.e, { type: 'player', h: 'Rising star <b>Ravi</b>', sub: 'Teen scores 100', body: 'Para one\nPara two', tr: { te: { h: 'ఉదయిస్తున్న తార', body: 'మొదటి భాగం' }, hi: { h: 'only headline' } } }); assert.equal(st, 200); const id = j.item.id;
    assert.equal(j.item.status, 'draft'); assert.ok(!/[<>]/.test(j.item.h)); assert.equal(j.item.body.length, 2); assert.ok(j.item.tr.te); assert.ok(!j.item.tr.hi);   // hindi needs headline AND text
    [st, j] = await call('GET', '/api/editorial'); assert.equal(j.items.length, 0);                                    // drafts are not public
    [st] = await call('GET', '/api/editorial?id=' + id); assert.equal(st, 404);
    [st, j] = await call('POST', '/api/editorial', T.e, { id, type: 'player', h: 'Rising star Ravi', body: 'Para one\nPara two', publish: true }); assert.equal(st, 200); assert.equal(j.item.status, 'published');
    [st, j] = await call('GET', '/api/editorial'); assert.equal(j.items.length, 1); assert.equal(j.items[0].typeName, 'Player spotlight');
    [st] = await call('POST', '/api/editorial', T.e, { id, type: 'player', h: 'Rising star Ravi Kumar', body: 'Para one\nPara two', publish: true }); assert.equal(st, 400);   // correction needs a note
    [st, j] = await call('POST', '/api/editorial', T.e, { id, type: 'player', h: 'Rising star Ravi Kumar', body: 'Para one\nPara two', publish: true, note: 'Added surname' }); assert.equal(st, 200); assert.equal(j.item.history.length, 1); assert.equal(j.item.history[0].prev.h, 'Rising star Ravi');
    [st, j] = await call('GET', '/api/editorial?id=' + id); assert.equal(j.item.history.length, 1); assert.equal(j.item.history[0].note, 'Added surname'); assert.equal(j.item.history[0].prev, undefined);   // readers see the note, not the old text
    [st] = await call('POST', '/api/editorial', T.o, { id, type: 'player', h: 'Hijacked headline', body: 'x y z', publish: true, note: 'nope nope' }); assert.equal(st, 403);
    [st] = await call('POST', '/api/editorial', T.a, { id, type: 'player', h: 'Rising star Ravi Kumar', body: 'Para one\nPara two', publish: true, note: 'none' }); assert.equal(st, 200);   // admin may edit
  } finally { srv.kill(); }
});
