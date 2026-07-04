import type { RecipeItemInput } from '@purple/shared'
import type { Env } from '../types/env.js'
import type { RecipeItemRow, RecipeRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function findRecipeById(
  env: Env,
  userId: string,
  id: string,
): Promise<RecipeRow | null> {
  return env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<RecipeRow>()
}

export async function listRecipes(env: Env, userId: string): Promise<RecipeRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
  )
    .bind(userId)
    .all<RecipeRow>()
  return results
}

export async function listRecipeItems(env: Env, recipeId: string): Promise<RecipeItemRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM recipe_items WHERE recipe_id = ? ORDER BY sort_order ASC',
  )
    .bind(recipeId)
    .all<RecipeItemRow>()
  return results
}

export async function createRecipeWithItems(
  env: Env,
  userId: string,
  recipe: { name: string; servings: number; instructions: string | null },
  items: RecipeItemInput[],
): Promise<string> {
  const id = newId()
  const timestamp = nowIso()

  const statements = [
    env.DB.prepare(
      `INSERT INTO recipes (id, user_id, name, servings, instructions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, userId, recipe.name, recipe.servings, recipe.instructions, timestamp, timestamp),
    ...items.map((item, index) =>
      env.DB.prepare(
        `INSERT INTO recipe_items (id, recipe_id, food_id, quantity, unit, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(newId(), id, item.foodId, item.quantity, item.unit, index),
    ),
  ]

  await env.DB.batch(statements)
  return id
}

export async function deleteRecipe(env: Env, userId: string, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?').bind(id, userId).run()
}
