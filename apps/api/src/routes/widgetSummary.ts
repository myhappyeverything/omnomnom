import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { nutritionScoreQuerySchema } from '@omnomnom/shared'
import type { AppEnv } from '../types/hono.js'
import { requireWidgetAuth } from '../middleware/widgetAuth.js'
import { getWidgetSummary } from '../services/widgetSummary.js'

export const widgetSummaryRoute = new Hono<AppEnv>()

widgetSummaryRoute.use('*', requireWidgetAuth)

widgetSummaryRoute.get('/', zValidator('query', nutritionScoreQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const summary = await getWidgetSummary(c.env, c.get('userId'), {
    dateKey: query.date,
    from: query.from,
    to: query.to,
    tzOffsetMinutes: query.tzOffsetMinutes,
  })
  return c.json(summary)
})
