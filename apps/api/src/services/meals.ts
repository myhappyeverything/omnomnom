import type { CreateMealInput, MealItemInput, MealRecord, UpdateMealInput } from '@purple/shared'
import type { Env } from '../types/env.js'
import type { FoodRow, MealItemRow, MealRow } from '../types/models.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { round2 } from '../lib/numbers.js'
import * as mealsRepo from '../repositories/meals.js'
import * as foodsRepo from '../repositories/foods.js'
import { toFoodRecord } from './foods.js'
import { findRecipeForMealItem } from './recipes.js'
import type { MealTotals, ResolvedMealItem } from '../repositories/meals.js'

/**
 * Nutrition values are always derived server-side — from a food's per-serving
 * values scaled by quantity, or a recipe's per-serving totals scaled by
 * servings consumed — the client can request an item + quantity, but never
 * dictate the resulting calories/macros directly.
 */
async function resolveItems(
  env: Env,
  userId: string,
  items: MealItemInput[],
): Promise<{ resolved: ResolvedMealItem[] }> {
  const foodsById = new Map<string, FoodRow>()
  const resolved: ResolvedMealItem[] = []

  for (const item of items) {
    if (item.foodId) {
      let food = foodsById.get(item.foodId)
      if (!food) {
        const found = await foodsRepo.findFoodById(env, item.foodId)
        if (!found) throw new NotFoundError(`Food ${item.foodId} not found`)
        food = found
        foodsById.set(item.foodId, food)
      }

      if (item.unit !== food.serving_unit) {
        throw new ValidationError(
          `Unit "${item.unit}" doesn't match "${food.name}"'s serving unit "${food.serving_unit}"`,
        )
      }

      const ratio = item.quantity / food.serving_size
      resolved.push({
        foodId: item.foodId,
        recipeId: null,
        quantity: item.quantity,
        unit: item.unit,
        calories: round2(food.calories * ratio),
        proteinG: round2(food.protein_g * ratio),
        carbsG: round2(food.carbs_g * ratio),
        fatG: round2(food.fat_g * ratio),
        fibreG: round2(food.fibre_g * ratio),
      })
    } else if (item.recipeId) {
      const recipe = await findRecipeForMealItem(env, userId, item.recipeId)
      if (!recipe) throw new NotFoundError(`Recipe ${item.recipeId} not found`)

      // quantity is "servings of this recipe", e.g. 1.5 servings.
      resolved.push({
        foodId: null,
        recipeId: item.recipeId,
        quantity: item.quantity,
        unit: item.unit,
        calories: round2(recipe.caloriesPerServing * item.quantity),
        proteinG: round2(recipe.proteinGPerServing * item.quantity),
        carbsG: round2(recipe.carbsGPerServing * item.quantity),
        fatG: round2(recipe.fatGPerServing * item.quantity),
        fibreG: round2(recipe.fibreGPerServing * item.quantity),
      })
    }
  }

  return { resolved }
}

