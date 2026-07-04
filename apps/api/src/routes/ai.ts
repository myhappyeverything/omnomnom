import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { analyzePhotoSchema } from '@omnomnom/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as aiService from '../services/ai.js'

export const aiRoute = new Hono<AppEnv>()

aiRoute.use('*', requireAuth)

aiRoute.post('/analyze-photo', zValidator('json', analyzePhotoSchema), async (c) => {
  const result = await aiService.analyzePhoto(c.env, c.get('userId'), c.req.valid('json'))
  return c.json(result)
})

const hashParamSchema = z.object({ hash: z.string().min(1) })

aiRoute.get('/photo/:hash', zValidator('param', hashParamSchema), async (c) => {
  const { hash } = c.req.valid('param')
  const object = await c.env.MEAL_IMAGES.get(`meal-photos/${hash}`)
  if (!object) {
    return c.json({ error: 'Photo not found' }, 404)
  }
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
})
