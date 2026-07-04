import { useRegisterSW } from 'virtual:pwa-register/react'

// How often an already-open tab checks for a new deployed version. The
// service worker only otherwise checks on registration (page load), so
// without this, someone who keeps the app open for days would never see an
// update prompt until they happened to fully reload.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  const dismiss = () => setNeedRefresh(false)

  return (
    <div className="bg-primary text-primary-foreground fixed inset-x-4 top-4 z-50 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg sm:inset-x-auto sm:left-4 sm:w-96">
      <p>A new version is ready.</p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="bg-primary-foreground text-primary rounded-full px-3 py-1.5 font-medium"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          Later
        </button>
      </div>
    </div>
  )
}
