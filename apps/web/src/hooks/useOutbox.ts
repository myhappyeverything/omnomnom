import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { drainOutbox, getPendingCount, subscribeOutboxChange } from '@/lib/outbox'
import { useOnlineStatus } from './useOnlineStatus'

const POLL_INTERVAL_MS = 30_000

/** Read-only pending-sync count — safe anywhere, including pre-auth (the offline banner). */
export function usePendingOutboxCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      void getPendingCount().then((n) => {
        if (!cancelled) setCount(n)
      })
    }
    refresh()
    const unsubscribe = subscribeOutboxChange(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return count
}

/**
 * Drains the offline outbox automatically — on mount, whenever the browser
 * comes back online, and on a periodic poll while online (`navigator.onLine`
 * is unreliable on its own, e.g. behind a captive portal). Mount once for an
 * authenticated session, since draining hits authenticated endpoints.
 */
export function useOutboxSync(): { isSyncing: boolean } {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!isOnline) return
    let cancelled = false

    async function sync() {
      setIsSyncing(true)
      try {
        const syncedResources = new Set<string>()
        await drainOutbox((entry) => syncedResources.add(entry.resource))
        if (!cancelled) {
          for (const resource of syncedResources) {
            void queryClient.invalidateQueries({ queryKey: [resource] })
          }
        }
      } finally {
        if (!cancelled) setIsSyncing(false)
      }
    }

    void sync()
    const interval = window.setInterval(() => void sync(), POLL_INTERVAL_MS)
    const unsubscribe = subscribeOutboxChange(() => void sync())

    return () => {
      cancelled = true
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [isOnline, queryClient])

  return { isSyncing }
}
