import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCustomFoodSchema, searchFoodsQuerySchema } from '@omnomnom/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as foodsService from '../services/foods.js'

export const foodsRoute = new Hono<AppEnv>()

foodsRoute.use('*', requireAuth)

// Local-database-only search for now; provider fan-out (OpenFoodFacts, USDA)
// is added in Stage 13.
foodsRoute.get('/', zValidator('query', searchFoodsQuerySchema), async (c) => {
  const { q, limit } = c.req.valid('query')
  const foods = await foodsService.searchFoods(c.env, c.get('userId'), q, limit)
  return c.json({ foods })
})

foodsRoute.get('/recent', async (c) => {
  const foods = await foodsService.listRecentFoods(c.env, c.get('userId'))
  return c.json({ foods })
})

foodsRoute.get('/frequent', async (c) => {
  const foods = await foodsService.listFrequentFoods(c.env, c.get('userId'))
  return c.json({ foods })
})

foodsRoute.get('/favourites', async (c) => {
  const foods = await foodsService.listFavouriteFoods(c.env, c.get('userId'))
  return c.json({ foods })
})

foodsRoute.post('/', zValidator('json', createCustomFoodSchema), async (c) => {
  const food = await foodsService.createCustomFood(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ food }, 201)
})

const foodIdParamSchema = z.object({ foodId: z.string().uuid() })

foodsRoute.put('/:foodId/favourite', zValidator('param', foodIdParamSchema), async (c) => {
  await foodsService.addFavourite(c.env, c.get('userId'), c.req.valid('param').foodId)
  return c.json({ success: true })
})

foodsRoute.delete('/:foodId/favourite', zValidator('param', foodIdParamSchema), async (c) => {
  await foodsService.removeFavourite(c.env, c.get('userId'), c.req.valid('param').foodId)
  return c.json({ success: true })
})
