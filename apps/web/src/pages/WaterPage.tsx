import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Flame, Trash2 } from 'lucide-react'
import { WATER_QUICK_ADD_ML } from '@omnomnom/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Divider } from '@/components/ui/divider'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { WaterGlassIllustration } from '@/components/illustrations/WaterGlassIllustration'
import { Skeleton } from '@/components/ui/skeleton'
import { createWaterLog, deleteWaterLog, type OfflineWaterLogRecord } from '@/api/water'
import { ApiError } from '@/api/client'
import { useWaterHistory } from '@/hooks/useWaterHistory'

const GLASS_COUNT = 8

export function WaterPage() {
  const { isLoading, targetMl, todayTotalMl, dailyTotals, streak, todayLogs } = useWaterHistory()
  const [customAmount, setCustomAmount] = useState(200)
  const [customOpen, setCustomOpen] = useState(false)
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: (amountMl: number) => createWaterLog({ amountMl }),
    onSuccess: (log, amountMl) => {
      if (log.pending) {
        queryClient.setQueriesData<OfflineWaterLogRecord[]>(
          { queryKey: ['water', 'history'] },
          (old) => (old ? [...old, log] : [log]),
        )
        toast.info(`${amountMl}ml queued — will sync once you're back online`)
      } else {
        queryClient.invalidateQueries({ queryKey: ['water'] })
        toast.success(`${amountMl}ml logged`)
      }
      setCustomOpen(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log water')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWaterLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not remove this entry')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 pt-8 pb-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    )
  }

  const maxDayTotal = Math.max(...dailyTotals.map((d) => d.totalMl), targetMl, 1)
  const perGlassMl = targetMl / GLASS_COUNT

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Water</h1>

      <div className="flex flex-col items-center text-center">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Today</p>
        <p className="text-foreground mt-1 text-6xl font-bold tabular-nums">
          {(todayTotalMl / 1000).toFixed(1)}
          <span className="text-muted-foreground text-2xl font-normal">L</span>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">of {(targetMl / 1000).toFixed(1)}L</p>
        {streak > 0 && (
          <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-sm">
            <Flame size={16} className="text-mustard" />
            {streak} day{streak === 1 ? '' : 's'} streak
          </div>
        )}
        <div className="mt-6 flex gap-2.5">
          {Array.from({ length: GLASS_COUNT }, (_, index) => {
            const glassAmount = Math.min(Math.max(todayTotalMl - index * perGlassMl, 0), perGlassMl)
            const fillPercent = perGlassMl > 0 ? (glassAmount / perGlassMl) * 100 : 0
            return <WaterGlassIllustration key={index} fillPercent={fillPercent} size={28} />
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-2">
        {WATER_QUICK_ADD_ML.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={addMutation.isPending}
            onClick={() => addMutation.mutate(amount)}
            className="bg-surface-muted text-foreground hover:bg-sky-blue/20 rounded-full py-2.5 text-sm font-medium transition-colors active:scale-95 disabled:opacity-50"
          >
            {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
          </button>
        ))}
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="bg-surface-muted text-foreground hover:bg-sky-blue/20 rounded-full py-2.5 text-sm font-medium transition-colors active:scale-95"
            >
              Custom
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add custom amount</DialogTitle>
            </DialogHeader>
            <Input
              type="number"
              min={1}
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
            />
            <DialogFooter>
              <Button
                className="w-full"
                disabled={customAmount <= 0 || addMutation.isPending}
                onClick={() => addMutation.mutate(customAmount)}
              >
                Add {customAmount}ml
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Divider className="my-8" />

      <div>
        <p className="text-foreground text-lg font-semibold">Last 14 days</p>
        <div className="mt-4 flex h-24 items-end gap-1.5">
          {[...dailyTotals].reverse().map((day) => (
            <div key={day.dateKey} className="flex h-full flex-1 flex-col items-end justify-end">
              <div
                className="bg-sky-blue w-full rounded-t-full"
                style={{ height: `${Math.max((day.totalMl / maxDayTotal) * 100, 3)}%` }}
                title={`${day.dateKey}: ${day.totalMl}ml`}
              />
            </div>
          ))}
        </div>
      </div>

      {todayLogs.length > 0 && (
        <>
          <Divider className="my-8" />
          <div>
            <p className="text-foreground mb-4 text-lg font-semibold">Today&apos;s entries</p>
            <div className="space-y-3">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between text-sm ${log.pending ? 'opacity-60' : ''}`}
                >
                  <span className="text-muted-foreground">
                    {log.pending
                      ? 'Pending sync'
                      : new Date(log.loggedAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{log.amountMl}ml</span>
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
