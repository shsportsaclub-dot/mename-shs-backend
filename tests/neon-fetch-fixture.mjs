// SQL-over-HTTP fixture only, never imported by production. The normal Neon
// driver still constructs/decodes each request; no live database is claimed.
import fs from 'node:fs';
const file = process.env.NEON_FIXTURE_FILE;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url) !== 'https://api.neon.tech/sql') return originalFetch(url, options);
  if (process.env.NEON_FIXTURE_FAIL === '1') return new Response('unavailable', { status: 503 });
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { query, params = [] } = JSON.parse(options.body);
  let rows = [], fields = [];
  if (/^select v from kv/i.test(query)) {
    fields = [{ name: 'v', dataTypeID: 25 }];
    if (state[params[0]] !== undefined) rows = [[state[params[0]]]];
  } else if (/^insert into kv/i.test(query)) {
    state[params[0]] = params[1];
    fs.writeFileSync(file, JSON.stringify(state));
  } else if (!/^create table/i.test(query)) throw new Error('Unexpected fixture SQL');
  return Response.json({ rows, fields, rowCount: rows.length, command: 'SELECT', rowAsArray: true });
};
