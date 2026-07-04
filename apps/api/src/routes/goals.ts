import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createGoalSchema, updateGoalOverridesSchema } from '@omnomnom/shared'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as goalsService from '../services/goals.js'

export const goalsRoute = new Hono<AppEnv>()

goalsRoute.use('*', requireAuth)

goalsRoute.get('/active', async (c) => {
  const goal = await goalsService.getActiveGoal(c.env, c.get('userId'))
  if (!goal) {
    return c.json({ error: 'No active goal' }, 404)
  }
  return c.json({ goal })
})

goalsRoute.get('/', async (c) => {
  const goals = await goalsService.listGoals(c.env, c.get('userId'))
  return c.json({ goals })
})

goalsRoute.post('/', zValidator('json', createGoalSchema), async (c) => {
  const goal = await goalsService.createGoal(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ goal }, 201)
})

goalsRoute.patch('/active', zValidator('json', updateGoalOverridesSchema), async (c) => {
  const goal = await goalsService.updateActiveGoalOverrides(
    c.env,
    c.get('userId'),
    c.req.valid('json'),
  )
  return c.json({ goal })
})
