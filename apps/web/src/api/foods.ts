import type { CreateCustomFoodInput, FoodRecord, MaterializeExternalFoodInput } from '@omnomnom/shared'
import { apiRequest } from './client'

export async function searchFoods(query: string, limit = 20): Promise<FoodRecord[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  const data = await apiRequest<{ foods: FoodRecord[] }>(`/api/foods?${params.toString()}`)
  return data.foods
}

export async function listRecentFoods(): Promise<FoodRecord[]> {
  const data = await apiRequest<{ foods: FoodRecord[] }>('/api/foods/recent')
  return data.foods
}

export async function listFrequentFoods(): Promise<FoodRecord[]> {
  const data = await apiRequest<{ foods: FoodRecord[] }>('/api/foods/frequent')
  return data.foods
}

export async function listFavouriteFoods(): Promise<FoodRecord[]> {
  const data = await apiRequest<{ foods: FoodRecord[] }>('/api/foods/favourites')
  return data.foods
}

export async function createCustomFood(input: CreateCustomFoodInput): Promise<FoodRecord> {
  const data = await apiRequest<{ food: FoodRecord }>('/api/foods', { method: 'POST', body: input })
  return data.food
}

export async function addFavourite(foodId: string): Promise<void> {
  await apiRequest(`/api/foods/${foodId}/favourite`, { method: 'PUT' })
}

export async function removeFavourite(foodId: string): Promise<void> {
  await apiRequest(`/api/foods/${foodId}/favourite`, { method: 'DELETE' })
}

async function materializeExternalFood(input: MaterializeExternalFoodInput): Promise<FoodRecord> {
  const data = await apiRequest<{ food: FoodRecord }>('/api/foods/external', {
    method: 'POST',
    body: input,
  })
  return data.food
}

/** A search result is either already a real D1 row (isLocal) or a live provider hit — materialize the latter before logging/favouriting it. */
export async function resolveFoodId(food: FoodRecord): Promise<string> {
  if (food.isLocal) return food.id
  const materialized = await materializeExternalFood({
    source: food.source as 'openfoodfacts' | 'usda',
    sourceId: food.sourceId!,
    barcode: food.barcode,
    name: food.name,
    brand: food.brand,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    calories: food.calories,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fibreG: food.fibreG,
  })
  return materialized.id
}