function sumTotals(items: ResolvedMealItem[]): MealTotals {
  return items.reduce<MealTotals>(
    (acc, item) => ({
      totalCalories: round2(acc.totalCalories + item.calories),
      totalProteinG: round2(acc.totalProteinG + item.proteinG),
      totalCarbsG: round2(acc.totalCarbsG + item.carbsG),
      totalFatG: round2(acc.totalFatG + item.fatG),
      totalFibreG: round2(acc.totalFibreG + item.fibreG),
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0, totalFibreG: 0 },
  )
}

async function toMealRecord(env: Env, row: MealRow): Promise<MealRecord> {
  const itemRows = await mealsRepo.listMealItems(env, row.id)
  const foodIds = [...new Set(itemRows.map((i) => i.food_id).filter((id): id is string => !!id))]
  const foods = await Promise.all(foodIds.map((id) => foodsRepo.findFoodById(env, id)))
  const foodsById = new Map(foods.filter((f): f is FoodRow => !!f).map((f) => [f.id, f]))

  return {
    id: row.id,
    mealType: row.meal_type,
    loggedAt: row.logged_at,
    photoR2Key: row.photo_r2_key,
    notes: row.notes,
    totalCalories: row.total_calories,
    totalProteinG: row.total_protein_g,
    totalCarbsG: row.total_carbs_g,
    totalFatG: row.total_fat_g,
    totalFibreG: row.total_fibre_g,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: itemRows.map((item: MealItemRow) => ({
      id: item.id,
      foodId: item.food_id,
      recipeId: item.recipe_id,
      food:
        item.food_id && foodsById.has(item.food_id)
          ? toFoodRecord(foodsById.get(item.food_id)!)
          : undefined,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      proteinG: item.protein_g,
      carbsG: item.carbs_g,
      fatG: item.fat_g,
      fibreG: item.fibre_g,
      aiConfidence: item.ai_confidence,
    })),
  }
}

async function recordUsage(env: Env, userId: string, foodIds: (string | null)[]): Promise<void> {
  await Promise.all(
    foodIds
      .filter((id): id is string => !!id)
      .map((foodId) => foodsRepo.recordFoodUsage(env, userId, foodId)),
  )
}

export async function createMeal(
  env: Env,
  userId: string,
  input: CreateMealInput,
): Promise<MealRecord> {
  if (input.clientId) {
    const existing = await mealsRepo.findMealByClientId(env, userId, input.clientId)
    if (existing) {
      return updateMeal(env, userId, existing.id, input)
    }
  }

  const { resolved } = await resolveItems(env, userId, input.items)
  const totals = sumTotals(resolved)
  const mealId = await mealsRepo.createMealWithItems(
    env,
    userId,
    {
      mealType: input.mealType,
      loggedAt: input.loggedAt,
      notes: input.notes ?? null,
      photoR2Key: input.photoR2Key ?? null,
      clientId: input.clientId ?? null,
    },
    totals,
    resolved,
  )

  await recordUsage(
    env,
    userId,
    resolved.map((r) => r.foodId),
  )

  const row = await mealsRepo.findMealById(env, userId, mealId)
  if (!row) throw new Error('Failed to create meal')
  return toMealRecord(env, row)
}

export async function getMeal(env: Env, userId: string, mealId: string): Promise<MealRecord> {
  const row = await mealsRepo.findMealById(env, userId, mealId)
  if (!row) throw new NotFoundError('Meal not found')
  return toMealRecord(env, row)
}

export async function listMeals(
  env: Env,
  userId: string,
  range: { from?: string; to?: string },
): Promise<MealRecord[]> {
  const rows = await mealsRepo.listMeals(env, userId, range)
  return Promise.all(rows.map((row) => toMealRecord(env, row)))
}

export async function updateMeal(
  env: Env,
  userId: string,
  mealId: string,
  input: UpdateMealInput,
): Promise<MealRecord> {
  const row = await mealsRepo.findMealById(env, userId, mealId)
  if (!row) throw new NotFoundError('Meal not found')

  await mealsRepo.updateMealFields(env, mealId, {
    mealType: input.mealType,
    loggedAt: input.loggedAt,
    notes: input.notes,
  })

  if (input.items) {
    const { resolved } = await resolveItems(env, userId, input.items)
    const totals = sumTotals(resolved)
    await mealsRepo.replaceMealItemsAndTotals(env, mealId, totals, resolved)
    await recordUsage(
      env,
      userId,
      resolved.map((r) => r.foodId),
    )
  }

  const updated = await mealsRepo.findMealById(env, userId, mealId)
  if (!updated) throw new Error('Failed to update meal')
  return toMealRecord(env, updated)
}

export async function deleteMeal(env: Env, userId: string, mealId: string): Promise<void> {
  const row = await mealsRepo.findMealById(env, userId, mealId)
  if (!row) throw new NotFoundError('Meal not found')
  await mealsRepo.deleteMeal(env, userId, mealId)
}
