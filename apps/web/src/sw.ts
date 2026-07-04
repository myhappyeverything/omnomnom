/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// Precache the app shell (JS/CSS/fonts/icons + index.html) at install time.
// __WB_MANIFEST is injected by vite-plugin-pwa's injectManifest build step.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Every client-side route (React Router) falls back to the cached app shell
// when offline, so deep links work offline once the shell has been fetched
// at least once — the same effect as generateSW's `navigateFallback` option,
// implemented explicitly here because Stage 19's background-sync outbox
// needs a hand-written service worker to extend.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  }),
)

self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())
