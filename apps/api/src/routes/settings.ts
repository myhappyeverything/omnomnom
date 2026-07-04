import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateSettingsSchema } from '@purple/shared'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as settingsService from '../services/settings.js'

export const settingsRoute = new Hono<AppEnv>()

settingsRoute.use('*', requireAuth)

settingsRoute.get('/', async (c) => {
  const settings = await settingsService.getSettings(c.env, c.get('userId'))
  return c.json({ settings })
})

settingsRoute.patch('/', zValidator('json', updateSettingsSchema), async (c) => {
  const settings = await settingsService.updateSettings(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ settings })
})
