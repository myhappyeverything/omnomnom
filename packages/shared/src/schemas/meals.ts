import { z } from 'zod'
import { MEAL_TYPE_VALUES } from '../constants.js'

export const mealItemInputSchema = z.object({
  foodId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
})
export type MealItemInput = z.infer<typeof mealItemInputSchema>

export const createMealSchema = z.object({
  mealType: z.enum(MEAL_TYPE_VALUES),
  loggedAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  photoR2Key: z.string().max(500).optional(),
  clientId: z.string().uuid().optional(),
  items: z.array(mealItemInputSchema).min(1, 'A meal needs at least one item'),
})
export type CreateMealInput = z.infer<typeof createMealSchema>

export const updateMealSchema = z.object({
  mealType: z.enum(MEAL_TYPE_VALUES).optional(),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(mealItemInputSchema).min(1).optional(),
})
export type UpdateMealInput = z.infer<typeof updateMealSchema>

export const listMealsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})
export type ListMealsQuery = z.infer<typeof listMealsQuerySchema>
