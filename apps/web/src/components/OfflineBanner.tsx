import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePendingOutboxCount } from '@/hooks/useOutbox'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const pendingCount = usePendingOutboxCount()

  if (isOnline && pendingCount === 0) return null

  const message = !isOnline
    ? pendingCount > 0
      ? `You're offline — ${pendingCount} change${pendingCount === 1 ? '' : 's'} queued to sync.`
      : "You're offline — changes will sync once you're back online."
    : `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}…`

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-neutral-900 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 text-sm text-white"
    >
      <span className="h-2 w-2 rounded-full bg-white/70" aria-hidden="true" />
      {message}
    </div>
  )
}
