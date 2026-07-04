import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createWeightLogSchema, listWeightLogsQuerySchema } from '@purple/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as weightService from '../services/weight.js'

export const weightRoute = new Hono<AppEnv>()

weightRoute.use('*', requireAuth)

weightRoute.get('/', zValidator('query', listWeightLogsQuerySchema), async (c) => {
  const logs = await weightService.listWeightLogs(c.env, c.get('userId'), c.req.valid('query'))
  return c.json({ logs })
})

weightRoute.post('/', zValidator('json', createWeightLogSchema), async (c) => {
  const log = await weightService.createWeightLog(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ log }, 201)
})

weightRoute.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  await weightService.deleteWeightLog(c.env, c.get('userId'), c.req.valid('param').id)
  return c.json({ success: true })
})
