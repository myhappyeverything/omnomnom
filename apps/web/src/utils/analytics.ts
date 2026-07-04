import type { GoalRecord, MealRecord, WaterLogRecord } from '@purple/shared'
import { calculateNutritionScore } from '@purple/shared'
import { localDateKey } from './date'

export interface DayAggregate {
  dateKey: string
  calories: number
  proteinG: number
  fibreG: number
  waterMl: number
  mealTimestamps: string[]
  hasLog: boolean
}

/** `dayKeys` must be ascending (oldest first). */
export function aggregateByDay(
  meals: MealRecord[],
  waterLogs: WaterLogRecord[],
  dayKeys: string[],
): DayAggregate[] {
  const mealsByDay = new Map<string, MealRecord[]>()
  for (const meal of meals) {
    const key = localDateKey(new Date(meal.loggedAt))
    const list = mealsByDay.get(key) ?? []
    list.push(meal)
    mealsByDay.set(key, list)
  }

  const waterByDay = new Map<string, number>()
  for (const log of waterLogs) {
    const key = localDateKey(new Date(log.loggedAt))
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
      hasLog: dayMeals.length > 0,
    }
  })
}

export interface ScoreTrendPoint {
  dateKey: string
  score: number
}

/**
 * Reuses the exact same scoring engine as the dashboard's single-day score,
 * with a rolling 7-day window for the consistency component and the
 * period's overall weight trend applied to every day (recomputing a true
 * per-day weight trend isn't worth the complexity for a trend chart).
 */
export function computeScoreTrend(
  days: DayAggregate[],
  goal: GoalRecord,
  weightTrendKgPerWeek: number | null,
): ScoreTrendPoint[] {
  return days.map((day, index) => {
    const windowStart = Math.max(0, index - 6)
    const last7 = days.slice(windowStart, index + 1)
    const daysLoggedInLastWeek = last7.filter((d) => d.hasLog).length

    const { score } = calculateNutritionScore({
      caloriesConsumed: day.calories,
      calorieTarget: goal.calorieTarget,
      proteinConsumedG: day.proteinG,
      proteinTargetG: goal.proteinTargetG,
      fibreConsumedG: day.fibreG,
      fibreTargetG: goal.fibreTargetG,
      waterConsumedMl: day.waterMl,
      waterTargetMl: goal.waterTargetMl,
      daysLoggedInLastWeek,
      mealTimestamps: day.mealTimestamps,
      goalType: goal.goalType,
      weightTrendKgPerWeek,
    })
    return { dateKey: day.dateKey, score }
  })
}

/** Today is exempt from breaking the streak (the day isn't over); every prior day needs a log. */
export function computeLoggingStreak(days: DayAggregate[]): number {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]!
    const isToday = i === days.length - 1
    if (isToday && !day.hasLog) continue
    if (day.hasLog) streak++
    else break
  }
  return streak
}

export interface CountedItem {
  label: string
  count: number
}

export function mostCommonFoods(meals: MealRecord[], limit = 5): CountedItem[] {
  const counts = new Map<string, number>()
  for (const meal of meals) {
    for (const item of meal.items) {
      if (!item.food) continue
      counts.set(item.food.name, (counts.get(item.food.name) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function mostCommonMealTypes(meals: MealRecord[]): CountedItem[] {
  const counts = new Map<string, number>()
  for (const meal of meals) {
    counts.set(meal.mealType, (counts.get(meal.mealType) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ label: MEAL_TYPE_LABELS[type] ?? type, count }))
    .sort((a, b) => b.count - a.count)
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}
