import type { SettingsRecord, UpdateSettingsInput } from '@omnomnom/shared'
import { apiRequest } from './client'

export async function getSettings(): Promise<SettingsRecord> {
  const data = await apiRequest<{ settings: SettingsRecord }>('/api/settings')
  return data.settings
}

export async function updateSettings(input: UpdateSettingsInput): Promise<SettingsRecord> {
  const data = await apiRequest<{ settings: SettingsRecord }>('/api/settings', {
    method: 'PATCH',
    body: input,
  })
  return data.settings
}
