import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createWidgetTokenSchema } from '@omnomnom/shared'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import { issueWidgetToken, listWidgetTokens, revokeWidgetToken } from '../services/widgetToken.js'

export const widgetTokensRoute = new Hono<AppEnv>()

widgetTokensRoute.use('*', requireAuth)

widgetTokensRoute.post('/', zValidator('json', createWidgetTokenSchema), async (c) => {
  const { label } = c.req.valid('json')
  const issued = await issueWidgetToken(c.env, c.get('userId'), label)
  return c.json(issued, 201)
})

widgetTokensRoute.get('/', async (c) => {
  const tokens = await listWidgetTokens(c.env, c.get('userId'))
  return c.json({ tokens })
})

widgetTokensRoute.delete(
  '/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    await revokeWidgetToken(c.env, c.get('userId'), c.req.valid('param').id)
    return c.json({ success: true })
  },
)
