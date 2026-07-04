import { useState } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScoreTrendChart } from '@/components/analytics/ScoreTrendChart'
import { CountedList } from '@/components/analytics/CountedList'
import { useAnalytics, type AnalyticsRange } from '@/hooks/useAnalytics'

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export function AnalyticsPage() {
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
    <div className="space-y-4 p-4">
      <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(RANGE_LABELS) as AnalyticsRange[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {RANGE_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="rounded-card h-32 w-full" />
          <Skeleton className="rounded-card h-24 w-full" />
          <Skeleton className="rounded-card h-40 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <p className="text-foreground text-sm font-medium">Nutrition score trend</p>
                <p className="text-muted-foreground text-xs">
                  avg {Math.round(averages.score)}/100 · last {days} days
                </p>
              </div>
              <ScoreTrendChart points={scoreTrend} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-xs">Avg. calories/day</p>
                <p className="text-foreground mt-1 text-lg font-semibold">
                  {Math.round(averages.calories).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-xs">Avg. protein/day</p>
                <p className="text-foreground mt-1 text-lg font-semibold">
                  {Math.round(averages.proteinG)}g
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-xs">Avg. fibre/day</p>
                <p className="text-foreground mt-1 text-lg font-semibold">
                  {Math.round(averages.fibreG)}g
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-xs">Avg. water/day</p>
                <p className="text-foreground mt-1 text-lg font-semibold">
                  {(averages.waterMl / 1000).toFixed(1)}L
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-xs">Weight trend</p>
                <div className="text-foreground mt-1 flex items-center gap-1.5 text-lg font-semibold">
                  {weightTrendKgPerWeek === null ? (
                    <span className="text-muted-foreground text-base font-normal">No data</span>
                  ) : (
                    <>
                      {weightTrendKgPerWeek > 0.05 ? (
                        <TrendingUp size={18} className="text-accent" />
                      ) : weightTrendKgPerWeek < -0.05 ? (
                        <TrendingDown size={18} className="text-accent" />
                      ) : (
                        <Minus size={18} />
                      )}
                      {Math.abs(weightTrendKgPerWeek).toFixed(2)} kg/wk
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-xs">Logging streak</p>
                <p className="text-foreground mt-1 text-lg font-semibold">
                  {streak} day{streak === 1 ? '' : 's'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-2">
              <p className="text-foreground text-sm font-medium">Most common foods</p>
              <CountedList items={topFoods} emptyText="No foods logged in this period yet." />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2">
              <p className="text-foreground text-sm font-medium">Most common meals</p>
              <CountedList items={topMealTypes} emptyText="No meals logged in this period yet." />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
