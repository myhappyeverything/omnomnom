/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// OneSignal gets its own separate service worker (public/OneSignalSDKWorker.js)
// rather than being merged into this one via importScripts. That merged
// pattern is OneSignal's own documented option, but in practice — confirmed
// against two other production apps that hit this exact problem — a custom
// Workbox worker and OneSignal fighting over the same scope from inside one
// script causes push to silently misbehave (subscriptions that never
// activate, or the wrong worker ending up as the page's actual controller).
// Registering OneSignal separately, at the plain default path it expects,
// is the version that's actually proven to work.

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
