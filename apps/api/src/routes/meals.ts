import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createMealSchema, listMealsQuerySchema, updateMealSchema } from '@omnomnom/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as mealsService from '../services/meals.js'

export const mealsRoute = new Hono<AppEnv>()

mealsRoute.use('*', requireAuth)

mealsRoute.get('/', zValidator('query', listMealsQuerySchema), async (c) => {
  const meals = await mealsService.listMeals(c.env, c.get('userId'), c.req.valid('query'))
  return c.json({ meals })
})

mealsRoute.post('/', zValidator('json', createMealSchema), async (c) => {
  const meal = await mealsService.createMeal(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ meal }, 201)
})

const mealIdParamSchema = z.object({ mealId: z.string().uuid() })

mealsRoute.get('/:mealId', zValidator('param', mealIdParamSchema), async (c) => {
  const meal = await mealsService.getMeal(c.env, c.get('userId'), c.req.valid('param').mealId)
  return c.json({ meal })
})

mealsRoute.patch(
  '/:mealId',
  zValidator('param', mealIdParamSchema),
  zValidator('json', updateMealSchema),
  async (c) => {
    const meal = await mealsService.updateMeal(
      c.env,
      c.get('userId'),
      c.req.valid('param').mealId,
      c.req.valid('json'),
    )
    return c.json({ meal })
  },
)

mealsRoute.delete('/:mealId', zValidator('param', mealIdParamSchema), async (c) => {
  await mealsService.deleteMeal(c.env, c.get('userId'), c.req.valid('param').mealId)
  return c.json({ success: true })
})
