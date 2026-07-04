import type { CreateWaterLogInput, WaterLogRecord } from '@purple/shared'
import { apiRequest } from './client'

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

export async function createWaterLog(input: CreateWaterLogInput): Promise<WaterLogRecord> {
  const data = await apiRequest<{ log: WaterLogRecord }>('/api/water', {
    method: 'POST',
    body: input,
  })
  return data.log
}

export async function deleteWaterLog(id: string): Promise<void> {
  await apiRequest(`/api/water/${id}`, { method: 'DELETE' })
}
