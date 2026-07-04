import { ApiError, apiRequest } from '@/api/client'
import {
  addOutboxEntry,
  deleteOutboxEntry,
  getAllOutboxEntries,
  type OutboxEntry,
} from './outboxDb'

const CHANGE_EVENT = 'purple:outbox-changed'

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function subscribeOutboxChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback)
  return () => window.removeEventListener(CHANGE_EVENT, callback)
}

export async function getPendingCount(): Promise<number> {
  return (await getAllOutboxEntries()).length
}

/**
 * Runs `onlineCall` first. If it fails because the request never reached the
 * server — offline, DNS failure, the API unreachable — queues a replay and
 * returns a synthesized optimistic record instead of throwing. A real
 * `ApiError` (the server responded and rejected the request) is never
 * swallowed; only genuine network failures get queued.
 */
export async function createWithOfflineFallback<T>(options: {
  resource: OutboxEntry['resource']
  path: string
  body: Record<string, unknown>
  description: string
  onlineCall: () => Promise<T>
  buildOptimisticRecord: (clientId: string) => T & { pending: true }
}): Promise<T> {
  try {
    return await options.onlineCall()
  } catch (error) {
    if (error instanceof ApiError) throw error
    const clientId = crypto.randomUUID()
    await addOutboxEntry({
      resource: options.resource,
      operation: 'create',
      clientId,
      method: 'POST',
      path: options.path,
      body: { ...options.body, clientId },
      description: options.description,
      createdAt: new Date().toISOString(),
    })
    notifyChange()
    return options.buildOptimisticRecord(clientId)
  }
}

/**
 * Deleting a record that's still only a queued, unsynced creation just
 * cancels the queued create outright — there's nothing on the server yet to
 * delete. This is the app's conflict resolution for the one real race that
 * can happen offline: create-then-delete of the same record before it ever
 * syncs. The later action (delete) wins and the earlier one (create) is
 * discarded rather than both being replayed.
 */
export async function deleteWithOfflineFallback(options: {
  resource: OutboxEntry['resource']
  id: string
  pending: boolean
  onlineCall: () => Promise<void>
}): Promise<void> {
  if (options.pending) {
    const entries = await getAllOutboxEntries()
    const match = entries.find(
      (entry) =>
        entry.resource === options.resource &&
        entry.operation === 'create' &&
        entry.clientId === options.id,
    )
    if (match?.id !== undefined) {
      await deleteOutboxEntry(match.id)
      notifyChange()
    }
    return
  }
  try {
    await options.onlineCall()
  } catch (error) {
    if (error instanceof ApiError) throw error
    await addOutboxEntry({
      resource: options.resource,
      operation: 'delete',
      clientId: options.id,
      method: 'DELETE',
      path: `/api/${options.resource}/${options.id}`,
      body: undefined,
      description: `Delete ${options.resource} entry`,
      createdAt: new Date().toISOString(),
    })
    notifyChange()
  }
}

/**
 * Replays queued mutations in the order they were created. Stops at the
 * first entry that still can't reach the server, leaving the rest queued for
 * the next attempt — so ordering between entries for the same record is
 * preserved. An entry the server now rejects outright (bad payload, or a
 * delete target that's already gone) is dropped rather than retried forever.
 */
export async function drainOutbox(onEntrySynced: (entry: OutboxEntry) => void): Promise<void> {
  const entries = await getAllOutboxEntries()
  for (const entry of entries) {
    try {
      await apiRequest(entry.path, { method: entry.method, body: entry.body })
    } catch (error) {
      if (error instanceof ApiError) {
        const alreadyGone = entry.operation === 'delete' && error.status === 404
        if (!alreadyGone) {
          console.error(`Dropping outbox entry the server rejected: ${entry.description}`, error)
        }
        await deleteOutboxEntry(entry.id!)
        notifyChange()
        onEntrySynced(entry)
        continue
      }
      // Still can't reach the server — stop here and retry the rest later.
      return
    }
    await deleteOutboxEntry(entry.id!)
    notifyChange()
    onEntrySynced(entry)
  }
}
