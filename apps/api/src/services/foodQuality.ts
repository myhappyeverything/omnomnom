import type { MealRecord } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import { sha256Hex } from '../lib/crypto.js'
import { assessFoodQuality, type FoodQualityMealInput, type FoodQualityResult } from '../lib/openai.js'
import * as foodQualityRepo from '../repositories/foodQuality.js'

/** A neutral (not punishing) fallback if the AI call fails — one flaky request shouldn't tank the score. */
const FALLBACK_SCORE: FoodQualityResult = { overallScore: 70, mealScores: [] }

function buildMealsHash(meals: MealRecord[]): Promise<string> {
  const parts = meals
    .flatMap((meal) =>
      meal.items.map((item) => `${meal.mealType}:${item.foodId ?? item.recipeId}:${item.quantity}`),
    )
    .sort()
  return sha256Hex(parts.join('|'))
}

/**
 * Cached per (user, local day) — a day's logged meals don't change once the
 * day is over, so this only ever re-calls the model when today's meals_hash
 * has actually moved (a new item logged) or the day has never been assessed.
 * Skips the AI call entirely for a day with nothing logged.
 */
export async function getFoodQualityForDay(
  env: Env,
  userId: string,
  dateKey: string,
  meals: MealRecord[],
): Promise<FoodQualityResult> {
  if (meals.length === 0) {
    return { overallScore: 0, mealScores: [] }
  }

  const mealsHash = await buildMealsHash(meals)
  const cached = await foodQualityRepo.findByUserAndDate(env, userId, dateKey)
  if (cached && cached.meals_hash === mealsHash) {
    return {
      overallScore: cached.overall_score,
      mealScores: JSON.parse(cached.meal_scores_json) as FoodQualityResult['mealScores'],
    }
  }

  const input: FoodQualityMealInput[] = meals.map((meal) => ({
    mealType: meal.mealType,
    items: meal.items.map((item) => ({
      name: item.food?.name ?? 'Recipe item',
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      fibreG: item.fibreG,
    })),
  }))

  try {
    const result = await assessFoodQuality(env.OPENAI_API_KEY, input)
    await foodQualityRepo.upsert(env, {
      userId,
      dateKey,
      mealsHash,
      overallScore: result.overallScore,
      mealScoresJson: JSON.stringify(result.mealScores),
    })
    return result
  } catch {
    return FALLBACK_SCORE
  }
}
