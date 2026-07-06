import type { MealRecord, WaterLogRecord } from '../types/domain.js'
import { localDateKey } from './dateKey.js'

export interface DayAggregate {
  dateKey: string
  calories: number
  proteinG: number
  fibreG: number
  waterMl: number
  mealTimestamps: string[]
  /** How many of the 4 meal types (breakfast/lunch/dinner/snack) have at least one item logged. */
  mealTypesLogged: number
  hasLog: boolean
}

/** Groups meals by local day — exposed separately so callers needing the raw meals per day
 *  (e.g. the AI food-quality prompt) don't have to re-derive the same grouping themselves. */
export function groupMealsByDay(
  meals: MealRecord[],
  dateKeyForTimestamp: (isoTimestamp: string) => string = (iso) => localDateKey(new Date(iso)),
): Map<string, MealRecord[]> {
  const mealsByDay = new Map<string, MealRecord[]>()
  for (const meal of meals) {
    const key = dateKeyForTimestamp(meal.loggedAt)
    const list = mealsByDay.get(key) ?? []
    list.push(meal)
    mealsByDay.set(key, list)
  }
  return mealsByDay
}

/**
 * Buckets meals/water into local-day totals — shared between the web app's
 * analytics views and the API's scoring service so both use identical
 * day-boundary and aggregation logic. `dayKeys` must be ascending (oldest
 * first).
 */
export function aggregateByDay(
  meals: MealRecord[],
  waterLogs: WaterLogRecord[],
  dayKeys: string[],
  /** Defaults to the runtime's own local Date fields (correct in a browser); a server has no
   *  such thing and must pass an offset-aware key function instead (see localDateKeyAtOffset). */
  dateKeyForTimestamp: (isoTimestamp: string) => string = (iso) => localDateKey(new Date(iso)),
): DayAggregate[] {
  const mealsByDay = groupMealsByDay(meals, dateKeyForTimestamp)

  const waterByDay = new Map<string, number>()
  for (const log of waterLogs) {
    const key = dateKeyForTimestamp(log.loggedAt)
    waterByDay.set(key, (waterByDay.get(key) ?? 0) + log.amountMl)
  }

  return dayKeys.map((dateKey) => {
    const dayMeals = mealsByDay.get(dateKey) ?? []
    return {
      dateKey,
      calories: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
      proteinG: dayMeals.reduce((sum, m) => sum + m.totalProteinG, 0),
      fibreG: dayMeals.reduce((sum, m) => sum + m.totalFibreG, 0),
      waterMl: waterByDay.get(dateKey) ?? 0,
      mealTimestamps: dayMeals.map((m) => m.loggedAt),
      mealTypesLogged: new Set(dayMeals.map((m) => m.mealType)).size,
      hasLog: dayMeals.length > 0,
    }
  })
}
