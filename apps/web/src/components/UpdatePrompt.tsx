import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  const dismiss = () => setNeedRefresh(false)

  return (
    <div className="fixed inset-x-4 top-4 z-50 flex items-center justify-between gap-3 rounded-2xl bg-violet-900 px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:left-4 sm:w-96">
      <p>A new version of Purple is ready.</p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="rounded-full bg-white px-3 py-1.5 font-medium text-violet-900"
        >
          Reload
        </button>
        <button type="button" onClick={dismiss} className="text-white/80 hover:text-white">
          Later
        </button>
      </div>
    </div>
  )
}
