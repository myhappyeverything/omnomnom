import type { Env } from '../types/env.js'
import type { SettingsRow } from '../types/models.js'
import { nowIso } from '../lib/db.js'

export async function getSettings(env: Env, userId: string): Promise<SettingsRow | null> {
  return env.DB.prepare('SELECT * FROM settings WHERE user_id = ?')
    .bind(userId)
    .first<SettingsRow>()
}

export async function updateSettings(
  env: Env,
  userId: string,
  fields: { unitSystem?: string; theme?: string },
): Promise<SettingsRow> {
  const setClauses: string[] = []
  const values: string[] = []
  if (fields.unitSystem !== undefined) {
    setClauses.push('unit_system = ?')
    values.push(fields.unitSystem)
  }
  if (fields.theme !== undefined) {
    setClauses.push('theme = ?')
    values.push(fields.theme)
  }
  if (setClauses.length > 0) {
    setClauses.push('updated_at = ?')
    values.push(nowIso())
    values.push(userId)
    await env.DB.prepare(`UPDATE settings SET ${setClauses.join(', ')} WHERE user_id = ?`)
      .bind(...values)
      .run()
  }
  const row = await getSettings(env, userId)
  if (!row) throw new Error('Settings row missing for user')
  return row
}
