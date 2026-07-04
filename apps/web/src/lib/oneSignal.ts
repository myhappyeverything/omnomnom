// Thin wrapper around OneSignal's Web SDK (loaded via CDN script tag in
// index.html — see docs/cloudflare-setup.md for provisioning). The SDK talks
// to `window.OneSignal` through a deferred-callback queue so it works
// regardless of whether the CDN script has finished loading yet.

interface OneSignalPushSubscription {
  id: string | null
  optedIn: boolean
}

interface OneSignalSdk {
  init(options: {
    appId: string
    serviceWorkerPath: string
    allowLocalhostAsSecureOrigin?: boolean
  }): Promise<void>
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
      // Our own service worker (see src/sw.ts) already imports OneSignal's
      // worker script, so it — not a second, separate one — handles push.
      serviceWorkerPath: 'sw.js',
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    }),
  )
  return initPromise
}

/** Prompts the browser permission dialog and returns the resulting subscription id, or null if denied. */
export async function requestPushSubscription(): Promise<string | null> {
  await initOneSignal()
  return withSdk(async (sdk) => {
    await sdk.Notifications.requestPermission()
    return sdk.Notifications.permission ? sdk.User.PushSubscription.id : null
  })
}

/** Reads the current subscription id without prompting — null if not subscribed. */
export async function getPushSubscriptionId(): Promise<string | null> {
  await initOneSignal()
  return withSdk((sdk) => (sdk.Notifications.permission ? sdk.User.PushSubscription.id : null))
}
