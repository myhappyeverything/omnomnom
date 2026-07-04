import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types/env.js'
import { healthRoute } from './routes/health.js'

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: (origin, c) => (origin === c.env.ALLOWED_ORIGIN ? origin : ''),
    credentials: true,
  }),
)

app.route('/api/health', healthRoute)

export default app
