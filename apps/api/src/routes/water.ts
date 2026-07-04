import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createWaterLogSchema, listWaterLogsQuerySchema } from '@omnomnom/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as waterService from '../services/water.js'

export const waterRoute = new Hono<AppEnv>()

waterRoute.use('*', requireAuth)

waterRoute.get('/', zValidator('query', listWaterLogsQuerySchema), async (c) => {
  const logs = await waterService.listWaterLogs(c.env, c.get('userId'), c.req.valid('query'))
  return c.json({ logs })
})

waterRoute.post('/', zValidator('json', createWaterLogSchema), async (c) => {
  const log = await waterService.createWaterLog(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ log }, 201)
})

waterRoute.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  await waterService.deleteWaterLog(c.env, c.get('userId'), c.req.valid('param').id)
  return c.json({ success: true })
})
