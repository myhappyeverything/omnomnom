import type { CreateWeightLogInput, WeightLogRecord } from '@purple/shared'
import { apiRequest } from './client'

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

export async function createWeightLog(input: CreateWeightLogInput): Promise<WeightLogRecord> {
  const data = await apiRequest<{ log: WeightLogRecord }>('/api/weight', {
    method: 'POST',
    body: input,
  })
  return data.log
}

export async function deleteWeightLog(id: string): Promise<void> {
  await apiRequest(`/api/weight/${id}`, { method: 'DELETE' })
}
