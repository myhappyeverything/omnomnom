import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-neutral-900 px-4 py-2 text-sm text-white"
    >
      <span className="h-2 w-2 rounded-full bg-white/70" aria-hidden="true" />
      You&apos;re offline — changes will sync once you&apos;re back online.
    </div>
  )
}
