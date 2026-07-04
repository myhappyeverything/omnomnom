import { z } from 'zod'

export const createCustomFoodSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(200).optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().trim().min(1).max(20),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  fibreG: z.number().min(0).default(0),
  barcode: z.string().trim().max(64).optional(),
})
export type CreateCustomFoodInput = z.infer<typeof createCustomFoodSchema>

export const searchFoodsQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().positive().max(50).default(20),
})
export type SearchFoodsQuery = z.infer<typeof searchFoodsQuerySchema>
