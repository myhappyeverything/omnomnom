import type { GoalRecord, MealRecord } from '@omnomnom/shared'
import {
  aggregateByDay,
  calculateConsistencyPercent,
  calculateNutritionScore,
  groupMealsByDay,
  localDateKeyAtOffset,
  scoreCaloriesPercent,
  scoreMeetOrExceedPercent,
  shiftDateKey,
  type DailyHabitSnapshot,
  type DayAggregate,
  type NutritionScoreBreakdown,
} from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import { NotFoundError } from '../lib/errors.js'
import * as mealsService from './meals.js'
import * as waterService from './water.js'
import * as goalsService from './goals.js'
import * as usersRepo from '../repositories/users.js'
import { getFoodQualityForDay } from './foodQuality.js'

const CONSISTENCY_WINDOW_DAYS = 14

function maxDateKey(a: string, b: string): string {
  return a > b ? a : b
}

function enumerateDateKeys(startKey: string, endKey: string): string[] {
  const keys: string[] = []
  let cursor = startKey
  while (cursor <= endKey) {
    keys.push(cursor)
    cursor = shiftDateKey(cursor, 1)
  }
  return keys
}

async function snapshotForDay(
  env: Env,
  userId: string,
  aggregate: DayAggregate,
  mealsForDay: MealRecord[],
  goal: GoalRecord,
): Promise<DailyHabitSnapshot> {
  const foodQuality = aggregate.hasLog
    ? await getFoodQualityForDay(env, userId, aggregate.dateKey, mealsForDay)
    : null

  return {
    caloriesPercent: scoreCaloriesPercent(aggregate.calories, goal.calorieTarget),
    proteinPercent: scoreMeetOrExceedPercent(aggregate.proteinG, goal.proteinTargetG),
    fibrePercent: scoreMeetOrExceedPercent(aggregate.fibreG, goal.fibreTargetG),
    mealsLoggedPercent: (aggregate.mealTypesLogged / 4) * 100,
    foodQualityPercent: foodQuality ? foodQuality.overallScore : null,
  }
}

function breakdownFromAggregate(
  aggregate: DayAggregate,
  goal: GoalRecord,
  foodQualityPercent: number,
  consistencyPercent: number,
): NutritionScoreBreakdown {
  return calculateNutritionScore({
    caloriesConsumed: aggregate.calories,
    calorieTarget: goal.calorieTarget,
    proteinConsumedG: aggregate.proteinG,
    proteinTargetG: goal.proteinTargetG,
    fibreConsumedG: aggregate.fibreG,
    fibreTargetG: goal.fibreTargetG,
    waterConsumedMl: aggregate.waterMl,
    waterTargetMl: goal.waterTargetMl,
    foodQualityPercent,
    consistencyPercent,
    mealTypesLoggedToday: aggregate.mealTypesLogged,
  })
}

export interface NutritionScoreRequest {
  dateKey: string
  from: string
  to: string
  tzOffsetMinutes: number
}

/**
 * The full, accurate score for one specific day — including a true rolling
 * 14-day Healthy Consistency window, where each of those days gets its own
 * AI-assessed Food Quality (cached forever once computed, so this is only
 * ever slow the very first time a given day is scored). This is what the
 * dashboard's "Today's Nutrition Score" card shows. Scoring every day in a
 * month at this depth would mean re-deriving each day's own 14-day window —
 * see getNutritionScoreRange for the lighter version used by charts/calendars.
 */
export async function getNutritionScoreForDay(
  env: Env,
  userId: string,
  request: NutritionScoreRequest,
): Promise<NutritionScoreBreakdown> {
  const goal = await goalsService.getActiveGoal(env, userId)
  if (!goal) throw new NotFoundError('No active goal')

  const user = await usersRepo.findUserById(env, userId)
  const earliestKey = user
    ? user.created_at.slice(0, 10)
    : shiftDateKey(request.dateKey, -(CONSISTENCY_WINDOW_DAYS - 1))
  const windowStartKey = maxDateKey(
    shiftDateKey(request.dateKey, -(CONSISTENCY_WINDOW_DAYS - 1)),
    earliestKey,
  )

  const lookbackFrom = new Date(
    new Date(request.from).getTime() - CONSISTENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const [meals, waterLogs] = await Promise.all([
    mealsService.listMeals(env, userId, { from: lookbackFrom, to: request.to }),
    waterService.listWaterLogs(env, userId, { from: lookbackFrom, to: request.to }),
  ])

  const keyFn = (iso: string) => localDateKeyAtOffset(iso, request.tzOffsetMinutes)
  const mealsByDay = groupMealsByDay(meals, keyFn)
  const windowKeys = enumerateDateKeys(windowStartKey, request.dateKey)
  const aggregates = aggregateByDay(meals, waterLogs, windowKeys, keyFn)

  const snapshots = await Promise.all(
    aggregates.map((aggregate) =>
      snapshotForDay(env, userId, aggregate, mealsByDay.get(aggregate.dateKey) ?? [], goal),
    ),
  )

  const consistencyPercent = calculateConsistencyPercent(snapshots)
  const today = aggregates.at(-1)!
  const todayFoodQualityPercent = snapshots.at(-1)!.foodQualityPercent ?? 0

  return breakdownFromAggregate(today, goal, todayFoodQualityPercent, consistencyPercent)
}

export interface NutritionScoreRangeRequest {
  dateKeys: string[]
  from: string
  to: string
  tzOffsetMinutes: number
}

export interface DailyScoreSummary {
  dateKey: string
  score: number
  label: NutritionScoreBreakdown['label']
}

/**
 * A lighter per-day score for views showing many days at once (trend charts,
 * the history calendar). Still the real formula and real AI-assessed Food
 * Quality per day (bounded to one AI call per unique day, ever, thanks to
 * the cache) — the one simplification is that each day's Healthy Consistency
 * reflects only that day rather than its own trailing 14-day window, which
 * would otherwise mean re-deriving up to 14x as many day-aggregates for a
 * month view.
 */
export async function getNutritionScoreRange(
  env: Env,
  userId: string,
  request: NutritionScoreRangeRequest,
): Promise<DailyScoreSummary[]> {
  const goal = await goalsService.getActiveGoal(env, userId)
  if (!goal) throw new NotFoundError('No active goal')

  const [meals, waterLogs] = await Promise.all([
    mealsService.listMeals(env, userId, { from: request.from, to: request.to }),
    waterService.listWaterLogs(env, userId, { from: request.from, to: request.to }),
  ])

  const keyFn = (iso: string) => localDateKeyAtOffset(iso, request.tzOffsetMinutes)
  const mealsByDay = groupMealsByDay(meals, keyFn)
  const aggregates = aggregateByDay(meals, waterLogs, request.dateKeys, keyFn)

  return Promise.all(
    aggregates.map(async (aggregate) => {
      const snapshot = await snapshotForDay(
        env,
        userId,
        aggregate,
        mealsByDay.get(aggregate.dateKey) ?? [],
        goal,
      )
      const consistencyPercent = calculateConsistencyPercent([snapshot])
      const breakdown = breakdownFromAggregate(
        aggregate,
        goal,
        snapshot.foodQualityPercent ?? 0,
        consistencyPercent,
      )
      return { dateKey: aggregate.dateKey, score: breakdown.score, label: breakdown.label }
    }),
  )
}
