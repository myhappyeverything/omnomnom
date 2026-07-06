import { useQuery } from '@tanstack/react-query'
import { fetchActiveGoal } from '@/api/goals'
import { listMeals } from '@/api/meals'
import { listWaterLogs } from '@/api/water'
import { listWeightLogs } from '@/api/weight'
import { fetchNutritionScoreRange } from '@/api/nutritionScore'
import { getLastNDaysRange, lastNDayKeys } from '@/utils/date'
import { calculateWeightTrend } from '@/utils/weightTrend'
import { aggregateByDay, average, computeLoggingStreak, mostCommonFoods, mostCommonMealTypes } from '@/utils/analytics'

export type AnalyticsRange = 'daily' | 'weekly' | 'monthly'

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  daily: 14,
  weekly: 56, // 8 weeks
  monthly: 180, // ~6 months
}

export function useAnalytics(range: AnalyticsRange) {
  const days = RANGE_DAYS[range]
  const dateRange = getLastNDaysRange(days)
  const dayKeys = lastNDayKeys(days).reverse() // ascending, oldest first

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
  const scoreTrendQuery = useQuery({
    queryKey: ['nutrition-score', 'range', dateRange.from, days],
    queryFn: () => fetchNutritionScoreRange({ dateKeys: dayKeys, ...dateRange }),
    enabled: !!goalQuery.data,
  })

  const isLoading =
    goalQuery.isLoading ||
    mealsQuery.isLoading ||
    waterQuery.isLoading ||
    weightQuery.isLoading ||
    scoreTrendQuery.isLoading

  const meals = mealsQuery.data ?? []
  const waterLogs = waterQuery.data ?? []
  const weightLogs = weightQuery.data ?? []
  const scoreTrend = scoreTrendQuery.data ?? []

  const dayAggregates = aggregateByDay(meals, waterLogs, dayKeys)

  const weightTrendKgPerWeek = calculateWeightTrend(weightLogs)
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
    days,
    averages,
    scoreTrend,
    weightTrendKgPerWeek,
    streak,
    topFoods: mostCommonFoods(meals),
    topMealTypes: mostCommonMealTypes(meals),
  }
}
