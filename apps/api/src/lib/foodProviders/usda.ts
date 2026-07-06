import { round2 } from '../numbers.js'
import type { ExternalFoodResult } from './types.js'

interface UsdaFoodNutrient {
  nutrientId: number
  value: number
}

interface UsdaFood {
  fdcId: number
  description: string
  brandOwner?: string
  foodNutrients?: UsdaFoodNutrient[]
}

interface UsdaSearchResponse {
  foods?: UsdaFood[]
}

// https://fdc.nal.usda.gov/api-spec — stable nutrient IDs, not names (names vary by dataset).
const NUTRIENT_ID = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fibre: 1079,
} as const

function findNutrient(food: UsdaFood, nutrientId: number): number {
  return food.foodNutrients?.find((n) => n.nutrientId === nutrientId)?.value ?? 0
}

/**
 * USDA's Foundation/SR Legacy datasets report nutrients per 100g, which is what
 * we standardize on here (consistent with the OpenFoodFacts provider). Branded
 * foods in this same search can carry per-serving label values instead, so
 * results are a reasonable approximation rather than a guaranteed 100g basis —
 * acceptable for a fallback provider that only runs when OpenFoodFacts has
 * nothing.
 */
export async function searchUsda(
  query: string,
  limit: number,
  apiKey: string | undefined,
): Promise<ExternalFoodResult[]> {
  if (!apiKey) return []

  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', query)
  url.searchParams.set('pageSize', String(limit))

  const response = await fetch(url, { signal: AbortSignal.timeout(4000) })
  if (!response.ok) return []

  const data = await response.json<UsdaSearchResponse>()
  return (data.foods ?? [])
    .filter((food) => findNutrient(food, NUTRIENT_ID.calories) > 0)
    .map((food) => ({
      source: 'usda' as const,
      sourceId: String(food.fdcId),
      name: food.description,
      brand: food.brandOwner ?? null,
      barcode: null,
      servingSize: 100,
      servingUnit: 'g',
      calories: round2(findNutrient(food, NUTRIENT_ID.calories)),
      proteinG: round2(findNutrient(food, NUTRIENT_ID.protein)),
      carbsG: round2(findNutrient(food, NUTRIENT_ID.carbs)),
      fatG: round2(findNutrient(food, NUTRIENT_ID.fat)),
      fibreG: round2(findNutrient(food, NUTRIENT_ID.fibre)),
    }))
}
