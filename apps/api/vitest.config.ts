import { fileURLToPath } from 'node:url'
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config'

// wrangler.toml's migrations_dir is relative to wrangler.toml itself; resolve
// the same real directory here relative to this config file's own location.
const migrationsPath = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url))

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(migrationsPath)

  return {
    test: {
      setupFiles: ['./src/test/applyMigrations.ts'],
      poolOptions: {
        workers: {
          singleWorker: true,
          miniflare: {
            compatibilityDate: '2025-01-01',
            compatibilityFlags: ['nodejs_compat'],
            d1Databases: { DB: 'test-db' },
            kvNamespaces: ['CACHE'],
            r2Buckets: ['MEAL_IMAGES'],
            bindings: {
              TEST_MIGRATIONS: migrations,
              JWT_SECRET: 'test-jwt-secret',
              OPENAI_API_KEY: 'test-openai-api-key',
              ONESIGNAL_APP_ID: 'test-onesignal-app-id',
              ONESIGNAL_REST_API_KEY: 'test-onesignal-rest-api-key',
              USDA_FDC_API_KEY: 'test-usda-fdc-api-key',
              ENVIRONMENT: 'development',
              ALLOWED_ORIGIN: 'http://localhost:5173',
            },
          },
        },
      },
    },
  }
})
