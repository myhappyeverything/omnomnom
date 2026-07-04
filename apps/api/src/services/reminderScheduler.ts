import type { Env } from '../types/env.js'
import type { NotificationSettingsRow } from '../types/models.js'
import { sendPushNotification } from '../lib/oneSignal.js'
import {
  getUserLocalTime,
  isTimeWithinTolerance,
  isWithinQuietHours,
} from '../lib/reminderTiming.js'
import * as remindersRepo from '../repositories/reminders.js'

// Matches the Cron Trigger's own interval — wide enough that a 5-minute cron
// tick never straddles two reminder windows, tight enough it won't fire twice.
const TOLERANCE_MINUTES = 5
const DAY_SECONDS = 25 * 60 * 60 // slightly over 24h so a late-running cron can't miss the dedupe key

interface FixedReminder {
  key: string
  time: string | null
  title: string
  message: string
  /** Restricts which local weekdays this fires on; omitted means every day. */
  days: number[] | null
}

async function alreadySent(env: Env, key: string): Promise<boolean> {
  return (await env.CACHE.get(key)) !== null
}

async function markSent(env: Env, key: string, ttlSeconds: number): Promise<void> {
  await env.CACHE.put(key, '1', { expirationTtl: ttlSeconds })
}

async function maybeSend(
  env: Env,
  playerId: string,
  dedupeKey: string,
  ttlSeconds: number,
  title: string,
  message: string,
): Promise<void> {
  if (await alreadySent(env, dedupeKey)) return
  try {
    await sendPushNotification(
      env.ONESIGNAL_APP_ID,
      env.ONESIGNAL_REST_API_KEY,
      playerId,
      title,
      message,
    )
  } catch (error) {
    // A push failure shouldn't take down the whole scheduled run — log and move on to the next reminder/user.
    console.error(error)
    return
  }
  await markSent(env, dedupeKey, ttlSeconds)
}

async function checkFixedReminders(env: Env, settings: NotificationSettingsRow): Promise<void> {
  const local = getUserLocalTime(settings.timezone)
  const playerId = settings.onesignal_player_id!

  const reminders: FixedReminder[] = [
    {
      key: 'breakfast',
      time: settings.breakfast_reminder_time,
      title: 'Breakfast time',
      message: "Log your breakfast when you're ready.",
      days: null,
    },
    {
      key: 'lunch',
      time: settings.lunch_reminder_time,
      title: 'Lunch time',
      message: "Log your lunch when you're ready.",
      days: null,
    },
    {
      key: 'dinner',
      time: settings.dinner_reminder_time,
      title: 'Dinner time',
      message: "Log your dinner when you're ready.",
      days: null,
    },
    {
      key: 'weigh_in',
      time: settings.weigh_in_reminder_time,
      title: 'Weigh-in reminder',
      message: 'Time to log your weight.',
      days: JSON.parse(settings.weigh_in_reminder_days) as number[],
    },
  ]

  for (const reminder of reminders) {
    if (!reminder.time) continue
    if (reminder.days && reminder.days.length > 0 && !reminder.days.includes(local.dayOfWeek))
      continue
    if (!isTimeWithinTolerance(reminder.time, local, TOLERANCE_MINUTES)) continue

    const dedupeKey = `reminder-sent:${settings.user_id}:${reminder.key}:${local.dateKey}`
    await maybeSend(env, playerId, dedupeKey, DAY_SECONDS, reminder.title, reminder.message)
  }
}

async function checkWaterReminder(env: Env, settings: NotificationSettingsRow): Promise<void> {
  if (settings.water_reminder_enabled !== 1 || !settings.water_reminder_interval_minutes) return

  const local = getUserLocalTime(settings.timezone)
  const currentTotalMinutes = local.hours * 60 + local.minutes
  const bucket = Math.floor(currentTotalMinutes / settings.water_reminder_interval_minutes)
  const dedupeKey = `reminder-sent:${settings.user_id}:water:${local.dateKey}:${bucket}`
  const ttl = settings.water_reminder_interval_minutes * 60 + 5 * 60

  await maybeSend(
    env,
    settings.onesignal_player_id!,
    dedupeKey,
    ttl,
    'Stay hydrated',
    'Time for some water.',
  )
}

async function checkCustomReminders(
  env: Env,
  settingsByUserId: Map<string, NotificationSettingsRow>,
): Promise<void> {
  const customReminders = await remindersRepo.listEnabledCustomReminders(env)

  for (const reminder of customReminders) {
    const settings = settingsByUserId.get(reminder.user_id)
    if (!settings?.onesignal_player_id) continue

    const local = getUserLocalTime(settings.timezone)
    if (isWithinQuietHours(settings.quiet_hours_start, settings.quiet_hours_end, local)) continue

    const days = JSON.parse(reminder.days_of_week) as number[]
    if (!days.includes(local.dayOfWeek)) continue
    if (!isTimeWithinTolerance(reminder.time, local, TOLERANCE_MINUTES)) continue

    const dedupeKey = `reminder-sent:${reminder.user_id}:custom:${reminder.id}:${local.dateKey}`
    await maybeSend(
      env,
      settings.onesignal_player_id,
      dedupeKey,
      DAY_SECONDS,
      reminder.label,
      'Reminder from OmNomNom',
    )
  }
}

export async function runReminderCheck(env: Env): Promise<void> {
  const subscribedSettings = await remindersRepo.listSubscribedNotificationSettings(env)
  const settingsByUserId = new Map(subscribedSettings.map((s) => [s.user_id, s]))

  for (const settings of subscribedSettings) {
    const local = getUserLocalTime(settings.timezone)
    if (isWithinQuietHours(settings.quiet_hours_start, settings.quiet_hours_end, local)) continue

    await checkFixedReminders(env, settings)
    await checkWaterReminder(env, settings)
  }

  await checkCustomReminders(env, settingsByUserId)
}
