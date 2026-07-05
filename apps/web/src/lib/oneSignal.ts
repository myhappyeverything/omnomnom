// Thin wrapper around OneSignal's Web SDK (loaded via CDN script tag in
// index.html — see docs/cloudflare-setup.md for provisioning). The SDK talks
// to `window.OneSignal` through a deferred-callback queue so it works
// regardless of whether the CDN script has finished loading yet.

interface OneSignalPushSubscription {
  id: string | null
  optedIn: boolean
  optIn(): Promise<void>
}

interface OneSignalSdk {
  init(options: { appId: string; allowLocalhostAsSecureOrigin?: boolean }): Promise<void>
  Notifications: {
    permission: boolean
    requestPermission(): Promise<void>
  }
  User: {
    PushSubscription: OneSignalPushSubscription
  }
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(sdk: OneSignalSdk) => void | Promise<void>>
  }
}

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined

export function isPushSupported(): boolean {
  return (
    Boolean(APP_ID) &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )
}

function withSdk<T>(fn: (sdk: OneSignalSdk) => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isPushSupported()) {
      reject(new Error('Push notifications are not supported or configured in this browser'))
      return
    }
    window.OneSignalDeferred ??= []
    window.OneSignalDeferred.push(async (sdk) => {
      try {
        resolve(await fn(sdk))
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  })
}

let initPromise: Promise<void> | null = null

/** Idempotent — safe to call from multiple components; only initializes once. */
export function initOneSignal(): Promise<void> {
  if (!isPushSupported()) return Promise.resolve()
  initPromise ??= withSdk((sdk) =>
    sdk.init({
      appId: APP_ID!,
      // No serviceWorkerPath override — OneSignal registers its own worker
      // at the default public/OneSignalSDKWorker.js (see that file), kept
      // entirely separate from our own Workbox worker (src/sw.ts). Merging
      // the two into one script via importScripts is OneSignal's documented
      // alternative, but two other apps hit the same failure mode with it in
      // practice: a custom Workbox worker and OneSignal end up fighting over
      // the same scope, and push silently misbehaves. Separate workers is
      // the version that's actually proven to work.
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    }),
  )
  return initPromise
}

// After the browser grants permission, OneSignal still needs a moment to
// register the subscription with the Push API and its own backend before
// `PushSubscription.id` is populated — reading it immediately after
// `requestPermission()` resolves can see `null` even on a real grant, which
// previously surfaced as a false "permission was not granted" error (and
// then repeated on every retry, since the OS-level prompt only appears once).
async function waitForSubscriptionId(
  sdk: OneSignalSdk,
  timeoutMs = 6000,
  pollIntervalMs = 300,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (sdk.User.PushSubscription.id) return sdk.User.PushSubscription.id
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }
  return sdk.User.PushSubscription.id
}

/** Prompts the browser permission dialog and returns the resulting subscription id, or null if denied. */
export async function requestPushSubscription(): Promise<string | null> {
  await initOneSignal()
  return withSdk(async (sdk) => {
    await sdk.Notifications.requestPermission()
    // Checking the browser's own Notification.permission here, not
    // sdk.Notifications.permission: the latter is OneSignal's own mirror of
    // that state, updated via its internal listeners some time after the
    // browser's real permission flips — reading it synchronously right after
    // requestPermission() resolves could still see the pre-grant value and
    // wrongly report "not granted" even on a real grant. The native property
    // is authoritative and updates the instant the user responds to the
    // prompt, before requestPermission()'s own promise even settles.
    if (Notification.permission !== 'granted') return null
    // OS-level permission being granted doesn't automatically activate the
    // OneSignal subscription — it can stay `optedIn: false` until this is
    // called explicitly, in which case PushSubscription.id/token never
    // populate and waitForSubscriptionId below times out even though the
    // user genuinely granted permission.
    if (!sdk.User.PushSubscription.optedIn) await sdk.User.PushSubscription.optIn()
    return waitForSubscriptionId(sdk)
  })
}

/** Reads the current subscription id without prompting — null if not subscribed. */
export async function getPushSubscriptionId(): Promise<string | null> {
  await initOneSignal()
  return withSdk((sdk) =>
    Notification.permission === 'granted' ? sdk.User.PushSubscription.id : null,
  )
}
