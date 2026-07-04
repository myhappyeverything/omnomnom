import { useQuery } from '@tanstack/react-query'
import { fetchActiveGoal } from '@/api/goals'
import { listMeals } from '@/api/meals'
import { listWaterLogs } from '@/api/water'
import { listWeightLogs } from '@/api/weight'
import { getLastNDaysRange, lastNDayKeys } from '@/utils/date'
import { calculateWeightTrend } from '@/utils/weightTrend'
import {
  aggregateByDay,
  average,
  computeLoggingStreak,
  computeScoreTrend,
  mostCommonFoods,
  mostCommonMealTypes,
} from '@/utils/analytics'

export type AnalyticsRange = 'daily' | 'weekly' | 'monthly'

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  daily: 14,
  weekly: 56, // 8 weeks
  monthly: 180, // ~6 months
}

export function useAnalytics(range: AnalyticsRange) {
  const days = RANGE_DAYS[range]
  const dateRange = getLastNDaysRange(days)

  const goalQuery = useQuery({ queryKey: ['goals', 'active'], queryFn: fetchActiveGoal })
  const mealsQuery = useQuery({
    queryKey: ['meals', 'analytics', dateRange.from],
    queryFn: () => listMeals(dateRange),
  })
  const waterQuery = useQuery({
    queryKey: ['water', 'analytics', dateRange.from],
    queryFn: () => listWaterLogs(dateRange),
  })
  const weightQuery = useQuery({
    queryKey: ['weight', 'analytics', dateRange.from],
    queryFn: () => listWeightLogs(dateRange),
  })

  const isLoading =
    goalQuery.isLoading || mealsQuery.isLoading || waterQuery.isLoading || weightQuery.isLoading

  const goal = goalQuery.data ?? null
  const meals = mealsQuery.data ?? []
  const waterLogs = waterQuery.data ?? []
  const weightLogs = weightQuery.data ?? []

  const dayKeys = lastNDayKeys(days).reverse() // ascending, oldest first
  const dayAggregates = aggregateByDay(meals, waterLogs, dayKeys)

  const weightTrendKgPerWeek = calculateWeightTrend(weightLogs)
  const scoreTrend = goal ? computeScoreTrend(dayAggregates, goal, weightTrendKgPerWeek) : []
  const streak = computeLoggingStreak(dayAggregates)

  const averages = {
    calories: average(dayAggregates.map((d) => d.calories)),
    proteinG: average(dayAggregates.map((d) => d.proteinG)),
    fibreG: average(dayAggregates.map((d) => d.fibreG)),
    waterMl: average(dayAggregates.map((d) => d.waterMl)),
    score: average(scoreTrend.map((s) => s.score)),
  }

  return {
    isLoading,
    goal,
    days,
    averages,
    scoreTrend,
    weightTrendKgPerWeek,
    streak,
    topFoods: mostCommonFoods(meals),
    topMealTypes: mostCommonMealTypes(meals),
  }
}
