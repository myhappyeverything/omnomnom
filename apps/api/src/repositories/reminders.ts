import type { Env } from '../types/env.js'
import type { CustomReminderRow, NotificationSettingsRow } from '../types/models.js'

/** Only users who've actually granted push permission (and so have a player id) are worth checking. */
export async function listSubscribedNotificationSettings(
  env: Env,
): Promise<NotificationSettingsRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM notification_settings WHERE onesignal_player_id IS NOT NULL',
  ).all<NotificationSettingsRow>()
  return results
}

export async function listEnabledCustomReminders(env: Env): Promise<CustomReminderRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM custom_reminders WHERE enabled = 1',
  ).all<CustomReminderRow>()
  return results
}
