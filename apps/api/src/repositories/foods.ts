import type { CreateCustomFoodInput } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { FavouriteFoodRow, FoodRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function findFoodById(env: Env, id: string): Promise<FoodRow | null> {
  return env.DB.prepare('SELECT * FROM foods WHERE id = ?').bind(id).first<FoodRow>()
}

export async function searchFoodsLocal(env: Env, query: string, limit: number): Promise<FoodRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM foods WHERE name LIKE ? ESCAPE '\\' ORDER BY name ASC LIMIT ?`,
  )
    .bind(`%${escapeLike(query)}%`, limit)
    .all<FoodRow>()
  return results
}

function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export async function createCustomFood(
  env: Env,
  userId: string,
  input: CreateCustomFoodInput,
): Promise<FoodRow> {
  const id = newId()
  const timestamp = nowIso()
  await env.DB.prepare(
    `INSERT INTO foods
      (id, source, barcode, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fibre_g, created_by_user_id, created_at, updated_at)
     VALUES (?, 'custom', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.barcode ?? null,
      input.name,
      input.brand ?? null,
      input.servingSize,
      input.servingUnit,
      input.calories,
      input.proteinG,
      input.carbsG,
      input.fatG,
      input.fibreG,
      userId,
      timestamp,
      timestamp,
    )
    .run()

  const food = await findFoodById(env, id)
  if (!food) throw new Error('Failed to create food')
  return food
}

export async function listCustomFoodsByUser(env: Env, userId: string): Promise<FoodRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM foods WHERE created_by_user_id = ? AND source = 'custom' ORDER BY created_at ASC`,
  )
    .bind(userId)
    .all<FoodRow>()
  return results
}

export async function upsertFood(
  env: Env,
  food: Omit<FoodRow, 'id' | 'created_by_user_id' | 'created_at' | 'updated_at'>,
): Promise<FoodRow> {
  if (food.source_id) {
    const existing = await env.DB.prepare('SELECT * FROM foods WHERE source = ? AND source_id = ?')
      .bind(food.source, food.source_id)
      .first<FoodRow>()
    if (existing) return existing
  }

  const id = newId()
  const timestamp = nowIso()
  await env.DB.prepare(
    `INSERT INTO foods
      (id, source, source_id, barcode, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fibre_g, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      food.source,
      food.source_id,
      food.barcode,
      food.name,
      food.brand,
      food.serving_size,
      food.serving_unit,
      food.calories,
      food.protein_g,
      food.carbs_g,
      food.fat_g,
      food.fibre_g,
      timestamp,
      timestamp,
    )
    .run()

  const created = await findFoodById(env, id)
  if (!created) throw new Error('Failed to upsert food')
  return created
}

export async function recordFoodUsage(env: Env, userId: string, foodId: string): Promise<void> {
  const timestamp = nowIso()
  const existing = await env.DB.prepare(
    'SELECT id FROM recent_foods WHERE user_id = ? AND food_id = ?',
  )
    .bind(userId, foodId)
    .first<{ id: string }>()

  if (existing) {
    await env.DB.prepare(
      'UPDATE recent_foods SET last_logged_at = ?, log_count = log_count + 1 WHERE id = ?',
    )
      .bind(timestamp, existing.id)
      .run()
  } else {
    await env.DB.prepare(
      'INSERT INTO recent_foods (id, user_id, food_id, last_logged_at, log_count) VALUES (?, ?, ?, ?, 1)',
    )
      .bind(newId(), userId, foodId, timestamp)
      .run()
  }
}

export async function listRecentFoods(env: Env, userId: string, limit = 20): Promise<FoodRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT f.* FROM recent_foods rf
     JOIN foods f ON f.id = rf.food_id
     WHERE rf.user_id = ?
     ORDER BY rf.last_logged_at DESC
     LIMIT ?`,
  )
    .bind(userId, limit)
    .all<FoodRow>()
  return results
}

export async function listFrequentFoods(env: Env, userId: string, limit = 20): Promise<FoodRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT f.* FROM recent_foods rf
     JOIN foods f ON f.id = rf.food_id
     WHERE rf.user_id = ?
     ORDER BY rf.log_count DESC
     LIMIT ?`,
  )
    .bind(userId, limit)
    .all<FoodRow>()
  return results
}

export async function listFavouriteFoods(env: Env, userId: string): Promise<FoodRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT f.* FROM favourite_foods ff
     JOIN foods f ON f.id = ff.food_id
     WHERE ff.user_id = ?
     ORDER BY ff.created_at DESC`,
  )
    .bind(userId)
    .all<FoodRow>()
  return results
}

export async function getFavouriteFoodIds(
  env: Env,
  userId: string,
  foodIds: string[],
): Promise<Set<string>> {
  if (foodIds.length === 0) return new Set()
  const placeholders = foodIds.map(() => '?').join(', ')
  const { results } = await env.DB.prepare(
    `SELECT food_id FROM favourite_foods WHERE user_id = ? AND food_id IN (${placeholders})`,
  )
    .bind(userId, ...foodIds)
    .all<{ food_id: string }>()
  return new Set(results.map((r) => r.food_id))
}

export async function addFavourite(env: Env, userId: string, foodId: string): Promise<void> {
  const existing = await env.DB.prepare(
    'SELECT id FROM favourite_foods WHERE user_id = ? AND food_id = ?',
  )
    .bind(userId, foodId)
    .first<FavouriteFoodRow>()
  if (existing) return
  await env.DB.prepare(
    'INSERT INTO favourite_foods (id, user_id, food_id, created_at) VALUES (?, ?, ?, ?)',
  )
    .bind(newId(), userId, foodId, nowIso())
    .run()
}

export async function removeFavourite(env: Env, userId: string, foodId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM favourite_foods WHERE user_id = ? AND food_id = ?')
    .bind(userId, foodId)
    .run()
}
