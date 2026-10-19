import '../env.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createNeonQuery } from '../neon-postgres.mjs';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing: Neon sign-in and deploy must complete first');
const base = process.env.SH_VERIFY_BASE || 'http://127.0.0.1:8080';
const health = await fetch(base + '/health', { signal: AbortSignal.timeout(20000) });
assert.equal(health.status, 200);
assert.equal((await health.json()).database?.connected, true, 'App has not connected to Postgres');
const sql = createNeonQuery(process.env.DATABASE_URL);
const key = 'neon-check:' + crypto.randomUUID();
const value = JSON.stringify({ check: 'Scoring Heroes', nonce: crypto.randomUUID() });
try {
  await sql('insert into kv(k,v) values($1,$2)', [key, value]);
  const result = await sql('select v from kv where k=$1', [key]);
  assert.equal(result.rows[0]?.v, value);
  console.log('LIVE Neon PASS: app connected; parameterized Postgres write/read verified');
} finally {
  await sql('delete from kv where k=$1', [key]);
}
console.log('LIVE Neon PASS: verification record removed');
