import { useState } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Divider } from '@/components/ui/divider'
import { Skeleton } from '@/components/ui/skeleton'
import { ScoreTrendChart } from '@/components/analytics/ScoreTrendChart'
import { CountedList } from '@/components/analytics/CountedList'
import { useAnalytics, type AnalyticsRange } from '@/hooks/useAnalytics'

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export function TrendsTab() {
  const [range, setRange] = useState<AnalyticsRange>('daily')
  const {
    isLoading,
    averages,
    scoreTrend,
    weightTrendKgPerWeek,
    streak,
    topFoods,
    topMealTypes,
    days,
  } = useAnalytics(range)

  return (
    <div>
      <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
        <TabsList variant="line" className="w-full justify-start gap-6 p-0">
          {(Object.keys(RANGE_LABELS) as AnalyticsRange[]).map((key) => (
            <TabsTrigger key={key} value={key} className="flex-none px-0 text-base">
              {RANGE_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Divider className="mt-4" />

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="text-foreground text-lg font-semibold">Nutrition score trend</p>
              <p className="text-muted-foreground text-xs">
                avg {Math.round(averages.score)}/100 · last {days} days
              </p>
            </div>
            <div className="mt-4">
              <ScoreTrendChart points={scoreTrend} />
            </div>
          </div>

          <Divider className="my-8" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Avg. calories/day
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                {Math.round(averages.calories).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Avg. protein/day
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                {Math.round(averages.proteinG)}g
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Avg. fibre/day
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                {Math.round(averages.fibreG)}g
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Avg. water/day
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                {(averages.waterMl / 1000).toFixed(1)}L
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Weight trend
              </p>
              <div className="text-foreground mt-1 flex items-center gap-1.5 text-2xl font-bold">
                {weightTrendKgPerWeek === null ? (
                  <span className="text-muted-foreground text-base font-normal">No data</span>
                ) : (
                  <>
                    {weightTrendKgPerWeek > 0.05 ? (
                      <TrendingUp size={20} className="text-olive" />
                    ) : weightTrendKgPerWeek < -0.05 ? (
                      <TrendingDown size={20} className="text-olive" />
                    ) : (
                      <Minus size={20} />
                    )}
                    {Math.abs(weightTrendKgPerWeek).toFixed(2)}
                    <span className="text-muted-foreground text-sm font-normal">kg/wk</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Logging streak
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                {streak} day{streak === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <Divider className="my-8" />

          <div>
            <p className="text-foreground text-lg font-semibold">Most common foods</p>
            <div className="mt-4">
              <CountedList items={topFoods} emptyText="No foods logged in this period yet." />
            </div>
          </div>

          <Divider className="my-8" />

          <div>
            <p className="text-foreground text-lg font-semibold">Most common meals</p>
            <div className="mt-4">
              <CountedList items={topMealTypes} emptyText="No meals logged in this period yet." />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
