import type { MealRecord } from '@omnomnom/shared'
import type { DayAggregate } from '@omnomnom/shared'

export type { DayAggregate }
export { aggregateByDay } from '@omnomnom/shared'

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
