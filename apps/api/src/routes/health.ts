import { Hono } from 'hono'
import type { Env } from '../types/env.js'

export const healthRoute = new Hono<{ Bindings: Env }>()

healthRoute.get('/', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT })
})
