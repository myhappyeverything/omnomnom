import type { Env } from '../types/env.js'
import type { CustomReminderRow, NotificationSettingsRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export interface NotificationSettingsUpdate {
  onesignalPlayerId?: string | null
  breakfastReminderTime?: string | null
  lunchReminderTime?: string | null
  dinnerReminderTime?: string | null
  waterReminderEnabled?: boolean
  waterReminderIntervalMinutes?: number | null
  weighInReminderTime?: string | null
  weighInReminderDays?: number[]
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
  timezone?: string
}

const COLUMN_BY_FIELD: Record<keyof NotificationSettingsUpdate, string> = {
  onesignalPlayerId: 'onesignal_player_id',
  breakfastReminderTime: 'breakfast_reminder_time',
  lunchReminderTime: 'lunch_reminder_time',
  dinnerReminderTime: 'dinner_reminder_time',
  waterReminderEnabled: 'water_reminder_enabled',
  waterReminderIntervalMinutes: 'water_reminder_interval_minutes',
  weighInReminderTime: 'weigh_in_reminder_time',
  weighInReminderDays: 'weigh_in_reminder_days',
  quietHoursStart: 'quiet_hours_start',
  quietHoursEnd: 'quiet_hours_end',
  timezone: 'timezone',
}

export async function getNotificationSettings(
  env: Env,
  userId: string,
): Promise<NotificationSettingsRow | null> {
  return env.DB.prepare('SELECT * FROM notification_settings WHERE user_id = ?')
    .bind(userId)
    .first<NotificationSettingsRow>()
}

export async function updateNotificationSettings(
  env: Env,
  userId: string,
  fields: NotificationSettingsUpdate,
): Promise<NotificationSettingsRow> {
  const setClauses: string[] = []
  const values: (string | number)[] = []

  for (const [key, value] of Object.entries(fields) as [
    keyof NotificationSettingsUpdate,
    unknown,
  ][]) {
    if (value === undefined) continue
    const column = COLUMN_BY_FIELD[key]
    let dbValue: string | number
    if (key === 'waterReminderEnabled') {
      dbValue = value ? 1 : 0
    } else if (key === 'weighInReminderDays') {
      dbValue = JSON.stringify(value)
    } else if (value === null) {
      setClauses.push(`${column} = NULL`)
      continue
    } else {
      dbValue = value as string | number
    }
    setClauses.push(`${column} = ?`)
    values.push(dbValue)
  }

  if (setClauses.length > 0) {
    setClauses.push('updated_at = ?')
    values.push(nowIso())
    values.push(userId)
    await env.DB.prepare(
      `UPDATE notification_settings SET ${setClauses.join(', ')} WHERE user_id = ?`,
    )
      .bind(...values)
      .run()
  }

  const row = await getNotificationSettings(env, userId)
  if (!row) throw new Error('Notification settings row missing for user')
  return row
}

export async function listCustomReminders(env: Env, userId: string): Promise<CustomReminderRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM custom_reminders WHERE user_id = ? ORDER BY created_at ASC',
  )
    .bind(userId)
    .all<CustomReminderRow>()
  return results
}

export async function findCustomReminderById(
  env: Env,
  userId: string,
  id: string,
): Promise<CustomReminderRow | null> {
  return env.DB.prepare('SELECT * FROM custom_reminders WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<CustomReminderRow>()
}

export async function createCustomReminder(
  env: Env,
  userId: string,
  input: { label: string; time: string; daysOfWeek: number[]; enabled: boolean },
): Promise<CustomReminderRow> {
  const id = newId()
  await env.DB.prepare(
    'INSERT INTO custom_reminders (id, user_id, label, time, days_of_week, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      userId,
      input.label,
      input.time,
      JSON.stringify(input.daysOfWeek),
      input.enabled ? 1 : 0,
      nowIso(),
    )
    .run()
  const row = await findCustomReminderById(env, userId, id)
  if (!row) throw new Error('Failed to create custom reminder')
  return row
}

export async function updateCustomReminder(
  env: Env,
  userId: string,
  id: string,
  input: { label?: string; time?: string; daysOfWeek?: number[]; enabled?: boolean },
): Promise<CustomReminderRow | null> {
  const setClauses: string[] = []
  const values: (string | number)[] = []
  if (input.label !== undefined) {
    setClauses.push('label = ?')
    values.push(input.label)
  }
  if (input.time !== undefined) {
    setClauses.push('time = ?')
    values.push(input.time)
  }
  if (input.daysOfWeek !== undefined) {
    setClauses.push('days_of_week = ?')
    values.push(JSON.stringify(input.daysOfWeek))
  }
  if (input.enabled !== undefined) {
    setClauses.push('enabled = ?')
    values.push(input.enabled ? 1 : 0)
  }
  if (setClauses.length === 0) return findCustomReminderById(env, userId, id)
  values.push(id, userId)
  await env.DB.prepare(
    `UPDATE custom_reminders SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
  )
    .bind(...values)
    .run()
  return findCustomReminderById(env, userId, id)
}

export async function deleteCustomReminder(env: Env, userId: string, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM custom_reminders WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
}
