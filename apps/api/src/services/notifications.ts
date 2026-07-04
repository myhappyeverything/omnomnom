import type {
  CreateCustomReminderInput,
  CustomReminderRecord,
  NotificationSettingsRecord,
  UpdateCustomReminderInput,
  UpdateNotificationSettingsInput,
} from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { CustomReminderRow, NotificationSettingsRow } from '../types/models.js'
import { NotFoundError } from '../lib/errors.js'
import * as notificationsRepo from '../repositories/notifications.js'

function toSettingsRecord(row: NotificationSettingsRow): NotificationSettingsRecord {
  return {
    onesignalPlayerId: row.onesignal_player_id,
    breakfastReminderTime: row.breakfast_reminder_time,
    lunchReminderTime: row.lunch_reminder_time,
    dinnerReminderTime: row.dinner_reminder_time,
    waterReminderEnabled: row.water_reminder_enabled === 1,
    waterReminderIntervalMinutes: row.water_reminder_interval_minutes,
    weighInReminderTime: row.weigh_in_reminder_time,
    weighInReminderDays: JSON.parse(row.weigh_in_reminder_days) as number[],
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  }
}

function toReminderRecord(row: CustomReminderRow): CustomReminderRecord {
  return {
    id: row.id,
    label: row.label,
    time: row.time,
    daysOfWeek: JSON.parse(row.days_of_week) as number[],
    enabled: row.enabled === 1,
    createdAt: row.created_at,
  }
}

export async function getNotificationSettings(
  env: Env,
  userId: string,
): Promise<NotificationSettingsRecord> {
  const row = await notificationsRepo.getNotificationSettings(env, userId)
  if (!row) throw new Error('Notification settings row missing for user')
  return toSettingsRecord(row)
}

export async function updateNotificationSettings(
  env: Env,
  userId: string,
  input: UpdateNotificationSettingsInput,
): Promise<NotificationSettingsRecord> {
  const row = await notificationsRepo.updateNotificationSettings(env, userId, input)
  return toSettingsRecord(row)
}

export async function listCustomReminders(
  env: Env,
  userId: string,
): Promise<CustomReminderRecord[]> {
  const rows = await notificationsRepo.listCustomReminders(env, userId)
  return rows.map(toReminderRecord)
}

export async function createCustomReminder(
  env: Env,
  userId: string,
  input: CreateCustomReminderInput,
): Promise<CustomReminderRecord> {
  const row = await notificationsRepo.createCustomReminder(env, userId, input)
  return toReminderRecord(row)
}

export async function updateCustomReminder(
  env: Env,
  userId: string,
  id: string,
  input: UpdateCustomReminderInput,
): Promise<CustomReminderRecord> {
  const existing = await notificationsRepo.findCustomReminderById(env, userId, id)
  if (!existing) throw new NotFoundError('Reminder not found')
  const row = await notificationsRepo.updateCustomReminder(env, userId, id, input)
  if (!row) throw new NotFoundError('Reminder not found')
  return toReminderRecord(row)
}

export async function deleteCustomReminder(env: Env, userId: string, id: string): Promise<void> {
  const existing = await notificationsRepo.findCustomReminderById(env, userId, id)
  if (!existing) throw new NotFoundError('Reminder not found')
  await notificationsRepo.deleteCustomReminder(env, userId, id)
}
