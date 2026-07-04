import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createCustomReminderSchema,
  updateCustomReminderSchema,
  updateNotificationSettingsSchema,
} from '@omnomnom/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as notificationsService from '../services/notifications.js'

export const notificationsRoute = new Hono<AppEnv>()

notificationsRoute.use('*', requireAuth)

notificationsRoute.get('/settings', async (c) => {
  const settings = await notificationsService.getNotificationSettings(c.env, c.get('userId'))
  return c.json({ settings })
})

notificationsRoute.patch(
  '/settings',
  zValidator('json', updateNotificationSettingsSchema),
  async (c) => {
    const settings = await notificationsService.updateNotificationSettings(
      c.env,
      c.get('userId'),
      c.req.valid('json'),
    )
    return c.json({ settings })
  },
)

notificationsRoute.get('/reminders', async (c) => {
  const reminders = await notificationsService.listCustomReminders(c.env, c.get('userId'))
  return c.json({ reminders })
})

notificationsRoute.post('/reminders', zValidator('json', createCustomReminderSchema), async (c) => {
  const reminder = await notificationsService.createCustomReminder(
    c.env,
    c.get('userId'),
    c.req.valid('json'),
  )
  return c.json({ reminder }, 201)
})

const reminderIdParamSchema = z.object({ reminderId: z.string().uuid() })

notificationsRoute.patch(
  '/reminders/:reminderId',
  zValidator('param', reminderIdParamSchema),
  zValidator('json', updateCustomReminderSchema),
  async (c) => {
    const reminder = await notificationsService.updateCustomReminder(
      c.env,
      c.get('userId'),
      c.req.valid('param').reminderId,
      c.req.valid('json'),
    )
    return c.json({ reminder })
  },
)

notificationsRoute.delete(
  '/reminders/:reminderId',
  zValidator('param', reminderIdParamSchema),
  async (c) => {
    await notificationsService.deleteCustomReminder(
      c.env,
      c.get('userId'),
      c.req.valid('param').reminderId,
    )
    return c.json({ success: true })
  },
)
