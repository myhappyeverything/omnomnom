import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // Registration is handled entirely by the useRegisterSW hook in
      // UpdatePrompt.tsx (which also polls for updates on an interval), so
      // the plugin doesn't need to inject its own registration script too —
      // having both was a redundant double-registration.
      injectRegister: false,
      registerType: 'prompt',
      // Service worker registration is disabled in `vite dev` — module-worker
      // support for a dev-transformed SW graph is inconsistent across
      // browsers. Test PWA/offline/install behavior against a real build:
      // `npm run build:web && npm run preview -w @omnomnom/web`.
      devOptions: {
        enabled: false,
        type: 'module',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        id: '/',
        name: 'OmNomNom — Nutrition & Health Tracker',
        short_name: 'OmNomNom',
        description: 'Track calories, macros, water, and weight — beautifully.',
        theme_color: '#E07A4F',
        background_color: '#FFF3E7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
})
