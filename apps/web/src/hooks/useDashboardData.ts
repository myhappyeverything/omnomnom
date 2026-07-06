import { useQuery } from '@tanstack/react-query'
import { fetchActiveGoal } from '@/api/goals'
import { listMeals } from '@/api/meals'
import { listWaterLogs } from '@/api/water'
import { listWeightLogs } from '@/api/weight'
import { fetchNutritionScore } from '@/api/nutritionScore'
import { getDayRange, getLastNDaysRange, localDateKey } from '@/utils/date'
import { calculateWeightTrend } from '@/utils/weightTrend'

export interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
}

const EMPTY_TOTALS: DailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }

export function useDashboardData() {
  const todayRange = getDayRange()
  const weightRange = getLastNDaysRange(30)

  const goalQuery = useQuery({ queryKey: ['goals', 'active'], queryFn: fetchActiveGoal })
  const todayMealsQuery = useQuery({
    queryKey: ['meals', 'today', todayRange.from],
    queryFn: () => listMeals(todayRange),
  })
  const todayWaterQuery = useQuery({
    queryKey: ['water', 'today', todayRange.from],
    queryFn: () => listWaterLogs(todayRange),
  })
  const weightQuery = useQuery({
    queryKey: ['weight', 'recent', weightRange.from],
    queryFn: () => listWeightLogs(weightRange),
  })
  const scoreQuery = useQuery({
    queryKey: ['nutrition-score', todayRange.from],
    queryFn: () =>
      fetchNutritionScore({
        date: localDateKey(new Date()),
        from: todayRange.from,
        to: todayRange.to,
      }),
    enabled: !!goalQuery.data,
  })

  const isLoading = [goalQuery, todayMealsQuery, todayWaterQuery, weightQuery].some(
    (q) => q.isLoading,
  )

  const goal = goalQuery.data ?? null
  const todayMeals = todayMealsQuery.data ?? []
  const waterLogs = todayWaterQuery.data ?? []
  const weightLogs = weightQuery.data ?? []

  const totals = todayMeals.reduce<DailyTotals>(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProteinG,
      carbs: acc.carbs + meal.totalCarbsG,
      fat: acc.fat + meal.totalFatG,
      fibre: acc.fibre + meal.totalFibreG,
    }),
    EMPTY_TOTALS,
  )

  const waterTotalMl = waterLogs.reduce((sum, log) => sum + log.amountMl, 0)

  const sortedWeights = [...weightLogs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  )
  const currentWeightKg = sortedWeights.at(-1)?.weightKg ?? null
  const weightTrendKgPerWeek = calculateWeightTrend(weightLogs)

  return {
    isLoading,
    goal,
    totals,
    todayMeals,
    waterTotalMl,
    currentWeightKg,
    weightTrendKgPerWeek,
    score: scoreQuery.data ?? null,
    isScoreLoading: scoreQuery.isLoading,
  }
}
