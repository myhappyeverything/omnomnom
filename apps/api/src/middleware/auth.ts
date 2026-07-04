import { createMiddleware } from 'hono/factory'
import { verifyAccessToken } from '../lib/tokens.js'
import type { AppEnv } from '../types/hono.js'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const userId = await verifyAccessToken(token, c.env.JWT_SECRET)
  if (!userId) {
    return c.json({ error: 'Invalid or expired access token' }, 401)
  }

  c.set('userId', userId)
  await next()
})
