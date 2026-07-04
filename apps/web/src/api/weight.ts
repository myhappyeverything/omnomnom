import type { CreateWeightLogInput, WeightLogRecord } from '@omnomnom/shared'
import { apiRequest } from './client'
import { createWithOfflineFallback, deleteWithOfflineFallback } from '@/lib/outbox'

export type OfflineWeightLogRecord = WeightLogRecord & { pending?: boolean }

export async function listWeightLogs(
  range: { from?: string; to?: string } = {},
): Promise<WeightLogRecord[]> {
  const params = new URLSearchParams()
  if (range.from) params.set('from', range.from)
  if (range.to) params.set('to', range.to)
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await apiRequest<{ logs: WeightLogRecord[] }>(`/api/weight${query}`)
  return data.logs
}

export async function createWeightLog(
  input: CreateWeightLogInput,
): Promise<OfflineWeightLogRecord> {
  return createWithOfflineFallback({
    resource: 'weight',
    path: '/api/weight',
    body: input,
    description: `${input.weightKg}kg weigh-in`,
    onlineCall: async () => {
      const data = await apiRequest<{ log: WeightLogRecord }>('/api/weight', {
        method: 'POST',
        body: input,
      })
      return data.log
    },
    buildOptimisticRecord: (clientId) => ({
      id: clientId,
      weightKg: input.weightKg,
      loggedAt: input.loggedAt ?? new Date().toISOString(),
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
      pending: true,
    }),
  })
}

export async function deleteWeightLog(log: Pick<OfflineWeightLogRecord, 'id' | 'pending'>) {
  await deleteWithOfflineFallback({
    resource: 'weight',
    id: log.id,
    pending: Boolean(log.pending),
    onlineCall: async () => {
      await apiRequest(`/api/weight/${log.id}`, { method: 'DELETE' })
    },
  })
}
