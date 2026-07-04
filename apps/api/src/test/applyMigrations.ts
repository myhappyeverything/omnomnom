import { applyD1Migrations, env } from 'cloudflare:test'

// Runs once per test file (setupFiles) inside the Workers runtime; applies the
// real packages/db/migrations against the isolated-storage test D1 instance
// so every test file starts from an identical, fully-migrated schema.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
