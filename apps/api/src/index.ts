import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv } from './types/hono.js'
import { healthRoute } from './routes/health.js'
import { authRoute } from './routes/auth.js'
import { goalsRoute } from './routes/goals.js'
import { foodsRoute } from './routes/foods.js'
import { mealsRoute } from './routes/meals.js'
import { recipesRoute } from './routes/recipes.js'
import { waterRoute } from './routes/water.js'
import { weightRoute } from './routes/weight.js'
import { settingsRoute } from './routes/settings.js'
import { notificationsRoute } from './routes/notifications.js'
import { aiRoute } from './routes/ai.js'
import { nutritionScoreRoute } from './routes/nutritionScore.js'
import { exportRoute } from './routes/export.js'
import { widgetTokensRoute } from './routes/widgetTokens.js'
import { widgetSummaryRoute } from './routes/widgetSummary.js'
import { AppError } from './lib/errors.js'
import { OpenAiError } from './lib/openai.js'
import { runReminderCheck } from './services/reminderScheduler.js'
import type { Env } from './types/env.js'

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
  if (err instanceof OpenAiError) {
    console.error(err)
    return c.json({ error: 'Photo analysis is temporarily unavailable. Please try again.' }, 502)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.route('/api/health', healthRoute)
app.route('/api/auth', authRoute)
app.route('/api/goals', goalsRoute)
app.route('/api/foods', foodsRoute)
app.route('/api/meals', mealsRoute)
app.route('/api/recipes', recipesRoute)
app.route('/api/water', waterRoute)
app.route('/api/weight', weightRoute)
app.route('/api/settings', settingsRoute)
app.route('/api/notifications', notificationsRoute)
app.route('/api/ai', aiRoute)
app.route('/api/nutrition-score', nutritionScoreRoute)
app.route('/api/export', exportRoute)
app.route('/api/widget-tokens', widgetTokensRoute)
app.route('/api/widget-summary', widgetSummaryRoute)

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runReminderCheck(env))
  },
}
