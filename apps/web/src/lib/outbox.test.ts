import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWithOfflineFallback, deleteWithOfflineFallback, drainOutbox } from './outbox'
import { deleteOutboxEntry, getAllOutboxEntries } from './outboxDb'
import { ApiError, apiRequest } from '@/api/client'
import type * as ApiClientModule from '@/api/client'

vi.mock('@/api/client', async (importActual) => {
  const actual = await importActual<typeof ApiClientModule>()
  return {
    ...actual,
    apiRequest: vi.fn(),
  }
})

const mockedApiRequest = vi.mocked(apiRequest)

const NETWORK_FAILURE = () => new TypeError('Failed to fetch')

/** Drains the real (fake-indexeddb-backed) database between tests. */
async function clearOutboxDb() {
  const entries = await getAllOutboxEntries()
  for (const entry of entries) {
    if (entry.id !== undefined) await deleteOutboxEntry(entry.id)
  }
}

beforeEach(() => {
  mockedApiRequest.mockReset()
})

afterEach(async () => {
  await clearOutboxDb()
})

describe('createWithOfflineFallback', () => {
  it('returns the real record on success without queuing anything', async () => {
    const record = { id: 'server-1', totalMl: 500 }
    const onlineCall = vi.fn().mockResolvedValue(record)

    const result = await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 500 },
      description: 'Log water',
      onlineCall,
      buildOptimisticRecord: (clientId) => ({ id: clientId, totalMl: 500, pending: true as const }),
    })

    expect(result).toEqual(record)
    expect(onlineCall).toHaveBeenCalledOnce()
    expect(await getAllOutboxEntries()).toHaveLength(0)
  })

  it('re-throws a real ApiError instead of queuing', async () => {
    const onlineCall = vi.fn().mockRejectedValue(new ApiError('Bad request', 400))

    await expect(
      createWithOfflineFallback({
        resource: 'water',
        path: '/api/water',
        body: { totalMl: 500 },
        description: 'Log water',
        onlineCall,
        buildOptimisticRecord: (clientId) => ({
          id: clientId,
          totalMl: 500,
          pending: true as const,
        }),
      }),
    ).rejects.toBeInstanceOf(ApiError)

    expect(await getAllOutboxEntries()).toHaveLength(0)
  })

  it('queues an entry and returns an optimistic pending record on network failure', async () => {
    const onlineCall = vi.fn().mockRejectedValue(NETWORK_FAILURE())

    const result = await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 750 },
      description: 'Log water',
      onlineCall,
      buildOptimisticRecord: (clientId) => ({
        id: clientId,
        totalMl: 750,
        pending: true as const,
      }),
    })

    expect(result.pending).toBe(true)
    expect(result.totalMl).toBe(750)

    const entries = await getAllOutboxEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.resource).toBe('water')
    expect(entries[0]?.operation).toBe('create')
    expect(entries[0]?.method).toBe('POST')
    expect(entries[0]?.path).toBe('/api/water')
    expect((entries[0]?.body as { clientId: string }).clientId).toBe(result.id)
  })
})

describe('deleteWithOfflineFallback', () => {
  it('cancels a still-pending queued create with no network call at all', async () => {
    const onlineCall = vi.fn().mockRejectedValue(NETWORK_FAILURE())
    const created = await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 500 },
      description: 'Log water',
      onlineCall,
      buildOptimisticRecord: (clientId) => ({
        id: clientId,
        totalMl: 500,
        pending: true as const,
      }),
    })
    expect(await getAllOutboxEntries()).toHaveLength(1)

    mockedApiRequest.mockClear()
    const deleteOnlineCall = vi.fn().mockResolvedValue(undefined)

    await deleteWithOfflineFallback({
      resource: 'water',
      id: created.id,
      pending: true,
      onlineCall: deleteOnlineCall,
    })

    expect(await getAllOutboxEntries()).toHaveLength(0)
    expect(deleteOnlineCall).not.toHaveBeenCalled()
    expect(mockedApiRequest).not.toHaveBeenCalled()
  })

  it('deletes a synced record successfully with no queuing', async () => {
    const onlineCall = vi.fn().mockResolvedValue(undefined)

    await deleteWithOfflineFallback({
      resource: 'water',
      id: 'server-1',
      pending: false,
      onlineCall,
    })

    expect(onlineCall).toHaveBeenCalledOnce()
    expect(await getAllOutboxEntries()).toHaveLength(0)
  })

  it('re-throws a real ApiError instead of queuing a delete', async () => {
    const onlineCall = vi.fn().mockRejectedValue(new ApiError('Forbidden', 403))

    await expect(
      deleteWithOfflineFallback({
        resource: 'water',
        id: 'server-1',
        pending: false,
        onlineCall,
      }),
    ).rejects.toBeInstanceOf(ApiError)

    expect(await getAllOutboxEntries()).toHaveLength(0)
  })

  it('queues a delete entry for a synced record on network failure', async () => {
    const onlineCall = vi.fn().mockRejectedValue(NETWORK_FAILURE())

    await deleteWithOfflineFallback({
      resource: 'weight',
      id: 'server-42',
      pending: false,
      onlineCall,
    })

    const entries = await getAllOutboxEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.resource).toBe('weight')
    expect(entries[0]?.operation).toBe('delete')
    expect(entries[0]?.method).toBe('DELETE')
    expect(entries[0]?.path).toBe('/api/weight/server-42')
  })
})

