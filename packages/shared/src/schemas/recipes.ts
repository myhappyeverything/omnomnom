import { z } from 'zod'

export const recipeItemInputSchema = z.object({
  foodId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
})
export type RecipeItemInput = z.infer<typeof recipeItemInputSchema>

export const createRecipeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  servings: z.number().int().positive().max(100).default(1),
  instructions: z.string().max(5000).optional(),
  items: z.array(recipeItemInputSchema).min(1, 'A recipe needs at least one ingredient'),
})
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>
