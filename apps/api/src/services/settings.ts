import type { SettingsRecord, UpdateSettingsInput } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { SettingsRow } from '../types/models.js'
import * as settingsRepo from '../repositories/settings.js'

function toRecord(row: SettingsRow): SettingsRecord {
  return {
    unitSystem: row.unit_system,
    theme: row.theme,
    updatedAt: row.updated_at,
  }
}

export async function getSettings(env: Env, userId: string): Promise<SettingsRecord> {
  const row = await settingsRepo.getSettings(env, userId)
  if (!row) throw new Error('Settings row missing for user')
  return toRecord(row)
}

export async function updateSettings(
  env: Env,
  userId: string,
  input: UpdateSettingsInput,
): Promise<SettingsRecord> {
  const row = await settingsRepo.updateSettings(env, userId, input)
  return toRecord(row)
}
