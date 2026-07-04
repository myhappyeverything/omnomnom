import type { CreateMealInput, MealRecord } from '@omnomnom/shared'
import { apiRequest } from './client'

export async function listMeals(range: { from?: string; to?: string } = {}): Promise<MealRecord[]> {
  const params = new URLSearchParams()
  if (range.from) params.set('from', range.from)
  if (range.to) params.set('to', range.to)
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await apiRequest<{ meals: MealRecord[] }>(`/api/meals${query}`)
  return data.meals
}

export async function createMeal(input: CreateMealInput): Promise<MealRecord> {
  const data = await apiRequest<{ meal: MealRecord }>('/api/meals', { method: 'POST', body: input })
  return data.meal
}

export async function deleteMeal(id: string): Promise<void> {
  await apiRequest(`/api/meals/${id}`, { method: 'DELETE' })
}
