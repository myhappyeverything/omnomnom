import type { CreateRecipeInput, RecipeRecord } from '@omnomnom/shared'
import { apiRequest } from './client'

export async function listRecipes(): Promise<RecipeRecord[]> {
  const data = await apiRequest<{ recipes: RecipeRecord[] }>('/api/recipes')
  return data.recipes
}

export async function createRecipe(input: CreateRecipeInput): Promise<RecipeRecord> {
  const data = await apiRequest<{ recipe: RecipeRecord }>('/api/recipes', {
    method: 'POST',
    body: input,
  })
  return data.recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  await apiRequest(`/api/recipes/${id}`, { method: 'DELETE' })
}
