import { neon } from '@neondatabase/serverless';

// Keep parameterized HTTP queries and the existing kv schema. Decode Postgres
// rows into the objects used by the account and match-journal code.
export function createNeonQuery(connectionString) {
  let sql;
  return async (query, params = []) => {
    if (!connectionString) throw new Error('DATABASE_URL is not configured');
    sql ||= neon(connectionString, { fullResults: true, arrayMode: false });
    return sql.query(query, params, { fetchOptions: { signal: AbortSignal.timeout(15000) } });
  };
}
