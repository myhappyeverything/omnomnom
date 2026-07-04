import type { CreateRecipeInput, RecipeRecord } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { FoodRow, RecipeItemRow, RecipeRow } from '../types/models.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { round2 } from '../lib/numbers.js'
import * as recipesRepo from '../repositories/recipes.js'
import * as foodsRepo from '../repositories/foods.js'
import { toFoodRecord } from './foods.js'

async function toRecipeRecord(env: Env, row: RecipeRow): Promise<RecipeRecord> {
  const itemRows = await recipesRepo.listRecipeItems(env, row.id)
  const foods = await Promise.all(itemRows.map((item) => foodsRepo.findFoodById(env, item.food_id)))
  const foodsById = new Map(foods.filter((f): f is FoodRow => !!f).map((f) => [f.id, f]))

  let totalCalories = 0
  let totalProteinG = 0
  let totalCarbsG = 0
  let totalFatG = 0
  let totalFibreG = 0

  const items = itemRows.map((item: RecipeItemRow) => {
    const food = foodsById.get(item.food_id)
    if (food) {
      const ratio = item.quantity / food.serving_size
      totalCalories += food.calories * ratio
      totalProteinG += food.protein_g * ratio
      totalCarbsG += food.carbs_g * ratio
      totalFatG += food.fat_g * ratio
      totalFibreG += food.fibre_g * ratio
    }
    return {
      id: item.id,
      foodId: item.food_id,
      food: food ? toFoodRecord(food) : undefined,
      quantity: item.quantity,
      unit: item.unit,
    }
  })

  return {
    id: row.id,
    name: row.name,
    servings: row.servings,
    instructions: row.instructions,
    items,
    caloriesPerServing: round2(totalCalories / row.servings),
    proteinGPerServing: round2(totalProteinG / row.servings),
    carbsGPerServing: round2(totalCarbsG / row.servings),
    fatGPerServing: round2(totalFatG / row.servings),
    fibreGPerServing: round2(totalFibreG / row.servings),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createRecipe(
  env: Env,
  userId: string,
  input: CreateRecipeInput,
): Promise<RecipeRecord> {
  for (const item of input.items) {
    const food = await foodsRepo.findFoodById(env, item.foodId)
    if (!food) throw new NotFoundError(`Food ${item.foodId} not found`)
    if (item.unit !== food.serving_unit) {
      throw new ValidationError(
        `Unit "${item.unit}" doesn't match "${food.name}"'s serving unit "${food.serving_unit}"`,
      )
    }
  }

  const id = await recipesRepo.createRecipeWithItems(
    env,
    userId,
    { name: input.name, servings: input.servings, instructions: input.instructions ?? null },
    input.items,
  )
  const row = await recipesRepo.findRecipeById(env, userId, id)
  if (!row) throw new Error('Failed to create recipe')
  return toRecipeRecord(env, row)
}

export async function getRecipe(env: Env, userId: string, id: string): Promise<RecipeRecord> {
  const row = await recipesRepo.findRecipeById(env, userId, id)
  if (!row) throw new NotFoundError('Recipe not found')
  return toRecipeRecord(env, row)
}

/** Used by the meals service to price a recipe-based meal item — quantity there means "servings". */
export async function findRecipeForMealItem(
  env: Env,
  userId: string,
  id: string,
): Promise<RecipeRecord | null> {
  const row = await recipesRepo.findRecipeById(env, userId, id)
  if (!row) return null
  return toRecipeRecord(env, row)
}

export async function listRecipes(env: Env, userId: string): Promise<RecipeRecord[]> {
  const rows = await recipesRepo.listRecipes(env, userId)
  return Promise.all(rows.map((row) => toRecipeRecord(env, row)))
}

export async function deleteRecipe(env: Env, userId: string, id: string): Promise<void> {
  const row = await recipesRepo.findRecipeById(env, userId, id)
  if (!row) throw new NotFoundError('Recipe not found')
  await recipesRepo.deleteRecipe(env, userId, id)
}
