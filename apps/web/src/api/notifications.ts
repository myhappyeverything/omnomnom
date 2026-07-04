import type {
  CreateCustomReminderInput,
  CustomReminderRecord,
  NotificationSettingsRecord,
  UpdateCustomReminderInput,
  UpdateNotificationSettingsInput,
} from '@purple/shared'
import { apiRequest } from './client'

export async function getNotificationSettings(): Promise<NotificationSettingsRecord> {
  const data = await apiRequest<{ settings: NotificationSettingsRecord }>(
    '/api/notifications/settings',
  )
  return data.settings
}

export async function updateNotificationSettings(
  input: UpdateNotificationSettingsInput,
): Promise<NotificationSettingsRecord> {
  const data = await apiRequest<{ settings: NotificationSettingsRecord }>(
    '/api/notifications/settings',
    { method: 'PATCH', body: input },
  )
  return data.settings
}

export async function listCustomReminders(): Promise<CustomReminderRecord[]> {
  const data = await apiRequest<{ reminders: CustomReminderRecord[] }>(
    '/api/notifications/reminders',
  )
  return data.reminders
}

export async function createCustomReminder(
  input: CreateCustomReminderInput,
): Promise<CustomReminderRecord> {
  const data = await apiRequest<{ reminder: CustomReminderRecord }>(
    '/api/notifications/reminders',
    {
      method: 'POST',
      body: input,
    },
  )
  return data.reminder
}

export async function updateCustomReminder(
  id: string,
  input: UpdateCustomReminderInput,
): Promise<CustomReminderRecord> {
  const data = await apiRequest<{ reminder: CustomReminderRecord }>(
    `/api/notifications/reminders/${id}`,
    { method: 'PATCH', body: input },
  )
  return data.reminder
}

export async function deleteCustomReminder(id: string): Promise<void> {
  await apiRequest(`/api/notifications/reminders/${id}`, { method: 'DELETE' })
}
