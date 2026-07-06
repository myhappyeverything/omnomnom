import {
  aggregateByDay,
  groupMealsByDay,
  localDateKeyAtOffset,
  type NutritionScoreLabel,
} from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import { NotFoundError } from '../lib/errors.js'
import * as mealsService from './meals.js'
import * as goalsService from './goals.js'
import { getNutritionScoreForDay, type NutritionScoreRequest } from './nutritionScore.js'

export type MascotMood = 'excited' | 'happy' | 'neutral' | 'sad'

const MOOD_BY_LABEL: Record<NutritionScoreLabel, MascotMood> = {
  Excellent: 'excited',
  Good: 'happy',
  Fair: 'neutral',
  'Needs Improvement': 'sad',
}

const MESSAGE_BY_LABEL: Record<NutritionScoreLabel, string> = {
  Excellent: 'Great balance today!',
  Good: 'Solid choices today',
  Fair: 'Room to improve today',
  'Needs Improvement': "Let's turn today around",
}

export interface MacroProgress {
  consumed: number
  target: number
}

export interface WidgetSummary {
  score: number
  label: NutritionScoreLabel
  message: string
  mascotMood: MascotMood
  macros: {
    calories: MacroProgress
    protein: MacroProgress
    fat: MacroProgress
  }
}

export async function getWidgetSummary(
  env: Env,
  userId: string,
  request: NutritionScoreRequest,
): Promise<WidgetSummary> {
  const [breakdown, goal, meals] = await Promise.all([
    getNutritionScoreForDay(env, userId, request),
    goalsService.getActiveGoal(env, userId),
    mealsService.listMeals(env, userId, { from: request.from, to: request.to }),
  ])
  if (!goal) throw new NotFoundError('No active goal')

  const keyFn = (iso: string) => localDateKeyAtOffset(iso, request.tzOffsetMinutes)
  const today = aggregateByDay(meals, [], [request.dateKey], keyFn).at(-1)!
  const todayMeals = groupMealsByDay(meals, keyFn).get(request.dateKey) ?? []
  const fatConsumed = todayMeals.reduce((sum, meal) => sum + meal.totalFatG, 0)

  return {
    score: breakdown.score,
    label: breakdown.label,
    message: MESSAGE_BY_LABEL[breakdown.label],
    mascotMood: MOOD_BY_LABEL[breakdown.label],
    macros: {
      calories: { consumed: today.calories, target: goal.calorieTarget },
      protein: { consumed: today.proteinG, target: goal.proteinTargetG },
      fat: { consumed: fatConsumed, target: goal.fatTargetG },
    },
  }
}
