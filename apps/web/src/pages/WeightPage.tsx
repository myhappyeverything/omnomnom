import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Minus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Divider } from '@/components/ui/divider'
import { WeightChart } from '@/components/weight/WeightChart'
import { LogWeightDialog } from '@/components/weight/LogWeightDialog'
import { useWeightHistory } from '@/hooks/useWeightHistory'
import { useSettings } from '@/hooks/useSettings'
import { calculateWeightTrend, estimateGoalDate } from '@/utils/weightTrend'
import { deleteWeightLog } from '@/api/weight'
import { ApiError } from '@/api/client'
import { displayWeight, weightUnitLabel } from '@/utils/units'

const RANGE_OPTIONS = [
  { value: '7', label: '7D', days: 7 },
  { value: '30', label: '30D', days: 30 },
  { value: '90', label: '90D', days: 90 },
  { value: '365', label: '1Y', days: 365 },
] as const

export function WeightPage() {
  const { isLoading, goal, logs } = useWeightHistory()
  const settingsQuery = useSettings()
  const unitSystem = settingsQuery.data?.unitSystem ?? 'metric'
  const unitLabel = weightUnitLabel(unitSystem)
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
      <div className="space-y-6 px-6 pt-8 pb-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Weight</h1>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Current weight
          </p>
          <p className="text-foreground text-4xl font-bold tabular-nums">
            {currentWeightKg !== null
              ? `${displayWeight(currentWeightKg, unitSystem).toFixed(1)}`
              : '—'}
            <span className="text-muted-foreground ml-1 text-base font-normal">{unitLabel}</span>
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

      <div className="mt-6">
        <WeightChart points={filteredLogs} targetWeightKg={goal?.targetWeightKg} />
      </div>

      <Divider className="my-8" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Avg. weekly change
          </p>
          <div className="text-foreground mt-1 flex items-center gap-1.5 text-2xl font-bold">
            {trendKgPerWeek === null ? (
              <span className="text-muted-foreground text-base font-normal">Not enough data</span>
            ) : (
              <>
                {trendKgPerWeek > 0.05 ? (
                  <TrendingUp size={20} className="text-olive" />
                ) : trendKgPerWeek < -0.05 ? (
                  <TrendingDown size={20} className="text-olive" />
                ) : (
                  <Minus size={20} />
                )}
                {Math.abs(displayWeight(trendKgPerWeek, unitSystem)).toFixed(2)}
                <span className="text-muted-foreground text-sm font-normal">{unitLabel}</span>
              </>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Estimated goal date
          </p>
          <p className="text-foreground mt-1 text-2xl font-bold">
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
        </div>
      </div>

      <div className="mt-8">
        <LogWeightDialog suggestedWeightKg={currentWeightKg} unitSystem={unitSystem} />
      </div>

      {filteredLogs.length > 0 && (
        <>
          <Divider className="my-8" />
          <div>
            <p className="text-foreground mb-4 text-lg font-semibold">History</p>
            <div className="space-y-3">
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
                      <span className="text-foreground font-medium">
                        {displayWeight(log.weightKg, unitSystem).toFixed(1)} {unitLabel}
                      </span>
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
            </div>
          </div>
        </>
      )}
    </div>
  )
}
