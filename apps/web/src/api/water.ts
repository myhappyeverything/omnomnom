import type { CreateWaterLogInput, WaterLogRecord } from '@omnomnom/shared'
import { apiRequest } from './client'
import { createWithOfflineFallback, deleteWithOfflineFallback } from '@/lib/outbox'

export type OfflineWaterLogRecord = WaterLogRecord & { pending?: boolean }

export async function listWaterLogs(
  range: { from?: string; to?: string } = {},
): Promise<WaterLogRecord[]> {
  const params = new URLSearchParams()
  if (range.from) params.set('from', range.from)
  if (range.to) params.set('to', range.to)
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await apiRequest<{ logs: WaterLogRecord[] }>(`/api/water${query}`)
  return data.logs
}

export async function createWaterLog(input: CreateWaterLogInput): Promise<OfflineWaterLogRecord> {
  return createWithOfflineFallback({
    resource: 'water',
    path: '/api/water',
    body: input,
    description: `${input.amountMl}ml water`,
    onlineCall: async () => {
      const data = await apiRequest<{ log: WaterLogRecord }>('/api/water', {
        method: 'POST',
        body: input,
      })
      return data.log
    },
    buildOptimisticRecord: (clientId) => ({
      id: clientId,
      amountMl: input.amountMl,
      loggedAt: input.loggedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
      pending: true,
    }),
  })
}

export async function deleteWaterLog(log: Pick<OfflineWaterLogRecord, 'id' | 'pending'>) {
  await deleteWithOfflineFallback({
    resource: 'water',
    id: log.id,
    pending: Boolean(log.pending),
    onlineCall: async () => {
      await apiRequest(`/api/water/${log.id}`, { method: 'DELETE' })
    },
  })
}
