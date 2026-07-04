/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// Merges OneSignal's push/notificationclick handling into this same worker
// instead of registering a second, separate service worker — this is
// OneSignal's documented integration path for apps that already ship a
// custom service worker. With no app configured client-side (see
// lib/oneSignal.ts), no push subscription is ever created, so this normally
// just sits idle. Wrapped in try/catch because importScripts is a hard,
// synchronous dependency for the whole service worker's evaluation — if
// OneSignal's CDN is ever unreachable or renames this file again, push
// notifications failing is fine, but that must never take down offline
// precaching and PWA updates (everything below this line) along with it.
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')
} catch (error) {
  console.error('OneSignal service worker script failed to load', error)
}

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

// A new service worker installs and then sits in the `waiting` state until
// something tells it to take over — that's what lets UpdatePrompt.tsx show
// "a new version is ready" and only activate it once the user clicks
// Reload. Calling skipWaiting() unconditionally here (as this used to) would
// skip that wait and activate immediately on install, silently taking over
// the current tab's network requests underneath a still-running old page —
// exactly the update-notification flow this file is paired with is meant to
// prevent. vite-plugin-pwa's client (useRegisterSW, via updateServiceWorker)
// sends this exact message when the user confirms.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
self.addEventListener('activate', () => self.clients.claim())
