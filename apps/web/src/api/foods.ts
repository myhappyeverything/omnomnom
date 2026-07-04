import type { CreateCustomFoodInput, FoodRecord } from '@omnomnom/shared'
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
