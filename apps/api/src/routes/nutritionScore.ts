import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { nutritionScoreQuerySchema, nutritionScoreRangeQuerySchema } from '@omnomnom/shared'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as nutritionScoreService from '../services/nutritionScore.js'

export const nutritionScoreRoute = new Hono<AppEnv>()

nutritionScoreRoute.use('*', requireAuth)

nutritionScoreRoute.get('/', zValidator('query', nutritionScoreQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const breakdown = await nutritionScoreService.getNutritionScoreForDay(c.env, c.get('userId'), {
    dateKey: query.date,
    from: query.from,
    to: query.to,
    tzOffsetMinutes: query.tzOffsetMinutes,
  })
  return c.json(breakdown)
})

nutritionScoreRoute.get(
  '/range',
  zValidator('query', nutritionScoreRangeQuerySchema),
  async (c) => {
    const query = c.req.valid('query')
    const days = await nutritionScoreService.getNutritionScoreRange(c.env, c.get('userId'), {
      dateKeys: query.dateKeys,
      from: query.from,
      to: query.to,
      tzOffsetMinutes: query.tzOffsetMinutes,
    })
    return c.json({ days })
  },
)
