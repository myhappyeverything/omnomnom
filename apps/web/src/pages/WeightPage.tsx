import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Minus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeightChart } from '@/components/weight/WeightChart'
import { LogWeightDialog } from '@/components/weight/LogWeightDialog'
import { useWeightHistory } from '@/hooks/useWeightHistory'
import { calculateWeightTrend, estimateGoalDate } from '@/utils/weightTrend'
import { deleteWeightLog } from '@/api/weight'
import { ApiError } from '@/api/client'

const RANGE_OPTIONS = [
  { value: '7', label: '7D', days: 7 },
  { value: '30', label: '30D', days: 30 },
  { value: '90', label: '90D', days: 90 },
  { value: '365', label: '1Y', days: 365 },
] as const

export function WeightPage() {
  const { isLoading, goal, logs } = useWeightHistory()
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]['value']>('30')
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteWeightLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weight'] }),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not remove this entry')
    },
  })

  const days = RANGE_OPTIONS.find((r) => r.value === range)!.days
  const filteredLogs = useMemo(() => {
    const cutoff = Date.now() - days * 86_400_000
    return logs.filter((log) => new Date(log.loggedAt).getTime() >= cutoff)
  }, [logs, days])

  const currentWeightKg = logs.at(-1)?.weightKg ?? null
  const trendKgPerWeek = calculateWeightTrend(filteredLogs)
  const goalDate =
    currentWeightKg !== null && goal
      ? estimateGoalDate(currentWeightKg, goal.targetWeightKg, trendKgPerWeek)
      : null

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="rounded-card h-48 w-full" />
        <Skeleton className="rounded-card h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Current weight</p>
              <p className="text-foreground text-2xl font-semibold">
                {currentWeightKg !== null ? `${currentWeightKg.toFixed(1)} kg` : '—'}
              </p>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <TabsList>
                {RANGE_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <WeightChart points={filteredLogs} targetWeightKg={goal?.targetWeightKg} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs">Avg. weekly change</p>
            <div className="text-foreground mt-1 flex items-center gap-1.5 text-lg font-semibold">
              {trendKgPerWeek === null ? (
                <span className="text-muted-foreground text-base font-normal">Not enough data</span>
              ) : (
                <>
                  {trendKgPerWeek > 0.05 ? (
                    <TrendingUp size={18} className="text-accent" />
                  ) : trendKgPerWeek < -0.05 ? (
                    <TrendingDown size={18} className="text-accent" />
                  ) : (
                    <Minus size={18} />
                  )}
                  {Math.abs(trendKgPerWeek).toFixed(2)} kg
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs">Estimated goal date</p>
            <p className="text-foreground mt-1 text-lg font-semibold">
              {goalDate ? (
                goalDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              ) : (
                <span className="text-muted-foreground text-base font-normal">Not on track</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <LogWeightDialog suggestedWeightKg={currentWeightKg} />

      {filteredLogs.length > 0 && (
        <Card>
          <CardContent className="space-y-2">
            <p className="text-foreground text-sm font-medium">History</p>
            {[...filteredLogs]
              .reverse()
              .slice(0, 20)
              .map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between text-sm ${log.pending ? 'opacity-60' : ''}`}
                >
                  <span className="text-muted-foreground">
                    {log.pending
                      ? 'Pending sync'
                      : new Date(log.loggedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{log.weightKg.toFixed(1)} kg</span>
                    <button
                      type="button"
                      aria-label="Delete entry"
                      onClick={() => deleteMutation.mutate(log)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
