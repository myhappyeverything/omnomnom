import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/hono.js'

interface RateLimitOptions {
  /** Identifies the protected route in the KV key, e.g. "login" or "register". */
  keyPrefix: string
  limit: number
  windowSeconds: number
}

/**
 * Fixed-window counter backed by KV. The read-then-write isn't atomic, so a
 * burst of concurrent requests could slip a few over the limit — an
 * acceptable tradeoff for a two-user personal app where the goal is blunting
 * credential-stuffing/brute-force attempts, not precise quota enforcement.
 */
export function rateLimit(options: RateLimitOptions) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
    const key = `ratelimit:${options.keyPrefix}:${ip}`

    const current = await c.env.CACHE.get(key)
    const count = current ? Number.parseInt(current, 10) : 0

    if (count >= options.limit) {
      return c.json({ error: 'Too many requests. Please try again later.' }, 429)
    }

    await c.env.CACHE.put(key, String(count + 1), { expirationTtl: options.windowSeconds })
    await next()
  })
}
