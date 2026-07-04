import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import { exportUserData } from '../services/export.js'

export const exportRoute = new Hono<AppEnv>()

exportRoute.use('*', requireAuth)

exportRoute.get('/', async (c) => {
  const data = await exportUserData(c.env, c.get('userId'))
  return c.json(data)
})
