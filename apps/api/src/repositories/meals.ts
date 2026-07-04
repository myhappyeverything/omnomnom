import type { Env } from '../types/env.js'
import type { MealItemRow, MealRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export interface ResolvedMealItem {
  foodId: string | null
  recipeId: string | null
  quantity: number
  unit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
}

export interface MealTotals {
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFibreG: number
}

export async function findMealById(
  env: Env,
  userId: string,
  mealId: string,
): Promise<MealRow | null> {
  return env.DB.prepare('SELECT * FROM meals WHERE id = ? AND user_id = ?')
    .bind(mealId, userId)
    .first<MealRow>()
}

export async function findMealByClientId(
  env: Env,
  userId: string,
  clientId: string,
): Promise<MealRow | null> {
  return env.DB.prepare('SELECT * FROM meals WHERE user_id = ? AND client_id = ?')
    .bind(userId, clientId)
    .first<MealRow>()
}

export async function listMealItems(env: Env, mealId: string): Promise<MealItemRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM meal_items WHERE meal_id = ? ORDER BY sort_order ASC',
  )
    .bind(mealId)
    .all<MealItemRow>()
  return results
}

export async function listMeals(
  env: Env,
  userId: string,
  range: { from?: string; to?: string },
): Promise<MealRow[]> {
  const conditions = ['user_id = ?']
  const values: (string | number)[] = [userId]
  if (range.from) {
    conditions.push('logged_at >= ?')
    values.push(range.from)
  }
  if (range.to) {
    conditions.push('logged_at <= ?')
    values.push(range.to)
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM meals WHERE ${conditions.join(' AND ')} ORDER BY logged_at DESC`,
  )
    .bind(...values)
    .all<MealRow>()
  return results
}

export async function createMealWithItems(
  env: Env,
  userId: string,
  meal: {
    mealType: string
    loggedAt: string
    notes: string | null
    photoR2Key: string | null
    clientId: string | null
  },
  totals: MealTotals,
  items: ResolvedMealItem[],
): Promise<string> {
  const id = newId()
  const timestamp = nowIso()

  const statements = [
    env.DB.prepare(
      `INSERT INTO meals
        (id, user_id, meal_type, logged_at, photo_r2_key, notes, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fibre_g, client_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      userId,
      meal.mealType,
      meal.loggedAt,
      meal.photoR2Key,
      meal.notes,
      totals.totalCalories,
      totals.totalProteinG,
      totals.totalCarbsG,
      totals.totalFatG,
      totals.totalFibreG,
      meal.clientId,
      timestamp,
      timestamp,
    ),
    ...items.map((item, index) =>
      env.DB.prepare(
        `INSERT INTO meal_items (id, meal_id, food_id, recipe_id, quantity, unit, calories, protein_g, carbs_g, fat_g, fibre_g, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        newId(),
        id,
        item.foodId,
        item.recipeId,
        item.quantity,
        item.unit,
        item.calories,
        item.proteinG,
        item.carbsG,
        item.fatG,
        item.fibreG,
        index,
      ),
    ),
  ]

  await env.DB.batch(statements)
  return id
}

export async function replaceMealItemsAndTotals(
  env: Env,
  mealId: string,
  totals: MealTotals,
  items: ResolvedMealItem[],
): Promise<void> {
  const statements = [
    env.DB.prepare('DELETE FROM meal_items WHERE meal_id = ?').bind(mealId),
    ...items.map((item, index) =>
      env.DB.prepare(
        `INSERT INTO meal_items (id, meal_id, food_id, recipe_id, quantity, unit, calories, protein_g, carbs_g, fat_g, fibre_g, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        newId(),
        mealId,
        item.foodId,
        item.recipeId,
        item.quantity,
        item.unit,
        item.calories,
        item.proteinG,
        item.carbsG,
        item.fatG,
        item.fibreG,
        index,
      ),
    ),
    env.DB.prepare(
      `UPDATE meals SET total_calories = ?, total_protein_g = ?, total_carbs_g = ?, total_fat_g = ?, total_fibre_g = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(
      totals.totalCalories,
      totals.totalProteinG,
      totals.totalCarbsG,
      totals.totalFatG,
      totals.totalFibreG,
      nowIso(),
      mealId,
    ),
  ]
  await env.DB.batch(statements)
}

export async function updateMealFields(
  env: Env,
  mealId: string,
  fields: { mealType?: string; loggedAt?: string; notes?: string },
): Promise<void> {
  const setClauses: string[] = []
  const values: (string | null)[] = []
  if (fields.mealType !== undefined) {
    setClauses.push('meal_type = ?')
    values.push(fields.mealType)
  }
  if (fields.loggedAt !== undefined) {
    setClauses.push('logged_at = ?')
    values.push(fields.loggedAt)
  }
  if (fields.notes !== undefined) {
    setClauses.push('notes = ?')
    values.push(fields.notes)
  }
  if (setClauses.length === 0) return
  setClauses.push('updated_at = ?')
  values.push(nowIso())
  values.push(mealId)
  await env.DB.prepare(`UPDATE meals SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()
}

export async function deleteMeal(env: Env, userId: string, mealId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?').bind(mealId, userId).run()
}
