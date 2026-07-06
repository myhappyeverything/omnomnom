import type {
  CreateCustomFoodInput,
  FoodRecord,
  MaterializeExternalFoodInput,
} from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { FoodRow } from '../types/models.js'
import { NotFoundError } from '../lib/errors.js'
import * as foodsRepo from '../repositories/foods.js'
import { searchExternalProviders, type ExternalFoodResult } from '../lib/foodProviders/index.js'

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
    isLocal: true,
    ...(isFavourite !== undefined ? { isFavourite } : {}),
  }
}

// Not persisted — this is a live provider hit shown alongside local results.
// Logging or favouriting it calls materializeExternalFood first to get a
// real D1 row and id.
function toUnsavedFoodRecord(result: ExternalFoodResult): FoodRecord {
  return {
    id: `unsaved:${result.source}:${result.sourceId}`,
    source: result.source,
    sourceId: result.sourceId,
    barcode: result.barcode,
    name: result.name,
    brand: result.brand,
    servingSize: result.servingSize,
    servingUnit: result.servingUnit,
    calories: result.calories,
    proteinG: result.proteinG,
    carbsG: result.carbsG,
    fatG: result.fatG,
    fibreG: result.fibreG,
    isLocal: false,
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
  // Local D1 lookup and the external-provider fan-out run concurrently —
  // neither has to wait on the other, and unlike before, a search no longer
  // writes anything to D1 (that now only happens when a result is actually
  // logged/favourited via materializeExternalFood), so this response is just
  // two reads.
  const [localRows, externalResults] = await Promise.all([
    foodsRepo.searchFoodsLocal(env, query, limit),
    searchExternalProviders(env, query, limit),
  ])

  const localRecords = await toFoodRecordsWithFavourites(env, userId, localRows)

  const localSourceIds = new Set(
    localRows.filter((row) => row.source_id).map((row) => `${row.source}:${row.source_id}`),
  )
  const unsavedRecords = externalResults
    .filter((result) => !localSourceIds.has(`${result.source}:${result.sourceId}`))
    .map(toUnsavedFoodRecord)

  return [...localRecords, ...unsavedRecords].slice(0, limit)
}

/**
 * Called when a user logs/favourites a search result that only exists as a
 * live provider hit (FoodRecord.isLocal === false) — upserts it into D1 so
 * meal_items/favourite_foods/recent_foods have a real row to reference, and
 * every future search for the same product finds it locally instead of
 * calling the provider again.
 */
export async function materializeExternalFood(
  env: Env,
  input: MaterializeExternalFoodInput,
): Promise<FoodRecord> {
  const row = await foodsRepo.upsertFood(env, {
    source: input.source,
    source_id: input.sourceId,
    barcode: input.barcode ?? null,
    name: input.name,
    brand: input.brand ?? null,
    serving_size: input.servingSize,
    serving_unit: input.servingUnit,
    calories: input.calories,
    protein_g: input.proteinG,
    carbs_g: input.carbsG,
    fat_g: input.fatG,
    fibre_g: input.fibreG,
  })
  return toFoodRecord(row)
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
