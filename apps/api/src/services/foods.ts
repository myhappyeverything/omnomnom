import type { CreateCustomFoodInput, FoodRecord } from '@purple/shared'
import type { Env } from '../types/env.js'
import type { FoodRow } from '../types/models.js'
import { NotFoundError } from '../lib/errors.js'
import * as foodsRepo from '../repositories/foods.js'
import { searchExternalProviders } from '../lib/foodProviders/index.js'

// Only bother calling external providers when the local cache (everything
// ever searched or logged before) doesn't already have enough to show.
const MIN_LOCAL_RESULTS_BEFORE_EXTERNAL_SEARCH = 5

export function toFoodRecord(row: FoodRow, isFavourite?: boolean): FoodRecord {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fibreG: row.fibre_g,
    ...(isFavourite !== undefined ? { isFavourite } : {}),
  }
}

async function toFoodRecordsWithFavourites(
  env: Env,
  userId: string,
  rows: FoodRow[],
): Promise<FoodRecord[]> {
  const favouriteIds = await foodsRepo.getFavouriteFoodIds(
    env,
    userId,
    rows.map((r) => r.id),
  )
  return rows.map((row) => toFoodRecord(row, favouriteIds.has(row.id)))
}

export async function searchFoods(
  env: Env,
  userId: string,
  query: string,
  limit: number,
): Promise<FoodRecord[]> {
  const localRows = await foodsRepo.searchFoodsLocal(env, query, limit)
  let rows = localRows

  if (localRows.length < MIN_LOCAL_RESULTS_BEFORE_EXTERNAL_SEARCH) {
    const externalResults = await searchExternalProviders(env, query, limit)
    const upserted = await Promise.all(
      externalResults.map((result) =>
        foodsRepo.upsertFood(env, {
          source: result.source,
          source_id: result.sourceId,
          barcode: result.barcode,
          name: result.name,
          brand: result.brand,
          serving_size: result.servingSize,
          serving_unit: result.servingUnit,
          calories: result.calories,
          protein_g: result.proteinG,
          carbs_g: result.carbsG,
          fat_g: result.fatG,
          fibre_g: result.fibreG,
        }),
      ),
    )
    const existingIds = new Set(localRows.map((row) => row.id))
    rows = [...localRows, ...upserted.filter((food) => !existingIds.has(food.id))].slice(0, limit)
  }

  return toFoodRecordsWithFavourites(env, userId, rows)
}

export async function createCustomFood(
  env: Env,
  userId: string,
  input: CreateCustomFoodInput,
): Promise<FoodRecord> {
  const row = await foodsRepo.createCustomFood(env, userId, input)
  return toFoodRecord(row, false)
}

export async function listRecentFoods(env: Env, userId: string): Promise<FoodRecord[]> {
  const rows = await foodsRepo.listRecentFoods(env, userId)
  return toFoodRecordsWithFavourites(env, userId, rows)
}

export async function listFrequentFoods(env: Env, userId: string): Promise<FoodRecord[]> {
  const rows = await foodsRepo.listFrequentFoods(env, userId)
  return toFoodRecordsWithFavourites(env, userId, rows)
}

export async function listFavouriteFoods(env: Env, userId: string): Promise<FoodRecord[]> {
  const rows = await foodsRepo.listFavouriteFoods(env, userId)
  return rows.map((row) => toFoodRecord(row, true))
}

export async function listCustomFoods(env: Env, userId: string): Promise<FoodRecord[]> {
  const rows = await foodsRepo.listCustomFoodsByUser(env, userId)
  return toFoodRecordsWithFavourites(env, userId, rows)
}

export async function addFavourite(env: Env, userId: string, foodId: string): Promise<void> {
  const food = await foodsRepo.findFoodById(env, foodId)
  if (!food) throw new NotFoundError('Food not found')
  await foodsRepo.addFavourite(env, userId, foodId)
}

export async function removeFavourite(env: Env, userId: string, foodId: string): Promise<void> {
  await foodsRepo.removeFavourite(env, userId, foodId)
}
