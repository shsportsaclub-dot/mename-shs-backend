# Neon Postgres connection

This Node API and frontend continue to run on Render. Neon provides Postgres.
The existing `kv` schema stores accounts, shared matches, polls, and journals;
parameterized queries now use the official Neon HTTP driver.

Target: organization `org-hidden-bar-57162845`, project
`winter-sun-54416595`, branch `production`.

```sh
npx neon@latest init -y --org-id org-hidden-bar-57162845 --project-id winter-sun-54416595 --branch production --services postgres
npx neon@latest deploy
npm run build
npm start
```

Neon CLI authentication must complete before deployment or environment pull.
The CLI can write the local link while offline; that is not provisioning proof.
`.neon`, `.env`, and `.env.local` are ignored by Git. Existing process environment
values take priority over `.env.local`, then `.env`. No credentials belong in code.
Render does not receive local environment files automatically: its `DATABASE_URL`
must be set through the Render environment as well.

`GET /health` exposes only `database.configured` and `database.connected`, never
the URL. `connected` describes startup initialization, not continuous availability.
If initialization fails the existing local-file fallback remains active.

```sh
npm run test:neon
# With the app running and a real DATABASE_URL available:
npm run verify:neon
```

`test:neon` starts the real HTTP app with an isolated SQL protocol fixture. It
checks env loading, database row decoding, authenticated match saving, restoration
after deleting local state and restarting, and disconnected startup status.
It does not prove access to a hosted Neon database.

`verify:neon` requires a live app reporting `database.connected=true`, then writes,
reads, and removes a unique verification key through the same database adapter.
It never changes user accounts or match records. Set `SH_VERIFY_BASE` to check a
different app address; its database must match `DATABASE_URL`.

`npm run build` checks server syntax, embedded browser JavaScript, and required
PWA assets. This repository serves plain JavaScript and needs no transpilation.
