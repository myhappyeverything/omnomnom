import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'node:path'
import viteConfig from './vite.config.ts'

// Node >=22 ships an experimental global `localStorage` that shadows jsdom's
// window.localStorage with a non-functional stub (missing .clear/.getItem/etc).
// `--no-experimental-webstorage` disables it so jsdom's real implementation
// wins — but that flag doesn't exist before Node 22 and makes the runtime
// itself refuse to start ("bad option") on older versions, which is exactly
// what CI pins (Node 20). Only pass it on a Node new enough to understand it.
const nodeMajorVersion = Number(process.versions.node.split('.')[0])
const execArgv = nodeMajorVersion >= 22 ? ['--no-experimental-webstorage'] : []

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
      poolOptions: {
        forks: {
          execArgv,
        },
      },
    },
  }),
)
