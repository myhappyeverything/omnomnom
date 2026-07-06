import { createMiddleware } from 'hono/factory'
import { sha256Hex } from '../lib/crypto.js'
import { findActiveWidgetTokenByHash, touchWidgetTokenLastUsed } from '../repositories/widgetTokens.js'
import type { AppEnv } from '../types/hono.js'

/**
 * Separate from requireAuth on purpose: a widget token is long-lived and
 * read-only-scoped, so it must only ever unlock the handful of routes meant
 * for the widget, never the full-access routes a JWT access token can reach.
 */
export const requireWidgetAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const tokenHash = await sha256Hex(token)
  const existing = await findActiveWidgetTokenByHash(c.env, tokenHash)
  if (!existing) {
    return c.json({ error: 'Invalid or revoked widget token' }, 401)
  }

  await touchWidgetTokenLastUsed(c.env, existing.id)
  c.set('userId', existing.user_id)
  await next()
})