describe('drainOutbox', () => {
  it('replays a queued entry successfully, removes it, and calls onEntrySynced', async () => {
    await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 500 },
      description: 'Log water',
      onlineCall: vi.fn().mockRejectedValue(NETWORK_FAILURE()),
      buildOptimisticRecord: (clientId) => ({
        id: clientId,
        totalMl: 500,
        pending: true as const,
      }),
    })
    expect(await getAllOutboxEntries()).toHaveLength(1)

    mockedApiRequest.mockResolvedValueOnce({ id: 'server-1', totalMl: 500 })
    const onEntrySynced = vi.fn()

    await drainOutbox(onEntrySynced)

    expect(await getAllOutboxEntries()).toHaveLength(0)
    expect(onEntrySynced).toHaveBeenCalledOnce()
    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/api/water',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('leaves the entry queued and stops without throwing on a network failure replay', async () => {
    await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 500 },
      description: 'Log water',
      onlineCall: vi.fn().mockRejectedValue(NETWORK_FAILURE()),
      buildOptimisticRecord: (clientId) => ({
        id: clientId,
        totalMl: 500,
        pending: true as const,
      }),
    })

    mockedApiRequest.mockRejectedValueOnce(NETWORK_FAILURE())
    const onEntrySynced = vi.fn()

    await expect(drainOutbox(onEntrySynced)).resolves.toBeUndefined()

    expect(await getAllOutboxEntries()).toHaveLength(1)
    expect(onEntrySynced).not.toHaveBeenCalled()
  })

  it('stops replay at the first failing entry, preserving order for later entries', async () => {
    await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 100 },
      description: 'First',
      onlineCall: vi.fn().mockRejectedValue(NETWORK_FAILURE()),
      buildOptimisticRecord: (clientId) => ({ id: clientId, totalMl: 100, pending: true as const }),
    })
    await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: 200 },
      description: 'Second',
      onlineCall: vi.fn().mockRejectedValue(NETWORK_FAILURE()),
      buildOptimisticRecord: (clientId) => ({ id: clientId, totalMl: 200, pending: true as const }),
    })
    expect(await getAllOutboxEntries()).toHaveLength(2)

    // First replay fails outright -> drain stops, second entry never attempted.
    mockedApiRequest.mockRejectedValueOnce(NETWORK_FAILURE())
    await drainOutbox(vi.fn())

    expect(mockedApiRequest).toHaveBeenCalledTimes(1)
    expect(await getAllOutboxEntries()).toHaveLength(2)
  })

  it('treats a 404 on a queued delete as already-gone and removes it without error', async () => {
    await deleteWithOfflineFallback({
      resource: 'weight',
      id: 'server-42',
      pending: false,
      onlineCall: vi.fn().mockRejectedValue(NETWORK_FAILURE()),
    })
    expect(await getAllOutboxEntries()).toHaveLength(1)

    mockedApiRequest.mockRejectedValueOnce(new ApiError('Not found', 404))
    const onEntrySynced = vi.fn()

    await expect(drainOutbox(onEntrySynced)).resolves.toBeUndefined()

    expect(await getAllOutboxEntries()).toHaveLength(0)
    expect(onEntrySynced).toHaveBeenCalledOnce()
  })

  it('drops an entry the server rejects outright (non-404 ApiError) rather than retrying forever', async () => {
    await createWithOfflineFallback({
      resource: 'water',
      path: '/api/water',
      body: { totalMl: -5 },
      description: 'Invalid log',
      onlineCall: vi.fn().mockRejectedValue(NETWORK_FAILURE()),
      buildOptimisticRecord: (clientId) => ({ id: clientId, totalMl: -5, pending: true as const }),
    })

    mockedApiRequest.mockRejectedValueOnce(new ApiError('Bad request', 400))
    const onEntrySynced = vi.fn()

    await drainOutbox(onEntrySynced)

    expect(await getAllOutboxEntries()).toHaveLength(0)
    expect(onEntrySynced).toHaveBeenCalledOnce()
  })

  it('does nothing when the outbox is empty', async () => {
    await expect(drainOutbox(vi.fn())).resolves.toBeUndefined()
    expect(mockedApiRequest).not.toHaveBeenCalled()
  })
})
