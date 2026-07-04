import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv } from './types/hono.js'
import { healthRoute } from './routes/health.js'
import { authRoute } from './routes/auth.js'
import { AppError } from './lib/errors.js'

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: (origin, c) => (origin === c.env.ALLOWED_ORIGIN ? origin : ''),
    credentials: true,
  }),
)

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode as 400 | 401 | 403 | 404 | 409)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.route('/api/health', healthRoute)
app.route('/api/auth', authRoute)

export default app
