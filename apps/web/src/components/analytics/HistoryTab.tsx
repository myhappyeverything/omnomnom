import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MEAL_TYPE_VALUES, type MealType } from '@omnomnom/shared'
import { fetchActiveGoal } from '@/api/goals'
import { listMeals } from '@/api/meals'
import { listWaterLogs } from '@/api/water'
import { Skeleton } from '@/components/ui/skeleton'
import { Divider } from '@/components/ui/divider'
import { DayScoreRing } from '@/components/analytics/DayScoreRing'
import { BreakfastIllustration } from '@/components/illustrations/BreakfastIllustration'
import { LunchIllustration } from '@/components/illustrations/LunchIllustration'
import { DinnerIllustration } from '@/components/illustrations/DinnerIllustration'
import { SnackIllustration } from '@/components/illustrations/SnackIllustration'
import { EmptyPlateIllustration } from '@/components/illustrations/EmptyPlateIllustration'
import { aggregateByDay, computeScoreTrend } from '@/utils/analytics'
import { getMonthGrid, getMonthRange, localDateKey } from '@/utils/date'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const MEAL_META: Record<
  MealType,
  { label: string; Illustration: typeof BreakfastIllustration }
> = {
  breakfast: { label: 'Breakfast', Illustration: BreakfastIllustration },
  lunch: { label: 'Lunch', Illustration: LunchIllustration },
  dinner: { label: 'Dinner', Illustration: DinnerIllustration },
  snack: { label: 'Snacks', Illustration: SnackIllustration },
}

export function HistoryTab() {
  const today = new Date()
  const [viewedYear, setViewedYear] = useState(today.getFullYear())
  const [viewedMonth, setViewedMonth] = useState(today.getMonth())
  const [selectedDateKey, setSelectedDateKey] = useState(localDateKey(today))

  const monthRange = useMemo(
    () => getMonthRange(viewedYear, viewedMonth),
    [viewedYear, viewedMonth],
  )
  const grid = useMemo(() => getMonthGrid(viewedYear, viewedMonth), [viewedYear, viewedMonth])

  const goalQuery = useQuery({ queryKey: ['goals', 'active'], queryFn: fetchActiveGoal })
  const mealsQuery = useQuery({
    queryKey: ['meals', 'history', monthRange.from],
    queryFn: () => listMeals(monthRange),
  })
  const waterQuery = useQuery({
    queryKey: ['water', 'history-month', monthRange.from],
    queryFn: () => listWaterLogs(monthRange),
  })

  const isLoading = goalQuery.isLoading || mealsQuery.isLoading || waterQuery.isLoading
  const goal = goalQuery.data ?? null
  const meals = mealsQuery.data ?? []
  const waterLogs = waterQuery.data ?? []

  const inMonthDayKeys = grid.filter((d) => d.inMonth).map((d) => d.dateKey)
  const dayAggregates = aggregateByDay(meals, waterLogs, inMonthDayKeys)
  // No per-day weight trend recompute for a calendar of scores — same simplification useAnalytics already makes.
  const scoreByDay = new Map(
    (goal ? computeScoreTrend(dayAggregates, goal, null) : []).map((p) => [p.dateKey, p.score]),
  )
  const hasLogByDay = new Map(dayAggregates.map((d) => [d.dateKey, d.hasLog]))

  const todayKey = localDateKey(today)
  const monthLabel = new Date(viewedYear, viewedMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const goToMonth = (delta: number) => {
    const next = new Date(viewedYear, viewedMonth + delta, 1)
    setViewedYear(next.getFullYear())
    setViewedMonth(next.getMonth())
  }

  const selectedMeals = meals.filter(
    (meal) => localDateKey(new Date(meal.loggedAt)) === selectedDateKey,
  )
  const selectedIsInMonth = inMonthDayKeys.includes(selectedDateKey)

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => goToMonth(-1)}
          className="text-muted-foreground hover:text-foreground p-2"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-foreground text-base font-semibold">{monthLabel}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => goToMonth(1)}
          className="text-muted-foreground hover:text-foreground p-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-72 w-full rounded-3xl" />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="text-muted-foreground text-xs font-medium">
                {label}
              </span>
            ))}
            {grid.map((day) =>
              day.inMonth ? (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  className="flex items-center justify-center py-0.5"
                >
                  <DayScoreRing
                    dayOfMonth={day.dayOfMonth}
                    score={scoreByDay.get(day.dateKey) ?? 0}
                    hasLog={hasLogByDay.get(day.dateKey) ?? false}
                    isToday={day.dateKey === todayKey}
                    isSelected={day.dateKey === selectedDateKey}
                  />
                </button>
              ) : (
                <div key={day.dateKey} />
              ),
            )}
          </div>

          <Divider className="my-6" />

          {!selectedIsInMonth ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Pick a day above to see what was logged.
            </p>
          ) : selectedMeals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <EmptyPlateIllustration />
              <p className="text-muted-foreground text-sm">Nothing logged on this day.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {MEAL_TYPE_VALUES.map((type) => {
                const typeMeals = selectedMeals.filter((m) => m.mealType === type)
                if (typeMeals.length === 0) return null
                const { label, Illustration } = MEAL_META[type]
                const items = typeMeals.flatMap((m) => m.items)
                return (
                  <div key={type} className="flex gap-3">
                    <Illustration />
                    <div className="flex-1">
                      <p className="text-foreground font-semibold">{label}</p>
                      <div className="mt-1 space-y-1">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="text-muted-foreground flex items-center justify-between text-sm"
                          >
                            <span>
                              {item.food?.name ?? 'Recipe item'} · {item.quantity}
                              {item.unit}
                            </span>
                            <span>{Math.round(item.calories)} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
