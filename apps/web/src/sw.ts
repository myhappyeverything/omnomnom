/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// Merges OneSignal's push/notificationclick handling into this same worker
// instead of registering a second, separate OneSignalSDKWorker.js — this is
// OneSignal's documented integration path for apps that already ship a
// custom service worker. Safe to load unconditionally: with no app configured
// client-side (see lib/oneSignal.ts), no push subscription is ever created,
// so this file just sits idle.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js')

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
