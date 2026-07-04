import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'node:path'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Node >=22 ships an experimental global `localStorage` that shadows
      // jsdom's window.localStorage with a non-functional stub (missing
      // .clear/.getItem/etc). Disable it so jsdom's real implementation wins.
      poolOptions: {
        forks: {
          execArgv: ['--no-experimental-webstorage'],
        },
      },
    },
  }),
)
