import { z } from 'zod'

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM (24h) format')

const daysOfWeek = z.array(z.number().int().min(0).max(6)).max(7)

export const updateNotificationSettingsSchema = z.object({
  onesignalPlayerId: z.string().max(200).nullable().optional(),
  breakfastReminderTime: timeOfDay.nullable().optional(),
  lunchReminderTime: timeOfDay.nullable().optional(),
  dinnerReminderTime: timeOfDay.nullable().optional(),
  waterReminderEnabled: z.boolean().optional(),
  waterReminderIntervalMinutes: z.number().int().positive().max(1440).nullable().optional(),
  weighInReminderTime: timeOfDay.nullable().optional(),
  weighInReminderDays: daysOfWeek.optional(),
  quietHoursStart: timeOfDay.nullable().optional(),
  quietHoursEnd: timeOfDay.nullable().optional(),
  timezone: z.string().min(1).max(64).optional(),
})
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>

export const createCustomReminderSchema = z.object({
  label: z.string().trim().min(1).max(100),
  time: timeOfDay,
  daysOfWeek,
  enabled: z.boolean().default(true),
})
export type CreateCustomReminderInput = z.infer<typeof createCustomReminderSchema>

export const updateCustomReminderSchema = createCustomReminderSchema.partial()
export type UpdateCustomReminderInput = z.infer<typeof updateCustomReminderSchema>
