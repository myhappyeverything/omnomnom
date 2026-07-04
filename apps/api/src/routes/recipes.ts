import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createRecipeSchema } from '@omnomnom/shared'
import { z } from 'zod'
import type { AppEnv } from '../types/hono.js'
import { requireAuth } from '../middleware/auth.js'
import * as recipesService from '../services/recipes.js'

export const recipesRoute = new Hono<AppEnv>()

recipesRoute.use('*', requireAuth)

recipesRoute.get('/', async (c) => {
  const recipes = await recipesService.listRecipes(c.env, c.get('userId'))
  return c.json({ recipes })
})

recipesRoute.post('/', zValidator('json', createRecipeSchema), async (c) => {
  const recipe = await recipesService.createRecipe(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ recipe }, 201)
})

const recipeIdParamSchema = z.object({ recipeId: z.string().uuid() })

recipesRoute.get('/:recipeId', zValidator('param', recipeIdParamSchema), async (c) => {
  const recipe = await recipesService.getRecipe(
    c.env,
    c.get('userId'),
    c.req.valid('param').recipeId,
  )
  return c.json({ recipe })
})

recipesRoute.delete('/:recipeId', zValidator('param', recipeIdParamSchema), async (c) => {
  await recipesService.deleteRecipe(c.env, c.get('userId'), c.req.valid('param').recipeId)
  return c.json({ success: true })
})
